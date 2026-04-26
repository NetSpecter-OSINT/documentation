---
title: SSL / Certificates
description: How NetSpecter's SSL module works, what certificate transparency logs and TLS grading reveal, and practical examples across different use cases.
---

# SSL / Certificates

The SSL module analyses the certificate infrastructure behind a domain in two ways. First it queries certificate transparency logs to retrieve the full history of certificates ever issued for the domain. Then it requests a live TLS analysis from SSL Labs to grade the quality and security of the current HTTPS configuration.

Together these two sources answer different but complementary questions. Certificate transparency tells you what certificates exist and when they were issued. The SSL Labs grade tells you how well the TLS configuration is actually implemented.

---

## When to use this module

Use SSL / Certificates when you want to:

- Verify that a domain has a valid, non-expired certificate
- Review the full certificate history for a domain including past and wildcard certificates
- Check which certificate authority issued the certificate
- Identify subdomains revealed through certificate transparency logs
- Grade the TLS configuration of a web server
- Detect known TLS vulnerabilities such as Heartbleed, POODLE, or BEAST
- Audit forward secrecy and HSTS configuration
- Check certificate key strength

**Common scenarios:**

- A developer has just deployed a new site and wants to confirm the certificate is correctly configured
- A security team is auditing a third-party service and needs to verify their TLS posture
- An IT administrator wants to check certificate expiry dates across their infrastructure
- A researcher is mapping the subdomain footprint of an organisation through certificate transparency logs
- Someone is investigating a suspicious site and wants to know who issued its certificate and when

---

## How it works

The module runs two independent queries in sequence.

**Source 1 — Certspotter CT logs**

Certificate transparency is a public logging system that records every TLS certificate issued by trusted certificate authorities. When a CA issues a certificate, it is required to submit it to a public CT log within 24 hours. This creates an auditable, tamper-resistant record of certificate issuance that anyone can query.

NetSpecter queries [Certspotter](https://sslmate.com/certspotter/) to retrieve all certificates ever logged for the target domain. Results are deduplicated by certificate ID and the most recent 15 are displayed.

**Source 2 — SSL Labs live TLS analysis**

[SSL Labs](https://www.ssllabs.com/) by Qualys runs an active scan against the target domain's HTTPS endpoint and produces a comprehensive grade based on the quality of the TLS configuration. This includes protocol versions supported, cipher strength, certificate validity, vulnerability status, and security header presence.

First-time scans take 30 to 60 seconds. Subsequent scans return cached results from the previous 24 hours almost instantly. NetSpecter polls for the result automatically and displays it when ready.

---

## What the results tell you

### Certificate transparency results

Each certificate entry shows:

| Field | What it means |
|---|---|
| Common Name | The primary domain the certificate was issued for |
| Status | `VALID` if the certificate has not expired, `EXPIRED` if it has |
| Issuer | The certificate authority that issued the certificate |
| Valid | The start and end dates of the certificate's validity window |
| SANs | Subject Alternative Names — all domains covered by this certificate |

**Reading a CT log entry:**

```
[01] *.example.com                              VALID
     Issuer     Let's Encrypt
     Valid      2026-03-11 → 2026-06-09
     SANs       *.example.com | example.com
```

This is a wildcard certificate (`*.example.com`) issued by Let's Encrypt covering both the apex domain and all subdomains. It is valid for 90 days, which is standard for Let's Encrypt certificates.

**What the issuer tells you:**

| Issuer | Notes |
|---|---|
| Let's Encrypt | Free, automated, 90-day certificates — extremely common for legitimate sites |
| ZeroSSL | Another free automated CA — similar to Let's Encrypt |
| Sectigo / Comodo | Commercial CA — paid certificates, common for businesses |
| DigiCert | Enterprise-grade CA — common for large organisations and financial services |
| GlobalSign | Enterprise CA — similar to DigiCert |
| Self-signed | No trusted CA — browser will show a security warning |

---

### Wildcard certificates

A wildcard certificate (`*.example.com`) covers the apex domain and all first-level subdomains in a single certificate. Wildcards are common and legitimate but they also mean the certificate alone does not tell you which specific subdomains exist — only that all of them share the same certificate. Use the [Subdomain Discovery](/modules/subdomains) module to enumerate actual subdomains.

---

### Duplicate certificates

It is normal to see multiple certificate entries for the same domain. Certificates are typically renewed every 90 days (Let's Encrypt) or annually (commercial CAs), so a domain with a long history will have many entries. Two identical entries for the same validity period usually means the certificate was submitted to multiple CT logs, which is standard practice.

---

### SSL Labs grade

The overall grade summarises the quality of the TLS configuration:

| Grade | Meaning |
|---|---|
| A+ | Exceptional — HSTS preloading and strong configuration |
| A | Good — strong TLS configuration with no significant issues |
| B | Adequate — some weaknesses, typically older protocol support |
| C | Below standard — notable configuration problems |
| F | Failing — serious vulnerabilities or broken configuration |
| T | Certificate not trusted — invalid, expired, or self-signed |

**Endpoint details:**

For each server endpoint the full analysis includes:

| Field | What it means |
|---|---|
| IP | The server IP that was scanned |
| Grade | Per-endpoint grade |
| Protocols | TLS versions supported (TLS 1.2, TLS 1.3 etc.) |
| Forward Secrecy | Whether the server supports perfect forward secrecy |
| HSTS | Whether HTTP Strict Transport Security is configured |
| Heartbleed | Whether the server is vulnerable to the Heartbleed OpenSSL bug |
| POODLE | Whether the server is vulnerable to the POODLE SSL 3.0 attack |
| BEAST | Whether the server is vulnerable to the BEAST TLS 1.0 attack |
| Key Strength | The bit length of the certificate's cryptographic key |

**What forward secrecy means:**

Forward secrecy ensures that even if an attacker records encrypted traffic today and later obtains the server's private key, they cannot decrypt the historical traffic. Without forward secrecy, a key compromise retroactively exposes all past communications. Most modern servers support it — its absence is worth flagging.

**What HSTS means:**

HTTP Strict Transport Security instructs browsers to only ever connect to the domain over HTTPS, even if the user types `http://` or follows an unencrypted link. Without HSTS, users can be silently downgraded to HTTP by a network attacker. Its presence is a positive security signal.

---

## Reading the output

**CT log section:**

```
Total CT entries    2
Showing             2

[01] *.p4mdev.com                               VALID
     Issuer     N/A
     Valid      2026-03-11 → 2026-06-09
     SANs       *.p4mdev.com | p4mdev.com

[02] *.p4mdev.com                               VALID
     Issuer     N/A
     Valid      2026-03-11 → 2026-06-09
     SANs       *.p4mdev.com | p4mdev.com
```

Two identical entries for the same validity window — the same certificate was logged to two CT logs on the same day the domain was registered. This is consistent with automated, same-day certificate provisioning.

**SSL Labs section:**

```
Overall Grade       A

Endpoint [1]
  IP                176.31.251.146
  Grade             A
  Protocols         TLS 1.2, TLS 1.3
  Forward Secrecy   SUPPORTED
  HSTS              PRESENT
  Heartbleed        SAFE
  POODLE            SAFE
  BEAST             SAFE
  Key Strength      2048 bits
```

Grade A with TLS 1.3 support, forward secrecy, HSTS in place, and no known vulnerabilities. This is a well-configured server.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| Certificate issued on the same day as domain registration | Automated, rapid deployment — consistent with disposable infrastructure |
| Only one or two CT log entries | Domain is newly created or rarely renewed |
| Dozens of entries over several years | Established domain with a long certificate history |
| Self-signed certificate (no trusted issuer) | Browser will warn users — unusual for a public-facing site |
| Expired certificate still in CT logs | Server may be improperly maintained or abandoned |
| Grade B or below | Outdated TLS configuration — older protocol versions still enabled |
| Grade F | Serious vulnerability or broken HTTPS — do not trust the connection |
| Heartbleed, POODLE, or BEAST flagged as VULNERABLE | Unpatched server with known exploitable vulnerabilities |
| Forward secrecy not supported | Historical traffic could be decrypted if private key is compromised |
| HSTS missing | Users can be downgraded to HTTP by a network attacker |
| Wildcard certificate covering many subdomains | Single certificate compromise affects all subdomains |

---

## Examples across different use cases

### Pre-launch certificate check

A developer has just deployed a new web application and wants to confirm the certificate is set up correctly before going live:

```
[01] app.example.com                            VALID
     Issuer     Let's Encrypt
     Valid      2026-04-01 → 2026-06-30

Overall Grade   A
Forward Secrecy SUPPORTED
HSTS            PRESENT
Heartbleed      SAFE
```

Certificate is valid, issued by Let's Encrypt, 90-day window as expected. Grade A with HSTS and forward secrecy. Ready to launch.

---

### Third-party vendor security audit

A security team is evaluating a payment processing partner and needs to verify their TLS posture:

```
Overall Grade   B
Protocols       TLS 1.0, TLS 1.1, TLS 1.2, TLS 1.3
Forward Secrecy SUPPORTED
HSTS            MISSING
BEAST           VULNERABLE
```

Grade B driven by TLS 1.0 and 1.1 still being enabled and HSTS not configured. BEAST vulnerability is present because of TLS 1.0 support. This should be raised with the vendor as a remediation requirement before processing payment data through their platform.

---

### Certificate history investigation

A researcher is investigating a domain and queries its CT log history:

```
Total CT entries    47
Showing             15

[01] example.com    VALID    2026-03-01 → 2026-05-30
[02] example.com    VALID    2025-12-01 → 2026-02-28
[03] example.com    VALID    2025-09-01 → 2025-11-30
...
```

47 certificate entries stretching back years, renewed consistently every 90 days. This is a domain with a long, active certificate history — difficult to fake and consistent with a genuine long-running operation.

---

### Suspicious site with minimal history

A researcher investigates a domain that appeared in a phishing report:

```
Total CT entries    2
Showing             2

[01] *.phishing-site.com    VALID    2026-04-20 → 2026-07-19
[02] *.phishing-site.com    VALID    2026-04-20 → 2026-07-19
```

Only two entries, both from the same day, both identical. The domain has no certificate history before this week. Combined with a WHOIS creation date of the same week, this is consistent with freshly deployed infrastructure.

---

### Checking for expired certificates in a portfolio

An IT administrator runs SSL checks across several internal domains and finds:

```
[01] old-service.company.com    EXPIRED
     Valid      2024-11-01 → 2025-01-30
```

An expired certificate that was never renewed — the service was likely decommissioned but the DNS record was left in place. Worth cleaning up to reduce the attack surface.

---

## Limitations

- **SSL Labs scan timing** — first-time scans take 30 to 60 seconds. If the domain has not been scanned recently, NetSpecter will poll automatically. Very occasionally scans time out on the first attempt — running the module again will return the cached result immediately.
- **Cloudflare and CDN proxies** — SSL Labs scans the edge certificate presented by the CDN, not the origin server's certificate. The grade reflects the CDN's TLS configuration.
- **Certspotter free tier** — the free Certspotter API has rate limits. If you see no CT results for a well-established domain, try again after a few minutes.
- **Internal or private domains** — domains that do not resolve publicly will not have CT log entries and SSL Labs cannot scan them.

---

## API used

**Certificate transparency:** [Certspotter API](https://sslmate.com/certspotter/api/) by SSLMate. No API key required for the public issuances endpoint.

```
https://api.certspotter.com/v1/issuances?domain={domain}&include_subdomains=false&expand=dns_names
```

**TLS grading:** [SSL Labs API v3](https://www.ssllabs.com/projects/ssllabs-apis/) by Qualys. No API key required. Results are cached for 24 hours. Qualys asks that automated tools be respectful of their API — NetSpecter polls at 10-second intervals and makes a maximum of six polling attempts per scan.

```
https://api.ssllabs.com/api/v3/analyze?host={domain}&fromCache=on&maxAge=24
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.