#!/usr/bin/env python3
"""Banira domaincheck — passive email-authentication check for a domain.

Reads only PUBLIC DNS records (MX, SPF, DMARC, common DKIM selectors).
It never connects to the company's website or mail servers and sends no email.

Usage:
  python3 domaincheck.py example.com                 # human-readable report
  python3 domaincheck.py example.com --json          # JSON
  python3 domaincheck.py --batch leads.csv --out results.csv   # CSV with a 'domain' column

Exit codes: 0 ok, 1 usage error, 2 DNS unavailable for every query.
Requires: dnspython (pip install dnspython)
"""
from __future__ import annotations
import argparse, csv, json, re, sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

VERSION = "0.1.0"

DKIM_SELECTORS = ["google", "selector1", "selector2", "k1", "k2", "s1", "s2",
                  "default", "dkim", "mail", "zoho", "mxvault", "smtp", "pm", "mandrill"]

MX_PROVIDERS = [
    (r"aspmx\.l\.google\.com|googlemail\.com|smtp\.google\.com", "Google Workspace"),
    (r"mail\.protection\.outlook\.com", "Microsoft 365"),
    (r"zoho\.(com|eu|in)", "Zoho Mail"),
    (r"pphosted\.com", "Proofpoint"),
    (r"mimecast", "Mimecast"),
    (r"secureserver\.net", "GoDaddy"),
    (r"emailsrvr\.com", "Rackspace"),
    (r"messagingengine\.com", "Fastmail"),
]


class DNSUnavailable(Exception):
    pass


class Resolver:
    """Thin wrapper so tests can inject fake DNS data."""
    def __init__(self, timeout: float = 4.0):
        import dns.resolver  # imported lazily so tests run without dnspython
        self._dns = dns
        self.r = dns.resolver.Resolver()
        self.r.lifetime = timeout

    def txt(self, name: str) -> list[str] | None:
        """Return TXT strings, [] if the name exists with no TXT, None if NXDOMAIN."""
        d = self._dns
        try:
            ans = self.r.resolve(name, "TXT")
            return [b"".join(rr.strings).decode("utf-8", "replace") for rr in ans]
        except d.resolver.NXDOMAIN:
            return None
        except d.resolver.NoAnswer:
            return []
        except (d.resolver.NoNameservers, d.exception.Timeout) as e:
            raise DNSUnavailable(str(e))

    _verified = False

    def verify(self) -> None:
        """Canary: refuse to report if DNS is lying. Some sandboxes/proxies answer
        NXDOMAIN for everything, which would wrongly grade every domain 'F'
        (and could put a false claim in outreach)."""
        if self._verified:
            return
        canary = self.txt("_dmarc.google.com")
        if not canary or not any("v=DMARC1" in r for r in canary):
            raise DNSUnavailable("canary lookup _dmarc.google.com failed — DNS results cannot be trusted here")
        self._verified = True

    def mx(self, name: str) -> list[str]:
        d = self._dns
        try:
            return sorted(str(rr.exchange).rstrip(".").lower() for rr in self.r.resolve(name, "MX"))
        except (d.resolver.NXDOMAIN, d.resolver.NoAnswer):
            return []
        except (d.resolver.NoNameservers, d.exception.Timeout) as e:
            raise DNSUnavailable(str(e))


@dataclass
class Finding:
    severity: str   # "critical" | "warning" | "ok" | "info"
    area: str       # MX | SPF | DKIM | DMARC
    message: str    # plain English for the business owner
    fix: str = ""   # what Banira would do


@dataclass
class Report:
    domain: str
    checked_at: str
    tool_version: str = VERSION
    mail_provider: str = "Unknown"
    mx: list = field(default_factory=list)
    spf: str | None = None
    dmarc: str | None = None
    dmarc_policy: str | None = None
    dkim_selectors_found: list = field(default_factory=list)
    findings: list = field(default_factory=list)
    grade: str = "?"
    errors: list = field(default_factory=list)

    @property
    def is_prospect(self) -> bool:
        """True when there is something Banira can genuinely fix."""
        return self.grade in ("C", "D", "F")


def clean_domain(raw: str) -> str:
    d = raw.strip().lower()
    d = re.sub(r"^[a-z]+://", "", d).split("/")[0].split("@")[-1]
    if d.startswith("www."):
        d = d[4:]
    if not re.fullmatch(r"(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}", d):
        raise ValueError(f"Not a valid domain: {raw!r}")
    return d


def parse_tags(record: str) -> dict:
    tags = {}
    for part in record.split(";"):
        if "=" in part:
            k, v = part.split("=", 1)
            tags[k.strip().lower()] = v.strip()
    return tags


def check_spf(records: list[str] | None) -> tuple[str | None, list[Finding]]:
    spf = [r for r in (records or []) if r.lower().startswith("v=spf1")]
    if not spf:
        return None, [Finding("critical", "SPF", "No SPF record. Receiving servers cannot tell which services may send email as this domain.",
                              "Publish one SPF record listing every service that sends your email.")]
    if len(spf) > 1:
        return spf[0], [Finding("critical", "SPF", f"{len(spf)} SPF records found. Having more than one makes SPF fail everywhere.",
                                "Merge them into a single SPF record.")]
    rec = spf[0]
    out = []
    terms = rec.lower().split()
    lookups = sum(1 for t in terms if re.match(r"^[+~?-]?(include:|a\b|a:|mx\b|mx:|exists:|redirect=|ptr)", t))
    if lookups > 10:
        out.append(Finding("critical", "SPF", f"SPF needs at least {lookups} DNS lookups at the top level; the limit is 10, so SPF will fail.",
                           "Flatten or trim the SPF record."))
    elif lookups >= 8:
        out.append(Finding("warning", "SPF", f"SPF uses {lookups} top-level DNS lookups (nested includes add more; the limit is 10).",
                           "Review includes before adding new senders."))
    if "+all" in terms:
        out.append(Finding("critical", "SPF", "SPF ends in '+all', which lets anyone on the internet send as this domain.", "Change to '-all' or '~all'."))
    elif "?all" in terms or not any(t.endswith("all") for t in terms) and not any(t.startswith("redirect=") for t in terms):
        out.append(Finding("warning", "SPF", "SPF does not tell receivers to reject unlisted senders.", "End the record with '~all' or '-all'."))
    if not out:
        out.append(Finding("ok", "SPF", "SPF record present and well-formed (top-level check)."))
    return rec, out


def check_dmarc(records: list[str] | None) -> tuple[str | None, str | None, list[Finding]]:
    dm = [r for r in (records or []) if r.lower().replace(" ", "").startswith("v=dmarc1")]
    if not dm:
        return None, None, [Finding("critical", "DMARC", "No DMARC record. Nothing stops criminals sending email that looks like it comes from this domain, and Google, Yahoo and Microsoft require DMARC for bulk senders.",
                                    "Publish DMARC with reporting, then move step by step to quarantine/reject.")]
    if len(dm) > 1:
        return dm[0], None, [Finding("critical", "DMARC", "More than one DMARC record — receivers will ignore DMARC entirely.", "Keep exactly one record.")]
    rec = dm[0]
    t = parse_tags(rec)
    p = t.get("p", "").lower()
    out = []
    if p not in ("none", "quarantine", "reject"):
        out.append(Finding("critical", "DMARC", "DMARC record has a missing or invalid policy (p=).", "Fix the record syntax."))
    elif p == "none":
        out.append(Finding("warning", "DMARC", "DMARC is in monitor-only mode (p=none): spoofed email is still delivered.",
                           "Review reports, fix legitimate senders, then move to quarantine and reject."))
    else:
        pct = t.get("pct", "100")
        if pct != "100":
            out.append(Finding("warning", "DMARC", f"DMARC policy '{p}' applies to only {pct}% of failing mail.", "Raise pct to 100 when reports are clean."))
        else:
            out.append(Finding("ok", "DMARC", f"DMARC enforced (p={p}). Spoofed email is {'rejected' if p == 'reject' else 'sent to spam'}."))
    if "rua" not in t:
        out.append(Finding("warning", "DMARC", "DMARC has no reporting address (rua), so nobody sees who is sending as this domain.",
                           "Add an aggregate-report address and review reports monthly."))
    return rec, p or None, out


def check_dkim(resolver, domain: str) -> tuple[list[str], list[Finding]]:
    found = []
    for sel in DKIM_SELECTORS:
        recs = resolver.txt(f"{sel}._domainkey.{domain}")
        if recs and any("p=" in r for r in recs):
            found.append(sel)
    if found:
        return found, [Finding("ok", "DKIM", f"DKIM keys found for selector(s): {', '.join(found)}.")]
    return [], [Finding("info", "DKIM", "No DKIM key found at common selectors. DKIM may still exist under a custom selector; confirm with the customer's mail admin.",
                        "Enable DKIM signing in the mail provider and every sending service.")]


def grade(findings: list[Finding], dmarc_policy: str | None, has_mx: bool) -> str:
    crit = sum(f.severity == "critical" for f in findings)
    warn = sum(f.severity == "warning" for f in findings)
    if not has_mx and dmarc_policy == "reject":
        return "A"   # parked/non-mail domain correctly locked down
    if crit >= 2:
        return "F"
    if crit == 1:
        return "D"
    if dmarc_policy == "none" or warn >= 2:
        return "C"
    if warn == 1:
        return "B"
    return "A"


def check(domain: str, resolver=None) -> Report:
    domain = clean_domain(domain)
    resolver = resolver or Resolver()
    rep = Report(domain=domain, checked_at=datetime.now(timezone.utc).isoformat(timespec="seconds"))
    try:
        if hasattr(resolver, "verify"):
            resolver.verify()
        rep.mx = resolver.mx(domain)
        for pat, name in MX_PROVIDERS:
            if any(re.search(pat, m) for m in rep.mx):
                rep.mail_provider = name
                break
        if not rep.mx:
            rep.findings.append(Finding("info", "MX", "No MX records: this domain does not appear to receive email."))
        rep.spf, f_spf = check_spf(resolver.txt(domain))
        rep.dmarc, rep.dmarc_policy, f_dm = check_dmarc(resolver.txt(f"_dmarc.{domain}"))
        rep.dkim_selectors_found, f_dk = check_dkim(resolver, domain)
        rep.findings += f_spf + f_dm + f_dk
        rep.grade = grade(rep.findings, rep.dmarc_policy, bool(rep.mx))
    except DNSUnavailable as e:
        rep.errors.append(f"DNS unavailable: {e}")
        rep.grade = "?"
    return rep


def to_text(rep: Report) -> str:
    icon = {"critical": "✗", "warning": "!", "ok": "✓", "info": "·"}
    lines = [f"Banira domain check — {rep.domain}  (grade {rep.grade})",
             f"Checked {rep.checked_at} · mail provider: {rep.mail_provider}", ""]
    for f in rep.findings:
        lines.append(f" {icon[f.severity]} [{f.area}] {f.message}")
        if f.fix and f.severity in ("critical", "warning"):
            lines.append(f"     → {f.fix}")
    for e in rep.errors:
        lines.append(f" ? {e}")
    lines += ["", "Passive check of public DNS only. DKIM under custom selectors cannot be seen from outside."]
    return "\n".join(lines)


def run_batch(path_in: str, path_out: str, resolver=None) -> int:
    rows = list(csv.DictReader(open(path_in, newline="", encoding="utf-8")))
    if not rows or "domain" not in rows[0]:
        print("Input CSV needs a 'domain' column", file=sys.stderr)
        return 1
    fields = list(rows[0].keys()) + ["grade", "mail_provider", "dmarc_policy", "spf_present", "dkim_found", "critical", "warnings", "is_prospect", "checked_at", "error"]
    dns_ok = 0
    with open(path_out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for row in rows:
            try:
                rep = check(row["domain"], resolver)
                err = "; ".join(rep.errors)
                dns_ok += 0 if rep.errors else 1
            except ValueError as e:
                rep, err = None, str(e)
            out = dict(row)
            if rep:
                out.update(grade=rep.grade, mail_provider=rep.mail_provider, dmarc_policy=rep.dmarc_policy or "",
                           spf_present=bool(rep.spf), dkim_found=",".join(rep.dkim_selectors_found),
                           critical=sum(f.severity == "critical" for f in rep.findings),
                           warnings=sum(f.severity == "warning" for f in rep.findings),
                           is_prospect=rep.is_prospect, checked_at=rep.checked_at)
            out["error"] = err
            w.writerow(out)
    print(f"Checked {len(rows)} domains ({dns_ok} with DNS answers) → {path_out}")
    return 0 if dns_ok else 2


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("domain", nargs="?")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--batch")
    ap.add_argument("--out", default="domaincheck_results.csv")
    a = ap.parse_args(argv)
    if a.batch:
        return run_batch(a.batch, a.out)
    if not a.domain:
        ap.print_help()
        return 1
    try:
        rep = check(a.domain)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 1
    if a.json:
        d = asdict(rep)
        d["is_prospect"] = rep.is_prospect
        print(json.dumps(d, indent=2))
    else:
        print(to_text(rep))
    return 2 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
