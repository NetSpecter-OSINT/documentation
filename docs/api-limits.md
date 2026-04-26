---
title: API Limits & Quotas
description: Free-tier rate limits for every data source NetSpecter uses, what happens when a limit is hit, and how to work around it.
---

# API Limits & Quotas

NetSpecter is built entirely on free-tier APIs and public data sources. No API keys are required to use the tool. This also means every data source operates under free-tier constraints, which can affect results under heavy use.

This page documents the known limits for each source, what degrades when a limit is reached, and practical guidance for working around it.

---

## Quick reference

| Source | Used for | Free limit | Key required |
|--------|----------|-----------|--------------|
| Google DoH | DNS enumeration | No documented limit | No |
| RDAP | WHOIS / registration data | No documented limit | No |
| ipapi.co | GEO-IP location | 1,000 requests / day | No |
| Certspotter | CT logs / subdomains / SSL | 100 monitored issuances | No |
| SSL Labs | TLS grading | 1 concurrent assessment | No |
| Shodan InternetDB | Ports / CVEs | ~1 req / sec, no daily cap | No |
| Cloudflare Worker | HTTP headers proxy | 100,000 requests / day | No |

---

## Per-source detail

### Google DoH (DNS)

**Used for:** A, AAAA, MX, NS, TXT, CNAME, SOA record lookups.

**Limit:** No officially documented rate limit for standard query volumes. Google's DoH endpoint (`dns.google/resolve`) is designed for high-throughput use.

**What happens if throttled:** DNS queries return empty or timeout. NetSpecter will display no record for the affected query type rather than an error.

**Practical guidance:** In normal investigation use, you are unlikely to encounter any constraint here. If you are running many Full Scans in rapid succession and DNS results start coming back empty, introduce a short pause between scans.

---

### RDAP (WHOIS)

**Used for:** Domain registration data — creation date, registrar, expiry, name servers, registrant country.

**Limit:** RDAP has no single global rate limit. Queries are routed to individual registries (Verisign for `.com`, IANA for others), each of which sets its own policy. In practice, free query volumes for investigative use are rarely constrained.

**What happens if throttled:** The WHOIS block will display a lookup failure or return partial data. Registration date and registrar — the two most important fields — are usually returned early in the response and are least likely to be affected.

**Practical guidance:** If RDAP returns incomplete data on a domain, wait 60 seconds and re-run the WHOIS module individually. Registry throttling is typically short-lived.

---

### ipapi.co (GEO-IP)

**Used for:** IP geolocation — city, region, country, ISP, ASN, timezone.

**Limit:** **1,000 requests per day** on the free tier. Each Full Scan uses one GEO-IP request. Each individual GEO-IP module scan also uses one request.

**What happens if the limit is hit:** The GEO-IP block will return an error response from ipapi.co. NetSpecter will display a lookup failure. No location or ASN data will be shown for that scan.

**Practical guidance:** 1,000 requests per day is sufficient for most investigative workflows. If you are conducting high-volume scanning (bulk domain review, automated use), you will approach this limit. In that case:

- Prioritise Full Scans on your highest-priority targets early in the day
- Run individual module scans (DNS, WHOIS, SSL) on lower-priority domains rather than Full Scans, which consume one GEO-IP request each
- The limit resets at midnight UTC
- ipapi.co paid plans start at $15/month and remove the daily cap if you need sustained high-volume use

---

### Certspotter (CT logs)

**Used for:** Certificate Transparency log queries for subdomain discovery and SSL certificate history.

**Limit:** The free tier monitors up to 100 certificate issuances per account. NetSpecter uses Certspotter in an unauthenticated read-only query mode, which queries the public CT log index rather than a monitored account. Unauthenticated queries are subject to undocumented rate limiting by Certspotter's infrastructure.

**What happens if throttled:** The subdomain discovery block will return fewer results or none, falling back to the DNS probe results only. The SSL block will show 0 CT entries.

**Practical guidance:** If Certspotter returns no CT entries on a domain you expect to have certificate history, wait a few minutes and re-run the SSL or Subdomains module individually. Certspotter throttling typically resolves quickly. For domains with very large certificate histories, Certspotter may paginate or truncate results — `crt.sh` is a useful complement for broader CT log searches.

---

### SSL Labs

**Used for:** Live TLS grading — SSL Labs analyses the server's TLS configuration and returns a grade (A+ through F) per endpoint.

**Limit:** The SSL Labs free API enforces a limit of **1 concurrent assessment** per client. Results are cached on SSL Labs' servers for up to **24 hours**. First-time scans on a domain that has not been recently assessed take **30 to 60 seconds** to complete.

**What happens if the limit is hit:** NetSpecter will wait for the assessment to complete. If the SSL Labs API is under heavy load, the request may time out. In that case, the SSL Labs grade will be absent from the output, though the Certspotter CT data (certificate validity, SANs, issuer) will still be present.

**Practical guidance:**

- The 30-60 second delay on first-time scans is expected behaviour, not an error. The output panel will indicate that SSL Labs analysis is in progress.
- If you scan the same domain twice in quick succession, the second scan will return the cached grade almost immediately.
- If the SSL Labs grade does not appear, re-run the SSL module individually after a short wait. The TLS grade is one signal among several — a missing grade does not invalidate the rest of the scan.
- Avoid running multiple Full Scans simultaneously, as only one SSL Labs assessment can proceed at a time.

---

### Shodan InternetDB

**Used for:** Open port enumeration and CVE detection against the resolved IP.

**Limit:** Shodan InternetDB is a free, keyless endpoint. It does not enforce a documented daily cap but applies rate limiting of approximately **1 request per second**. It covers IPs that Shodan has scanned passively; not every IP will have data.

**What happens if throttled:** The ports block will return a rate limit error. NetSpecter will display a Shodan lookup failure. DNS-inferred services (derived from MX and NS records) will still appear as supplementary output.

**What happens if the IP has no Shodan data:** InternetDB returns an empty result. This is common for IPs behind Cloudflare proxy, since Shodan indexes the Cloudflare edge IP rather than the origin. In those cases the ports block will reflect Cloudflare's infrastructure, not the target site's.

**Practical guidance:** Shodan InternetDB throttling is uncommon in normal investigative use. If you encounter it, wait a few seconds and re-run the Ports module individually. For IPs behind Cloudflare proxy, the port data reflects the CDN layer and should be interpreted accordingly.

---

### Cloudflare Worker (HTTP headers proxy)

**Used for:** Fetching HTTP response headers from the target domain. The Worker proxies the request to avoid CORS restrictions in the browser.

**Limit:** **100,000 requests per day** on the Cloudflare Workers free tier. Each HTTP headers module request uses one Worker invocation. Full Scans use one invocation per scan.

**What happens if the limit is hit:** The HTTP headers block will return a Worker error. No header data or security score will be shown for that scan.

**Practical guidance:** The 100,000 daily Worker request limit is unlikely to be a constraint for any realistic investigation workload. However, Worker usage is shared across NetSpecter users, and the limit resets daily at 00:00 UTC.

---

## What degrades gracefully vs. what blocks output

Not all limit hits are equal. Some modules fail silently with empty output; others display explicit errors. Here is what to expect:

| Module | Behaviour on failure |
|--------|---------------------|
| DNS | Empty results per record type; no error message |
| WHOIS | Lookup failure displayed; partial data may still appear |
| GEO-IP | Explicit error from ipapi.co; no location data |
| Subdomains (Certspotter) | Falls back to DNS probe results only |
| SSL (Certspotter) | 0 CT entries shown; SSL Labs grade unaffected |
| SSL (SSL Labs) | Grade absent from output; CT data still shown |
| Ports (Shodan) | Lookup failure; DNS-inferred services still shown |
| HTTP Headers | Worker error; no score shown |
| Email Security | Relies on DNS; degrades with DNS module |
| Tech Scan | Relies on DNS; degrades with DNS module |
| Threat Intel | Passive links only; no live lookup performed by NetSpecter |

The **Threat Intel module** generates links to external platforms (VirusTotal, AbuseIPDB, URLScan, and others) rather than querying them directly. It is not subject to rate limiting within NetSpecter.

---

## General guidance

**Run one Full Scan at a time.** Multiple simultaneous Full Scans compete for the SSL Labs concurrent assessment slot and may produce incomplete TLS data.

**Export results immediately.** NetSpecter does not persist output between sessions. If a module fails due to a rate limit, export what you have, wait for the limit to reset, and re-run the affected module individually.

**Re-run individual modules rather than full scans.** If one module in a Full Scan fails, use the individual module scan to retry just that component without consuming quota on the modules that already succeeded.

**Limits reset daily.** All daily quotas (ipapi.co, Cloudflare Worker) reset at or around midnight UTC.