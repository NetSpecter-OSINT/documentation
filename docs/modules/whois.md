---
title: WHOIS / RDAP
description: How NetSpecter's WHOIS module works, what registration data reveals, how to interpret results, and practical examples across different use cases.
---

# WHOIS / RDAP

The WHOIS module retrieves domain registration data — who registered a domain, when, through which registrar, and when it expires. Registration records are one of the most reliable passive intelligence sources because they are created at the moment a domain is purchased and cannot be retroactively altered without leaving traces.

NetSpecter uses **RDAP** (Registration Data Access Protocol), the modern replacement for the legacy WHOIS protocol. RDAP returns clean structured data over HTTPS and is the current standard used by all major domain registries worldwide.

---

## When to use this module

Use WHOIS / RDAP when you want to:

- Establish how long a domain has been registered and whether its age matches its claimed history
- Identify which registrar was used to purchase the domain
- Check when a domain expires and whether renewal suggests long-term intent
- Verify nameserver data against your DNS findings
- Determine whether DNSSEC is configured
- Build a timeline of when infrastructure was created

**Common scenarios:**

- A security team is vetting an unfamiliar vendor before onboarding them and wants to verify their domain history
- A journalist is researching a company and needs to establish when their web presence was created
- A sysadmin is auditing their own domain portfolio to check expiry dates and registrar settings
- A developer wants to understand the registration details of a domain they are about to purchase
- A researcher is mapping the infrastructure of a target organisation as part of an authorised engagement

---

## How it works

RDAP queries are routed directly to the authoritative registry for the domain's TLD. NetSpecter maintains a list of known RDAP endpoints for common extensions and falls back to the universal `rdap.org` gateway for less common TLDs.

For IP address targets, queries are routed to ARIN's RDAP endpoint which covers North American allocations and links to other regional registries for international addresses.

```
.com / .net    →    rdap.verisign.com
.org           →    rdap.publicinterestregistry.org
.io            →    rdap.nic.io
.uk            →    rdap.nominet.uk
.de            →    rdap.denic.de
other TLDs     →    rdap.org (universal gateway)
IP addresses   →    rdap.arin.net
```

---

## What the results tell you

### Domain age and creation date

The creation date is one of the most useful fields in any domain investigation. NetSpecter calculates the domain age in days and applies an automatic risk label:

| Age | Label | Significance |
|---|---|---|
| Under 30 days | `VERY NEW — HIGH RISK` | Very recently registered — warrants closer scrutiny |
| 30 to 90 days | `RECENT` | Relatively new — consider in context of other findings |
| Over 90 days | `ESTABLISHED` | More consistent with a genuine operational presence |

The age label is a starting signal, not a verdict. A brand new startup will have a recently registered domain by definition. The age becomes meaningful when combined with other findings — a domain claiming years of history but registered last month is a clear inconsistency.

**Example — recently registered domain:**

```
Domain Age    44 days (RECENT)
Created       2026-03-11 11:38:45 UTC
Updated       2026-03-11 11:39:48 UTC
Expires       2027-03-11 11:38:45 UTC
```

Created and updated within seconds of each other — the domain was registered and configured in a single automated step.

**Example — well-established domain:**

```
Domain Age    2847 days (ESTABLISHED)
Created       2018-06-14 09:12:00 UTC
Updated       2025-11-03 14:22:11 UTC
Expires       2026-06-14 09:12:00 UTC
```

Nearly eight years old with multiple updates over time — consistent with an organisation actively maintaining their domain over a long period.

---

### Registrar

The registrar is the company through which the domain was purchased. Registrars vary significantly in their verification requirements, pricing, and abuse management practices. NetSpecter flags registrars with a documented history of elevated abuse rates:

| Registrar | Notes |
|---|---|
| NICENIC International | Frequently used for disposable and short-lived domains |
| Hostinger | Budget provider with high volume of temporary registrations |
| Namecheap | Popular for legitimate use but also very high abuse volume |
| PublicDomainRegistry / PDR | Historically elevated abuse rates |
| Reg.ru | Russian registrar with elevated abuse history |
| Internet.bs | Popular with operators seeking minimal verification |

::: warning
A flagged registrar does not mean a domain is malicious. Many legitimate businesses and individuals use budget registrars for perfectly valid reasons. Treat this as one data point among many.
:::

The registrar becomes more meaningful when it is inconsistent with what the domain claims to be. A domain for a large financial services firm registered through a budget shared-hosting provider raises a different question than a personal blog on the same registrar.

---

### Domain status

Status codes describe what operations are currently permitted on the domain:

| Status | Meaning |
|---|---|
| `clientTransferProhibited` | Cannot be moved to another registrar (standard lock) |
| `clientDeleteProhibited` | Cannot be deleted at registrar level |
| `clientUpdateProhibited` | Contact details cannot be changed |
| `serverHold` | Domain is suspended — DNS will not resolve |
| `pendingDelete` | Domain is about to be deleted and released |
| `redemptionPeriod` | Domain has expired and is in a grace period |

Most active domains carry `clientTransferProhibited` as standard practice. Multiple prohibit locks together suggest the registrant has deliberately secured the domain, which is good practice for an established organisation.

A domain in `serverHold` or `pendingDelete` has effectively ceased functioning — its DNS will not resolve and any associated services will be unreachable.

---

### Nameservers

RDAP returns the nameservers authorised for the domain. These should be consistent with the NS records you found in the DNS module. A discrepancy between RDAP nameservers and live DNS NS records can indicate a recent change that has not yet propagated, or a misconfiguration worth investigating further.

---

### DNSSEC

DNSSEC adds cryptographic signing to DNS responses, making it significantly harder for attackers to redirect traffic through DNS manipulation.

| DNSSEC value | Meaning |
|---|---|
| `UNSIGNED` | Standard — no cryptographic signing in place |
| `SIGNED` | Domain uses DNSSEC — stronger DNS security posture |

Most domains are unsigned. DNSSEC is more commonly found on financial institutions, government domains, and security-conscious organisations. Its absence is not a red flag on its own.

---

### Registrant information

RDAP returns registrant contact details where available. Since GDPR came into effect in 2018, most `.com` and European TLD registrations redact personal registrant information by default — you will typically see the registrar's privacy proxy service rather than the actual registrant's name and address.

Where registrant data is available, it can include the organisation name, address, and abuse contact. These details can be cross-referenced with other intelligence sources to identify related infrastructure or corroborate a claimed identity.

---

## Reading the output

A typical result looks like this:

```
Domain        EXAMPLE.COM
Status        client transfer prohibited
Domain Age    312 days (ESTABLISHED)
Created       2025-06-14 10:22:00 UTC
Updated       2025-09-03 14:11:00 UTC
Expires       2026-06-14 10:22:00 UTC
Nameservers   2 found
  NS          NS1.EXAMPLE-DNS.COM
  NS          NS2.EXAMPLE-DNS.COM
Registrar     Example Registrar, Inc.
DNSSEC        UNSIGNED
```

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| Domain age under 30 days | Very recently created — consider alongside other findings |
| Created and updated on the same day | Likely automated setup — rapid deployment |
| Expiry in less than one year with no renewal pattern | Possibly short-term use |
| Registrar inconsistent with claimed business type | Budget provider for an enterprise-tier claim |
| No registrant data | Privacy proxy — registrant is deliberately obscured |
| Nameservers inconsistent with DNS module NS records | Recent DNS change or misconfiguration |
| `serverHold` or `pendingDelete` status | Domain suspended or about to lapse |
| Multiple prohibit locks | Well-managed domain with deliberate security controls |

---

## Examples across different use cases

### Vendor due diligence

A procurement team is evaluating a new software vendor. The vendor's domain returns:

```
Domain Age    2104 days (ESTABLISHED)
Created       2019-01-22 08:14:00 UTC
Registrar     GoDaddy.com, LLC
DNSSEC        UNSIGNED
Expires       2027-01-22 08:14:00 UTC
```

Over five years old, registered well before the vendor relationship began, renewed multiple times. This registration history is consistent with a legitimate ongoing business. No flags here — proceed with other checks.

---

### Checking a domain before clicking a link

You receive an unsolicited email with a link to `secure-portal-login.com`. Running WHOIS returns:

```
Domain Age    3 days (VERY NEW — HIGH RISK)
Created       2026-04-22 14:03:11 UTC
Registrar     NICENIC INTERNATIONAL GROUP CO., LIMITED
⚠ Registrar associated with elevated abuse rates.
DNSSEC        UNSIGNED
Expires       2027-04-22 14:03:11 UTC
```

Three days old, registered through a high-abuse registrar. Combined with the generic name designed to look like a legitimate login portal, this warrants extreme caution before interacting with the link.

---

### Auditing your own domain

A developer runs WHOIS on their own company domain and discovers:

```
Domain Age    1847 days (ESTABLISHED)
Expires       2026-05-03 10:00:00 UTC
```

The domain expires in eight days. A timely reminder to renew before it lapses and potentially becomes available for someone else to register.

---

### Researching a news story

A journalist is fact-checking a press release from a company they have not heard of before. WHOIS returns:

```
Domain Age    18 days (VERY NEW — HIGH RISK)
Created       2026-04-07 09:44:00 UTC
Registrar     Hostinger operations, UAB
⚠ Registrar associated with elevated abuse rates.
```

The company claims in their press release to have been operating for three years. An 18-day-old domain directly contradicts that claim and is worth investigating further before publishing.

---

## API used

RDAP queries are made directly to the authoritative registry endpoint for each TLD. No API key is required. There are no rate limits for normal use.

```
https://rdap.verisign.com/com/v1/domain/{domain}    (for .com)
https://rdap.org/domain/{domain}                     (fallback)
https://rdap.arin.net/registry/ip/{ip}               (for IPs)
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.