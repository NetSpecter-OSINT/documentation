---
title: Case Study - Fake Recruiter & Meeting Link Impersonation
description: A real-world investigation using NetSpecter to analyse a multi-stage social engineering attempt involving a fraudulent recruiter identity and a Cisco Webex impersonation domain.
---

# Case Study: Fake Recruiter & Meeting Link Impersonation

This case study documents a real investigation conducted using NetSpecter following an unsolicited recruitment approach. It demonstrates the full passive recon workflow applied to two domains: the organisation the recruiter claimed to represent, and a meeting platform domain linked in the final stage of contact.

The goal of this document is not to attribute intent definitively, but to show how passive recon data can surface a pattern of signals sufficient to warrant serious caution, and how to structure that investigation methodically.

---

## Background

The sequence began with an unsolicited message from a recruiter claiming to represent **p4mdev.com**, presenting an opportunity for a Partnership Manager role in the cryptocurrency sector.

Contact proceeded across five stages over four days (20 to 23 April 2026):

| Stage | Date | Event |
|-------|------|-------|
| 1 | 20 Apr | Initial recruiter message received |
| 2 | 20 Apr | Recipient responds; notes the LinkedIn job posting is no longer accessible; requests the original link and provides availability |
| 3 | 20 Apr | Recruiter disregards both questions; confirms a meeting date based on availability only |
| 4 | 21 Apr | Recipient cannot find verifiable information about the company; raises direct questions about the organisation before agreeing to meet |
| 5 | 23 Apr | On the confirmed meeting date, an invite is sent containing a button; the button resolves to `webex.shortmeets.com` |

Two behaviours in stages 2 through 4 are operationally significant: the recruiter ignored a direct request to verify the job posting, and ignored direct questions about the organisation. Neither omission is conclusive on its own. Both are consistent with an operator who cannot answer those questions.

The meeting link in stage 5 prompted the investigation.

---

## Investigation procedure

A Full Scan was run on both domains using NetSpecter v2.1. Scans were conducted on 24 April 2026.

- **Primary domain:** `p4mdev.com` (the recruiter's claimed organisation)
- **Secondary domain:** `shortmeets.com` (the domain hosting the impersonation meeting link)

---

## p4mdev.com — findings

### Registration

| Field | Value |
|-------|-------|
| Created | 2026-03-11 |
| Expires | 2027-03-11 |
| Registrar | Hostinger operations, UAB |
| DNSSEC | Unsigned |

The domain was registered on 11 March 2026, approximately six weeks before the recruitment contact began. A six-week-old domain representing an organisation actively recruiting for senior partnership roles is a notable disparity.

### Infrastructure

The domain resolves to Cloudflare proxy IPs, meaning the origin server is not exposed. Cloudflare name servers are in use. The GEO-IP lookup returns a Cloudflare edge node in Toronto — this reflects the CDN layer, not the origin server location.

Email is handled via Hostinger mail servers (`mx1.hostinger.com`, `mx2.hostinger.com`). The SPF record is present but configured with a softfail policy (`~all`), meaning unauthorised senders are not rejected. No DMARC record was found. No DKIM selectors were detected on common probes.

### Subdomains

Four subdomains were identified:

```
autoconfig.p4mdev.com
autodiscover.p4mdev.com
p4mdev.com
www.p4mdev.com
```

`autoconfig` and `autodiscover` are standard subdomains associated with email client auto-configuration (used by Outlook, Thunderbird, and similar clients). Their presence indicates the operator configured email client access, consistent with an operation designed to send and receive email at scale.

No application subdomains (portal, app, dashboard, api) were found.

### SSL

Two certificate entries were found in CT logs, both issued on the registration date (2026-03-11). Both cover only `*.p4mdev.com` and `p4mdev.com`. No additional domains appear in the SANs. The SSL Labs grade is **B** across all endpoints.

### HTTP headers

Security header score: **4/9 (44%)**

Present: `x-frame-options`, `x-content-type-options`, `referrer-policy`, `x-xss-protection`

Missing: `strict-transport-security`, `content-security-policy`, `permissions-policy`, `cross-origin-opener-policy`, `cross-origin-resource-policy`

### Ports

Thirteen open ports were identified via Shodan InternetDB. Of note:

| Port | Service | Significance |
|------|---------|-------------|
| 2082 / 2083 | cPanel HTTP / SSL | Hosting control panel accessible |
| 2086 / 2087 | WHM HTTP / SSL | Server management panel accessible |
| 2095 / 2096 | cPanel Webmail | Webmail interface accessible |

The cPanel and WHM ports indicate the site is hosted on shared or semi-managed hosting via Hostinger. No CVEs were detected.

---

## shortmeets.com — findings

### Registration

| Field | Value |
|-------|-------|
| Created | 2026-03-27 |
| Expires | 2027-03-27 |
| Registrar | NICENIC INTERNATIONAL GROUP CO., LIMITED |
| DNSSEC | Unsigned |

`shortmeets.com` was registered on 27 March 2026, sixteen days after `p4mdev.com`. Both domains came into existence within the same calendar month. NICENIC International is a registrar with a documented history of elevated abuse rates.

### Infrastructure

The domain resolves to Cloudflare IPs (`188.114.96.5`, `188.114.97.5`). Cloudflare name servers are in use. The GEO-IP result again reflects a Cloudflare edge node.

### Email infrastructure

| Field | Result |
|-------|--------|
| MX records | None |
| SPF | Missing |
| DKIM | Not found |
| DMARC | Missing |

`shortmeets.com` has no email infrastructure whatsoever. It cannot receive email, has no sending policy, and has no spoofing protection. This is consistent with a domain built for a single operational purpose that does not involve email.

### Subdomains

Three subdomains were found via CT logs:

```
api.shortmeets.com
shortmeets.com
webex.shortmeets.com
```

`webex.shortmeets.com` is the subdomain linked in the meeting invite. The name directly references Cisco Webex, one of the most widely used enterprise video conferencing platforms. The subdomain is designed to appear, at a glance, as a Webex meeting link.

`api.shortmeets.com` indicates the platform has a programmatic backend, suggesting it is not a static page but an operational tool.

Both subdomains were present in CT logs from registration, meaning the infrastructure was configured from day one.

### SSL

Two certificate entries in CT logs, both issued on the registration date (2026-03-27). SANs cover only `*.shortmeets.com` and `shortmeets.com`. SSL Labs grade: **B**.

### HTTP headers

Security header score: **2/9 (22%)**

The HTTP response body returned a 15-byte `text/plain` response. This is consistent with a redirect or token-validation endpoint rather than a standard web page.

### Ports

Ten open ports were identified. The profile is consistent with a Cloudflare-proxied host. No CVEs were detected.

---

## Combined assessment

| Signal | p4mdev.com | shortmeets.com |
|--------|-----------|----------------|
| Domain age | 🔴 6 weeks at time of contact | 🔴 4 weeks at time of meeting invite |
| Registrar | 🟡 Hostinger (elevated) | 🔴 NICENIC (high-risk) |
| Email security | 🟡 SPF softfail, no DMARC | 🔴 No MX, no SPF, no DMARC |
| SSL grade | 🟡 B | 🟡 B |
| HTTP headers | 🔴 44% | 🔴 22% |
| CVEs | 🟢 None | 🟢 None |
| Subdomain footprint | 🟡 Minimal (email config only) | 🔴 api + Webex impersonation |
| Registration correlation | 🔴 Both registered March 2026, 16 days apart | |
| Webex impersonation | | 🔴 webex.shortmeets.com |

### Key observations

**Registration correlation.** Both domains were registered within the same 16-day window in March 2026. There is no legitimate operational reason for an established recruitment-facing organisation to have a six-week-old primary domain.

**Purpose-built infrastructure.** `shortmeets.com` was configured from registration with two functional subdomains (`api.` and `webex.`) and no email infrastructure. The domain was not built to represent a company. It was built to host a tool.

**Webex subdomain impersonation.** The subdomain `webex.shortmeets.com` is constructed to evoke Cisco Webex in a casual reading of a meeting invite link. A recipient expecting a Webex meeting who sees a URL beginning with `webex.` may not read the full domain. This is a known social engineering technique.

**Email posture on p4mdev.com.** The softfail SPF and absent DMARC on the recruiter domain means any party could send email appearing to originate from a `@p4mdev.com` address with no technical barrier. The `autoconfig` and `autodiscover` subdomains suggest deliberate email client configuration, not incidental setup.

**No corroborating presence.** The recruiter's LinkedIn posting was inaccessible at the time of contact. No independently verifiable information about the organisation was found. The passive recon data does not surface any signals of an operational business (no SaaS tokens in TXT records, no application subdomains, no identifiable tech stack beyond hosting infrastructure).

---

## Indicators of compromise

The following artefacts were identified during this investigation:

```
Domains:
  p4mdev.com
  shortmeets.com
  webex.shortmeets.com
  api.shortmeets.com

IPs (Cloudflare edge - origin not exposed):
  104.21.70.107
  172.67.222.221
  188.114.96.5
  188.114.97.5

Registrars:
  Hostinger operations, UAB (p4mdev.com)
  NICENIC INTERNATIONAL GROUP CO., LIMITED (shortmeets.com)

Registration window:
  p4mdev.com:    2026-03-11
  shortmeets.com: 2026-03-27
```

---

## What this case illustrates

This investigation demonstrates several patterns that appear consistently in social engineering attempts targeting professionals:

**Urgency over verification.** The recruiter moved quickly from initial contact to meeting confirmation, bypassing both a request for the job posting and direct questions about the organisation. Operators running this type of campaign rely on momentum to prevent the target from pausing to verify.

**Infrastructure that looks operational but isn't.** `p4mdev.com` has email, a website, and enough surface area to appear credible. Passive recon reveals it was stood up six weeks before contact with no meaningful operational footprint.

**Platform impersonation at the final stage.** The impersonation is introduced at the point where the target has already committed time and accepted the interaction as legitimate. By the time the meeting link arrives, the psychological cost of questioning it feels higher. The `webex.shortmeets.com` link is not technically sophisticated. It relies on the target not reading the full domain.

**Cloudflare as an anonymisation layer.** Both domains use Cloudflare proxying, which conceals the origin server. This is not inherently suspicious - Cloudflare is ubiquitous. In this context, it means passive recon cannot identify the hosting origin or attribute infrastructure geographically with confidence.

**The value of not proceeding.** In this case, the investigation was conducted before joining the meeting. The destination of the link was unknown at the time of scanning. Passive recon on the domain alone was sufficient to identify the impersonation infrastructure and the registration pattern without interacting with the target system.

---
