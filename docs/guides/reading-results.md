---
title: Reading Results
description: How to understand and interpret NetSpecter's output, from individual module results to the automated risk summary.
---

# Reading Results

NetSpecter produces a lot of information quickly. This guide explains what you're looking at, how the colour-coded risk system works, what the automated risk summary is telling you, and how to make sense of it all, whether you're running your first scan or you've been doing recon for years.

---

## What a scan looks like

When you run a scan, NetSpecter queries several data sources in parallel and streams results into the output panel as they arrive. Each module produces its own block of output. You don't need to wait for everything to finish before you start reading.

A **Full Scan** runs all modules at once and appends an **Overall Assessment** at the end once everything has completed. Individual module scans (DNS, WHOIS, SSL, and so on) run in isolation and produce only that module's output.

---

## The colour-coded risk system

Across the tool, risk is expressed with a consistent colour scheme:

| Colour | Label | What it means |
|--------|-------|---------------|
| 🟢 Green | Low / Good | No concerns. Expected or healthy result. |
| 🟡 Yellow | Medium / Note | Worth keeping in mind. Not immediately alarming, but worth investigation in context. |
| 🔴 Red | High / Warning | A meaningful signal. Does not prove wrongdoing, but warrants scrutiny. |
| ⚪ Grey / Neutral | Info | Factual output with no inherent risk weight (e.g. IP address, registrar name). |

Colours appear inline throughout the output. In the Overall Assessment, each scored factor gets its own coloured row so you can scan the verdict at a glance.

::: tip
A red flag is a prompt to investigate further, not a conclusion. Multiple red flags together carry more weight than any single one.
:::

---

## Module output: what each section tells you

Each module block follows roughly the same pattern: a heading, key fields, and inline annotations where the value is significant. Here is a quick reference for what you are reading in each block.

### DNS

The DNS block shows the domain's address records (A/AAAA), mail routing (MX), name servers (NS), and any text records (TXT). The most investigatively useful fields are:

- **A record** - the IP the domain resolves to. If a brand-new domain resolves to a known bulletproof hosting IP, that is significant.
- **MX records** - where the domain's email goes. A domain with no MX records cannot receive email, which could be unusual for a site claiming to be a business.
- **TXT records** - often contain SPF, DKIM, and DMARC entries. Their presence or absence feeds directly into the email security score.
- **NS records** - name servers. Cheap or anonymous DNS providers appear here.

### WHOIS

The WHOIS block shows registration data retrieved via RDAP. Privacy redaction is common and does not itself indicate anything suspicious. What matters is:

- **Creation date** - how long the domain has existed.
- **Registrar** - where the domain was purchased.
- **Expiry date** - a domain expiring soon on an active site is unusual.
- **Registrant country** - where available.

### GEO-IP

Shows where the server's IP address is physically located and who the hosting provider is. A mismatch between the claimed location of a business and its server geography is a medium signal. A server hosted with a provider known for ignoring abuse reports is a higher signal.

### SSL / TLS

Shows the certificate's validity, issuer, subject alternative names (SANs), and a TLS grade from SSL Labs (A+ through F). Key things to read:

- **Issuer** - Let's Encrypt certificates are free and ubiquitous. Their presence is neutral. Their absence on a site claiming to handle payments is more notable.
- **SANs** - other domains sharing this certificate. Can reveal relationships between sites.
- **Grade** - reflects the quality of the server's TLS configuration, not just whether HTTPS is enabled.
- **Expiry** - an expired certificate on a live site is a red flag.

### Subdomains

A list of subdomains discovered via Certificate Transparency logs (Certspotter). These are public records, not hidden data. Subdomains like `admin.`, `cpanel.`, `webmail.`, or `staging.` reveal infrastructure details. A large number of subdomains may indicate a more established operation; very few may indicate a fresh domain.

### HTTP Headers

Shows the HTTP response headers the server returns. NetSpecter scores these against security best practices:

| Score range | Meaning |
|------------|---------|
| 80 - 100 | Well-configured. Security headers are in place. |
| 50 - 79 | Partial. Some headers present, some missing. |
| 0 - 49 | Poor. Most or all recommended security headers are absent. |

A low headers score does not mean a site is malicious. Many legitimate small sites score poorly. Combined with other signals, it adds context about how the site was set up and maintained.

### Email Security

Checks for the presence of SPF, DKIM, and DMARC records. These records exist to prevent email spoofing. A domain with no SPF and no DMARC can be trivially impersonated in phishing emails. For a domain claiming to represent a company or send invoices, their absence is a meaningful signal.

### Ports / CVEs (Shodan InternetDB)

Shows open ports and any known CVEs associated with the IP. CVEs (Common Vulnerabilities and Exposures) are publicly catalogued security vulnerabilities. If the IP is running software with unpatched known exploits, that appears here. Even one critical CVE is a red flag.

### Threat Intelligence

Checks whether the IP or domain has been flagged by threat intelligence sources. A positive hit (seen in threat feeds, on blocklists, or associated with past abuse) is a strong red signal, though aged entries should be weighted accordingly.

### Tech Scan

Attempts to fingerprint the technologies in use: CMS platform, JavaScript frameworks, analytics tools, CDN, and server software. Useful for understanding how a site was built and whether the technology stack matches the claimed purpose of the site.

---

## The Overall Assessment (Risk Summary)

When a Full Scan completes, NetSpecter automatically evaluates the collected data and produces a coloured risk table called the **Overall Assessment**. This is built by `buildRiskSummary` reading the rendered output.

Here is what each factor checks and how it is scored:

### Domain age

| Signal | Risk level |
|--------|-----------|
| Registered less than 6 months ago | 🔴 High |
| Registered 6 to 24 months ago | 🟡 Medium |
| Registered more than 24 months ago | 🟢 Low |

Newly registered domains are disproportionately associated with fraud, phishing, and scams. A domain that appeared a few weeks before a major event or product launch should be treated with caution.

### Registrar risk

Certain registrars are disproportionately used to register domains involved in abuse. NetSpecter checks the WHOIS registrar field against a known list. A high-risk registrar raises the score.

| Signal | Risk level |
|--------|-----------|
| Registrar in high-risk list | 🔴 High |
| Registrar not flagged | 🟢 Low |

### Email security

Evaluates the domain's SPF and DMARC posture combined.

| Signal | Risk level |
|--------|-----------|
| No SPF and no DMARC | 🔴 High |
| SPF present but no DMARC (or DMARC p=none) | 🟡 Medium |
| SPF and DMARC with enforcement policy (quarantine/reject) | 🟢 Low |

### SSL grade

Grades are assigned by SSL Labs and reflect the quality of the server's TLS configuration.

| Grade | Risk level |
|-------|-----------|
| A or A+ | 🟢 Low |
| B | 🟡 Medium |
| C, D, E, or F | 🔴 High |
| Not found / error | 🟡 Medium |

### HTTP headers score

| Score | Risk level |
|-------|-----------|
| 80 or above | 🟢 Low |
| 50 to 79 | 🟡 Medium |
| Below 50 | 🔴 High |

### CVEs

| Signal | Risk level |
|--------|-----------|
| One or more CVEs detected | 🔴 High |
| No CVEs found | 🟢 Low |

### Cloudflare proxy

Whether the domain is behind Cloudflare. This is informational rather than a risk score, as Cloudflare is widely used by legitimate and malicious sites alike. Its presence means the true hosting IP is hidden. Noted as a neutral signal in the summary.

### Shell domain anomaly

A "shell domain" pattern is when a domain resolves and serves a response but shows no meaningful content, no contact information, no subdomains, and minimal infrastructure. NetSpecter flags this when a combination of signals (very new domain, no MX, no subdomains, minimal headers, no TXT records) aligns with that pattern.

| Signal | Risk level |
|--------|-----------|
| Shell domain pattern detected | 🔴 High |
| No anomaly | 🟢 Low |

---

## Common patterns and what they suggest

Individual signals mean little on their own. Patterns across signals are where meaning emerges.

**Likely legitimate, poorly maintained**
Domain age over 3 years, valid SSL, but low headers score, no DMARC, outdated software in tech scan. Common for small businesses that set up a site years ago and never revisited security configuration.

**Newly registered, operationally ready**
Domain under 3 months old, A-grade SSL (Let's Encrypt, issued days ago), DMARC set to reject immediately, Cloudflare proxy, no subdomains. This pattern, especially combined with a convincing-looking website, matches the profile of a purpose-built fraud or phishing domain. Fraudsters increasingly know how to set up email security records.

**Bulletproof hosting**
Valid domain of any age, but GEO-IP places the server with a hosting provider known for ignoring abuse reports. No CVE concerns, no threat feed hits yet, but hosting infrastructure associated with abuse-tolerant providers is a medium-to-high signal.

**Compromised legitimate site**
Older domain, established history, but active CVEs, threat intelligence hit, and open ports that suggest an exposed admin panel. The domain itself is not fraudulent, but the server may be serving malicious content without the owner's knowledge.

---

## Worked example: a full scan walkthrough

Let's walk through a hypothetical Full Scan result for `nova-parcels.com`, a domain claiming to be a courier service.

```
=== DNS ===
A Record:    185.220.101.47
MX:          (none)
NS:          ns1.namecheap.com, ns2.namecheap.com
TXT:         (none)

=== WHOIS ===
Registrar:   Namecheap, Inc.
Created:     2024-11-03
Expires:     2025-11-03
Country:     (redacted)

=== GEO-IP ===
IP:          185.220.101.47
Country:     Netherlands
ASN:         AS205100 - F3 Netze e.V.
Org:         (Tor exit node range)

=== SSL ===
Issuer:      Let's Encrypt
Valid:        Yes
Expires:     2025-02-01
Grade:       A
SANs:        nova-parcels.com, www.nova-parcels.com

=== SUBDOMAINS ===
Found 0 subdomains via CT logs.

=== HTTP HEADERS ===
Score:       22 / 100
Missing:     Content-Security-Policy, X-Frame-Options, HSTS, Permissions-Policy

=== EMAIL SECURITY ===
SPF:         Not found
DKIM:        Not found
DMARC:       Not found

=== PORTS / CVEs ===
Open ports:  80, 443
CVEs:        None detected

=== THREAT INTELLIGENCE ===
Verdict:     IP seen in threat feeds (abuse reports, Nov 2024)

=== TECH SCAN ===
CMS:         Unknown
Server:      nginx
JS:          None detected

=== OVERALL ASSESSMENT ===
Domain age          🔴  Registered 5 months ago
Registrar risk      🟡  Namecheap (elevated)
Email security      🔴  No SPF, DKIM, or DMARC
SSL grade           🟢  A
HTTP headers        🔴  Score 22/100
CVEs                🟢  None detected
Cloudflare proxy    ℹ️   Not proxied (real IP exposed)
Shell domain        🔴  Anomaly detected (no MX, no subdomains, no TXT)
Threat intel        🔴  IP flagged in threat feeds
```

**Reading this result:**

The SSL grade is A, which might appear reassuring at first glance. But every other signal points the same direction. The domain is 5 months old. It has no email configuration whatsoever (no SPF, no DMARC, no MX), meaning it cannot receive email and nothing stops someone from spoofing it. The IP resolves to a range associated with abuse in the Netherlands. The threat intelligence feed has already flagged it. There are no subdomains, no tech stack, and the HTTP headers score is near zero.

This is a textbook shell domain. A real courier business of any size would have email infrastructure, some subdomains (at minimum a tracking subdomain), an identifiable CMS or platform, and would not be hosted on an IP already in threat feeds within weeks of registration.

The A-grade SSL is not a counterpoint. Free, automated SSL certificates are issued in minutes and are routinely present on fraudulent sites. A valid padlock icon in the browser says nothing about whether the site is trustworthy.

---
## Exporting your results

Once a scan completes, you can save the full output using the **Export** button in the toolbar. NetSpecter exports a **TXT** plain text copy of everything in the output panel, suitable for pasting into reports or case notes.

It is good practice to export immediately after a scan. NetSpecter does not store results between sessions, so closing or refreshing the page will clear the output.

---

## What NetSpecter cannot tell you

NetSpecter is a passive recon tool. It reads public data. It does not:

- Access the site itself or analyse page content
- Confirm whether a domain is definitively fraudulent or legitimate
- Replace human judgement or legal verification
- Track changes to a domain over time

Treat every result as evidence to weigh, not a verdict.

---