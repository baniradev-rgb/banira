# Outreach drafts — FOR OWNER APPROVAL (nothing sent)

Placeholders in {braces} are filled from the domaincheck results CSV. Every cold message must carry: sender's real name, Banira postal address, and an opt-out line.

---
## D1 — Warm contact (owner's network)
Subject: quick favour — 2 minutes

Hi {first_name},

I'm starting a small service called Banira that sets up email authentication for professional firms — the DNS settings that stop people sending email pretending to be you, and stop your own mail landing in spam.

I checked {domain}'s public records and {plain_finding}. Happy to send you the one-page report, no charge. If it's useful, I'd also value 15 minutes of your honest feedback on whether this is something firms like yours would pay for.

{owner_name}

---
## D2 — Targeted firm (cold, first touch)
Subject: {domain} — DMARC record {missing|in monitor mode}

Hi {first_name},

I set up email authentication for small accounting and real-estate firms. Looking at {domain}'s public DNS (anyone can see these records), {plain_finding}.

In practice that means {consequence — e.g. "an email can be sent that appears to come from @{domain} and most inboxes will still deliver it"}.

I've put the details in a one-page report — want me to send it? It's free and there's nothing to install.

{owner_name}, Banira
{postal_address} · Reply "no thanks" and I won't contact you again.

**Phishing-optics safeguards:** no links or attachments in the first message; the report is sent only after they reply; we never ask for passwords; the owner's real name and LinkedIn are verifiable.

---
## D3 — Follow-up (once, 5 business days later)
Subject: Re: {domain} — DMARC record

Hi {first_name}, just one follow-up in case this got buried. The fix usually takes under an hour of your time and is done step by step so nothing breaks. If it's not a priority, no problem — I won't follow up again.

---
## D4 — Partner (bookkeeper / web designer / small MSP)
Subject: an add-on for your clients' email

Hi {first_name},

Many small firms you work with probably have email authentication half-done — SPF but no DMARC, or DMARC stuck in monitor mode. I take that off your plate for a fixed $349 per domain, carry it all the way to enforcement, and pay a 20% referral fee. You stay the client's main contact.

Would a 15-minute call be worth it to see if it fits?

---
## Call outline (15 min)
1. "How does email work at your firm — who sends invoices, which tools?" (inventory)
2. "Have you had bounces, spam-folder complaints or spoofed emails?" (pain, in their words)
3. Show their report; explain the one or two findings.
4. Offer Seal at $349 with the 45-day guarantee; send payment link if yes.
5. If no: "What would make this worth doing?" — record the exact answer.
