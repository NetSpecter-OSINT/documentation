---
title: Email Security
description: How NetSpecter's email security module works, what SPF, DKIM, and DMARC reveal about a domain's email configuration, and practical examples across different use cases.
---

# Email Security

The Email Security module audits the email authentication infrastructure of a domain. It checks three independent but complementary standards — SPF, DKIM, and DMARC — that together determine how well a domain is protected against email spoofing and impersonation.

Email spoofing is the practice of sending emails that appear to come from a domain the sender does not control. It is one of the most common techniques used in phishing, business email compromise, and fraud. The three standards this module checks exist specifically to prevent it — and their absence or misconfiguration leaves a domain and everyone who communicates with it significantly more exposed.

---

## When to use this module

Use Email Security when you want to:

- Determine whether a domain is protected against spoofing and impersonation
- Verify that your own domain's email authentication is correctly configured
- Check whether a domain is capable of receiving email at all
- Audit email security as part of a broader infrastructure review
- Assess the risk of receiving fraudulent emails that appear to come from a specific domain
- Identify domains that attackers could easily impersonate

**Common scenarios:**

- A company's IT team wants to verify their own SPF, DKIM, and DMARC are correctly configured before rolling out a new email system
- A security analyst is assessing whether a domain they are investigating has the infrastructure expected of a legitimate business
- A system administrator is troubleshooting email deliverability issues and wants to check their DNS-based email records
- A fraud team is investigating a phishing campaign and wants to understand how easily the impersonated domain can be spoofed
- An individual has received a suspicious email and wants to check whether the sending domain has authentication controls in place

---

## Background — why email authentication matters

Email was designed in the 1970s with no authentication whatsoever. Any server can send an email claiming to be from any address. The three standards checked by this module were developed decades later to address this fundamental flaw.

Without all three working together, anyone can send an email that appears to come from `contact@your-company.com` — and many mail clients will display it with no warning. This is why phishing emails so convincingly appear to come from banks, payment processors, HR departments, and executive colleagues.

---

## What the results tell you

### SPF — Sender Policy Framework

SPF defines which mail servers are authorised to send email on behalf of a domain. It is published as a DNS TXT record and checked by receiving mail servers when they receive an incoming message.

**How to read an SPF record:**

```
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```

| Component | Meaning |
|---|---|
| `v=spf1` | SPF version identifier — always present |
| `include:domain` | Authorises all servers listed in that domain's SPF record |
| `ip4:1.2.3.4` | Authorises a specific IPv4 address |
| `ip6:` | Authorises a specific IPv6 address |
| `a` | Authorises the domain's own A record |
| `mx` | Authorises the domain's MX servers |
| `-all` | Hardfail — reject all mail from unlisted servers |
| `~all` | Softfail — accept but mark mail from unlisted servers |
| `+all` | Pass all — effectively no restriction (dangerous) |
| `?all` | Neutral — no policy applied |

**SPF policy risk levels:**

| Policy | Risk | Notes |
|---|---|---|
| `-all` (hardfail) | Low | Strongest policy — unauthorised senders are rejected |
| `~all` (softfail) | Medium | Unauthorised mail is accepted but marked — commonly used during migration |
| `+all` (pass all) | High | No restriction — anyone can send as this domain |
| Missing SPF entirely | High | No protection — domain is fully spoofable |

A softfail (`~all`) is very common and not inherently alarming — many legitimate organisations use it. However it is weaker than a hardfail and means spoofed emails may still reach recipients rather than being rejected outright.

---

### DKIM — DomainKeys Identified Mail

DKIM adds a cryptographic signature to outgoing emails. The sending mail server signs each message with a private key, and the signature is published in a DNS TXT record under a specific selector subdomain. Receiving servers can then verify the signature against the public key to confirm the message genuinely came from an authorised server and was not modified in transit.

**How DKIM selectors work:**

DKIM records are published under subdomain patterns like `selector._domainkey.example.com`. Because the selector name can be anything the domain owner chooses, NetSpecter probes 48 commonly used selector names:

```
Google Workspace:   google, google2, googledomains
Microsoft 365:      selector1, selector2
Mailchimp/Mandrill: k1, k2, k3, mandrill
SendGrid:           s1, s2, smtpapi, em, sg
Amazon SES:         amazonses
Mailgun:            mailo, pic, mta, mx
Proofpoint:         proofpoint, pp1, pp2
Mimecast:           mc1, mc2
HubSpot:            hubspot1, hubspot2, hs1, hs2
Postmark:           pm
Zendesk:            zendesk1, zendesk2
Salesforce:         sfdc, sf1
Zoho:               zoho, zmail
Fastmail:           fm1, fm2, fm3
ProtonMail:         protonmail
Generic/fallback:   default, mail, email, dkim, dkim1, dkim2, key1, key2, smtp
```

If any of these resolve to a TXT record containing a DKIM public key, DKIM is confirmed as configured for at least one mail stream. Not finding a common selector does not definitively mean DKIM is absent — the domain may use a non-standard selector name that NetSpecter does not probe.

**What DKIM does not protect against:**

DKIM verifies the message came from an authorised server and was not tampered with. It does not prevent a completely different domain from sending mail — it only authenticates messages that are sent using the correct private key. DKIM works best when combined with DMARC.

---

### DMARC — Domain-based Message Authentication Reporting and Conformance

DMARC is the policy layer that sits above SPF and DKIM. It tells receiving mail servers what to do when a message fails SPF or DKIM checks, and where to send reports about authentication failures.

DMARC is published as a DNS TXT record under `_dmarc.example.com`.

**A typical DMARC record:**

```
v=DMARC1; p=reject; rua=mailto:dmarc-reports@example.com
```

**DMARC policy options:**

| Policy | What happens to failing mail | Risk if missing |
|---|---|---|
| `p=reject` | Failing mail is rejected outright | Strongest — spoofed mail is blocked before delivery |
| `p=quarantine` | Failing mail goes to spam | Good — spoofed mail is filtered rather than rejected |
| `p=none` | Nothing — monitoring only | Weak — no enforcement, reports only |
| Missing DMARC | No policy at all | Domain is vulnerable to spoofing regardless of SPF/DKIM |

The policy strength matters significantly. `p=none` is often used when first implementing DMARC to collect reports without disrupting mail flow — but a domain that stays on `p=none` permanently provides no actual protection. `p=reject` is the gold standard.

**Aggregate reports (rua):**

The `rua` tag specifies where receiving servers should send XML reports about authentication failures. These reports are invaluable for understanding who is sending mail claiming to be your domain. Their absence means the domain owner has no visibility into spoofing attempts.

---

### MX records

The module also checks MX records to confirm the domain can receive email at all. A domain with no MX records cannot receive email — a significant finding when the domain claims to belong to an operational business with a communications function.

---

## Reading the output

**A well-configured domain:**

```
SPF              PRESENT
SPF Record       v=spf1 include:_spf.google.com -all
SPF Policy       HARDFAIL (-all)

DKIM [google]    PRESENT
DKIM [selector1] PRESENT
DKIM Selectors   2

DMARC            PRESENT
DMARC Record     v=DMARC1; p=reject; rua=mailto:reports@example.com
DMARC Policy     REJECT

MX Records       2 found
  Priority 1     aspmx.l.google.com.
  Priority 5     alt1.aspmx.l.google.com.
```

SPF with hardfail, two DKIM selectors found, DMARC on reject policy, and MX records confirming the domain receives email. This is a properly configured email security posture.

**A poorly configured domain:**

```
SPF              MISSING - spoofing risk

DKIM             No common selectors found (manual check advised)

DMARC            MISSING

MX Records       NONE - cannot receive email
```

No SPF, no DKIM, no DMARC, and no MX records. This domain cannot receive email and has no anti-spoofing controls whatsoever. Anyone can send an email appearing to come from this domain with no technical barrier.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| SPF missing | Domain fully spoofable — no sending restriction |
| SPF `+all` | Deliberately open — no sender restriction |
| SPF `~all` only | Weak enforcement — spoofed mail may still be delivered |
| No DKIM selectors found | No cryptographic signing — or non-standard selectors in use |
| DMARC missing | No enforcement policy — SPF and DKIM provide no real protection without it |
| DMARC `p=none` | Monitoring only — no enforcement |
| No MX records | Domain cannot receive email — likely send-only, redirect, or shell domain |
| MX pointing to shared hosting | Budget email infrastructure inconsistent with enterprise claims |
| SPF, DKIM, and DMARC all present with strong policies | Well-managed email infrastructure |

---

## Examples across different use cases

### Verifying your own email configuration

A startup has just migrated their email to Google Workspace and wants to confirm everything is configured correctly:

```
SPF              PRESENT
SPF Record       v=spf1 include:_spf.google.com ~all
SPF Policy       SOFTFAIL (~all)

DKIM [google]    PRESENT
DKIM Selectors   1

DMARC            PRESENT
DMARC Policy     NONE
```

SPF and DKIM are in place and working. DMARC is present but on `p=none` — this is appropriate during initial rollout to collect reports without risk of blocking legitimate mail. The administrator sets a reminder to move to `p=quarantine` after two weeks of clean reports, then to `p=reject` after another two weeks.

---

### Phishing investigation

A fraud team has received reports of employees receiving phishing emails appearing to come from a partner company's domain. They run the email security module on that domain:

```
SPF              PRESENT
SPF Record       v=spf1 include:_spf.partnerco.com ~all
SPF Policy       SOFTFAIL (~all)

DKIM             No common selectors found

DMARC            MISSING
```

SPF is present but on softfail, DKIM is not found on common selectors, and DMARC is entirely absent. This means the domain can be spoofed relatively easily — a spoofed email will pass SPF softfail checks and may be delivered without warning. The fraud team contacts the partner company to alert them and recommends they implement DMARC urgently.

---

### Domain due diligence

A procurement officer is evaluating a vendor who will be sending invoices by email. They want to verify the vendor's domain is properly configured before setting up payment workflows:

```
SPF              PRESENT
SPF Policy       HARDFAIL (-all)

DKIM [default]   PRESENT
DKIM [mail]      PRESENT

DMARC            PRESENT
DMARC Policy     QUARANTINE
Aggregate Reports rua=mailto:dmarc@vendor.com
```

Strong SPF with hardfail, two DKIM selectors, and DMARC on quarantine with reporting configured. The vendor has invested in their email security. This does not guarantee their invoices are legitimate but it does mean their domain is properly protected against impersonation — reducing the risk of receiving spoofed invoices from an attacker pretending to be this vendor.

---

### Investigating a suspicious domain

An analyst is looking at a domain that was used to send a suspicious job offer. The email claimed to come from a professional services company:

```
SPF              MISSING - spoofing risk

DKIM             No common selectors found

DMARC            MISSING

MX Records       NONE - cannot receive email
```

No email authentication whatsoever and no MX records. A company that sends professional correspondence but cannot receive email and has no anti-spoofing controls has a fundamentally broken email setup. Combined with a two-week-old domain registration, this is highly inconsistent with a genuine professional services business.

---

### Checking a newsletter sender

A user has been receiving marketing emails from an unfamiliar sender and wants to verify the domain is legitimate before clicking any links:

```
SPF              PRESENT
SPF Record       v=spf1 include:sendgrid.net ~all
SPF Policy       SOFTFAIL (~all)

DKIM [s1]        PRESENT

DMARC            PRESENT
DMARC Policy     REJECT
```

SPF authorises SendGrid — a legitimate email marketing platform. DKIM is present. DMARC on reject. The domain is properly configured and using a reputable email service provider. The emails are likely legitimate marketing mail, not spoofed.

---

## Limitations

- **DKIM selector coverage** — NetSpecter probes 48 common selector names, covering the most widely used mail providers and generic fallbacks. A domain using a non-standard or randomly generated selector (common with some email platforms) may show no DKIM found even if DKIM is correctly configured. A negative result should be treated as inconclusive rather than definitive.
- **SPF lookup limits** — SPF records that chain many `include:` directives can hit the DNS lookup limit of ten. Records with more than ten lookups will cause SPF to fail in practice even if the record looks syntactically correct.
- **DMARC p=none** — a DMARC record with `p=none` is technically present but provides no enforcement. NetSpecter displays the policy so you can assess the actual protection level rather than just presence or absence.
- **Shared MX infrastructure** — some email security vendors (Mimecast, Proofpoint, Barracuda) sit in front of the destination mail server as a filtering layer. Their presence in MX records does not mean email is hosted with them — they are a relay that forwards to the actual mailbox provider.

---

## API used

All email security checks use [Google Public DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh). TXT records are queried for SPF and DMARC. 48 DKIM selector subdomains are queried individually, covering major mail providers and common generic names. MX records are queried to confirm email receiving capability.

No API key is required. There are no meaningful rate limits for normal use.

```
https://dns.google/resolve?name={domain}&type=TXT
https://dns.google/resolve?name=_dmarc.{domain}&type=TXT
https://dns.google/resolve?name={selector}._domainkey.{domain}&type=TXT
https://dns.google/resolve?name={domain}&type=MX
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.