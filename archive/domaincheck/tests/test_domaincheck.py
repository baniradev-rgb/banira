"""Offline tests for domaincheck using a fake resolver (no network needed).
Run: python3 -m pytest tools/domaincheck/tests -q
"""
import csv, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import domaincheck as dc


class FakeResolver:
    def __init__(self, txt=None, mx=None, down=False):
        self._txt, self._mx, self.down = txt or {}, mx or {}, down

    def txt(self, name):
        if self.down:
            raise dc.DNSUnavailable("timeout")
        return self._txt.get(name)

    def mx(self, name):
        if self.down:
            raise dc.DNSUnavailable("timeout")
        return self._mx.get(name, [])


GOOD = FakeResolver(
    txt={"good.com": ["v=spf1 include:_spf.google.com -all"],
         "_dmarc.good.com": ["v=DMARC1; p=reject; rua=mailto:d@good.com"],
         "google._domainkey.good.com": ["v=DKIM1; k=rsa; p=MIIB..."]},
    mx={"good.com": ["aspmx.l.google.com"]})

BARE = FakeResolver(txt={}, mx={"bare.com": ["bare-com.mail.protection.outlook.com"]})


def test_good_domain_grades_a():
    r = dc.check("good.com", GOOD)
    assert r.grade == "A" and r.mail_provider == "Google Workspace"
    assert r.dkim_selectors_found == ["google"] and not r.is_prospect


def test_missing_spf_and_dmarc_is_f():
    r = dc.check("bare.com", BARE)
    assert r.grade == "F" and r.mail_provider == "Microsoft 365" and r.is_prospect


def test_p_none_is_c():
    res = FakeResolver(txt={"x.com": ["v=spf1 include:spf.protection.outlook.com -all"],
                            "_dmarc.x.com": ["v=DMARC1; p=none; rua=mailto:a@x.com"]},
                       mx={"x.com": ["x-com.mail.protection.outlook.com"]})
    assert dc.check("x.com", res).grade == "C"


def test_two_spf_records_critical():
    rec, f = dc.check_spf(["v=spf1 -all", "v=spf1 include:a.com ~all"])
    assert f[0].severity == "critical"


def test_plus_all_critical():
    _, f = dc.check_spf(["v=spf1 +all"])
    assert any(x.severity == "critical" and "+all" in x.message for x in f)


def test_too_many_lookups():
    rec = "v=spf1 " + " ".join(f"include:s{i}.com" for i in range(11)) + " -all"
    _, f = dc.check_spf([rec])
    assert any("limit is 10" in x.message for x in f)


def test_dmarc_pct_warning():
    _, p, f = dc.check_dmarc(["v=DMARC1; p=quarantine; pct=25; rua=mailto:a@b.com"])
    assert p == "quarantine" and any("25%" in x.message for x in f)


def test_parked_domain_locked_down_is_a():
    res = FakeResolver(txt={"p.com": ["v=spf1 -all"], "_dmarc.p.com": ["v=DMARC1; p=reject; rua=mailto:a@p.com"]})
    assert dc.check("p.com", res).grade == "A"


def test_clean_domain_variants():
    assert dc.clean_domain("https://www.Example.com/about") == "example.com"
    assert dc.clean_domain("jane@firm.co.uk") == "firm.co.uk"


def test_invalid_domain_raises():
    import pytest
    with pytest.raises(ValueError):
        dc.clean_domain("not a domain")


def test_dns_down_reports_error_not_grade():
    r = dc.check("good.com", FakeResolver(down=True))
    assert r.grade == "?" and r.errors


def test_lying_dns_is_detected_by_canary():
    class Lying(FakeResolver):
        def verify(self):
            canary = self.txt("_dmarc.google.com")
            if not canary:
                raise dc.DNSUnavailable("canary failed")
    r = dc.check("bare.com", Lying(txt={}, mx={}))
    assert r.grade == "?" and "canary" in r.errors[0]


def test_batch(tmp_path):
    src = tmp_path / "in.csv"
    src.write_text("company,domain\nGood,good.com\nBad,not a domain\n")
    out = tmp_path / "out.csv"
    assert dc.run_batch(str(src), str(out), GOOD) == 0
    rows = list(csv.DictReader(open(out)))
    assert rows[0]["grade"] == "A" and rows[1]["error"].startswith("Not a valid")
