---
title: Subdomain Discovery
description: How NetSpecter's subdomain discovery module works, what subdomains reveal about an organisation's infrastructure, and practical examples across different use cases.
---

# Subdomain Discovery

The Subdomain Discovery module passively enumerates subdomains associated with a target domain, then probes each one to check whether it is live. Subdomains reveal the internal structure of an organisation's infrastructure — the services they run, the platforms they use, and sometimes systems that were meant to stay out of public view.

Unlike active subdomain brute-forcing, which hammers a DNS server with thousands of guesses, NetSpecter uses entirely passive sources. No requests are made to the target's servers during enumeration, and no unusual traffic is generated against their infrastructure.

---

## When to use this module

Use Subdomain Discovery when you want to:

- Map the public-facing infrastructure of a domain beyond the main website
- Find services such as APIs, admin panels, staging environments, and mail servers
- Identify platforms and tools an organisation uses through subdomain naming conventions
- Discover subdomains that may have been forgotten or left unmaintained
- Verify which discovered subdomains are currently live and reachable
- Cross-reference with CT log data to understand how long certain services have existed
- Supplement findings from the DNS and Tech Fingerprint modules

**Common scenarios:**

- A security researcher is conducting authorised reconnaissance on a client's infrastructure and wants to understand the full attack surface
- A bug bounty hunter is mapping all in-scope subdomains before starting their assessment
- A developer wants to verify which subdomains are publicly visible before a product launch
- An IT administrator is auditing forgotten or decommissioned services that may still have live DNS records
- A journalist or investigator is trying to understand the full technical footprint of an organisation

---

## How it works

NetSpecter runs in two phases: passive enumeration followed by live status probing.

### Phase 1 — Passive enumeration

Two sources are queried in parallel and their results are merged and deduplicated. Each result is tagged with which source(s) found it.

**Source 1 — Certspotter certificate transparency logs** `[CERT]`

Every TLS certificate issued for a domain must be logged in a public certificate transparency log. When an organisation issues a certificate for `api.example.com` or `staging.example.com`, that subdomain is permanently recorded in the CT logs regardless of whether the service is still running.

NetSpecter queries the Certspotter API to retrieve all certificate issuances for the target domain including subdomains. Every unique hostname found in the `dns_names` field of each certificate is extracted and added to the results.

This source is particularly powerful for finding subdomains that were once active but have since been removed — they may still appear in CT logs from years ago, giving you historical visibility that DNS alone cannot provide.

**Source 2 — crt.sh certificate transparency aggregator** `[CRT]`

crt.sh is a public CT log search engine maintained by Sectigo that aggregates certificate data across multiple log providers. It often has broader coverage than any single CT log source, and can surface subdomains that Certspotter has not yet indexed.

NetSpecter queries the crt.sh JSON API for all certificate records matching the target domain. Each result's `name_value` field is parsed for hostnames, including entries that contain multiple names.

When a subdomain appears in both sources it is listed once with both `[CERT]` and `[CRT]` tags. A subdomain appearing in only one source is still a valid finding.

### Phase 2 — Live status probe

Once enumeration is complete, NetSpecter probes every discovered subdomain via the NetSpecter proxy worker to check whether it is currently serving HTTP traffic. The probe attempts HTTPS first and falls back to HTTP if HTTPS is unavailable.

For each subdomain the probe returns:

- **HTTP status code** — whether the service responded and how
- **Protocol** — whether it is served over HTTPS or HTTP
- **Redirect destination** — where the subdomain redirects to, if applicable

This phase adds live context to what are otherwise historical records. A subdomain in a CT log from three years ago may no longer exist — the probe tells you immediately whether it does.

---

## What the results tell you

### Reading subdomain names

Subdomain names are often self-descriptive and reveal the purpose of the service:

| Subdomain pattern | What it typically indicates |
|---|---|
| `www` | Main website |
| `mail`, `smtp`, `pop`, `imap` | Email infrastructure |
| `api` | Application programming interface — backend services |
| `admin`, `dashboard`, `portal` | Administrative or management interface |
| `dev`, `staging`, `test`, `beta` | Non-production environments |
| `cdn`, `static`, `assets`, `media`, `img` | Content delivery or static file hosting |
| `vpn`, `remote` | Remote access infrastructure |
| `cpanel`, `whm`, `webmail` | Shared hosting control panels |
| `autodiscover`, `autoconfig` | Email client auto-configuration endpoints |
| `shop`, `store` | E-commerce platform |
| `blog` | Content management system |
| `ns1`, `ns2` | Nameserver infrastructure |

---

### Non-production environments

Development, staging, and test subdomains are particularly interesting findings. These environments often have:

- Weaker security configurations than production
- Older software versions that have not been patched
- Debug modes or verbose error messages enabled
- Less restrictive access controls
- Potentially real or sample data loaded for testing

The existence of these subdomains does not mean they are accessible — they may be restricted by IP allowlist or require authentication. But their presence tells you the organisation runs multiple environments and that additional infrastructure exists beyond the main site.

---

### Historical subdomains from CT logs

A subdomain appearing in certificate transparency logs does not necessarily mean it is still active. CT logs are permanent records — a subdomain that was live two years ago and then decommissioned will still appear in the results. The live status probe will show these as `unreachable`, confirming they are no longer serving traffic. This historical data is still useful for:

- Understanding how an organisation's infrastructure has evolved
- Finding services that were once public but may now be internal
- Identifying naming conventions the organisation uses

---

### Reading HTTP status codes

The live probe phase adds a status code to each subdomain. Understanding what each code means in context:

| Status | Meaning |
|---|---|
| `200` | Service is live and responding normally |
| `301` / `302` | Redirect — follow the destination to see where it leads |
| `401` | Service is live but requires authentication |
| `403` | Service is reachable but access is explicitly denied |
| `404` | Server responded but no content found at that path |
| `500` / `502` / `503` | Server is reachable but encountering errors |
| `--  unreachable` | No response — subdomain may be decommissioned or DNS-only |

---

## Reading the output

```
Querying 2 passive sources in parallel...

  [1/2] Certspotter CT logs...
  [2/2] crt.sh CT aggregator...
  [1/2] Certspotter: done.
  [2/2] crt.sh: done.

Total unique subdomains    9

  [001] files.example.com          [CRT]
  [002] files1.example.com         [CERT] [CRT]
  [003] api.example.com            [CERT] [CRT]
  [004] staging.example.com        [CERT]
  [005] www.example.com            [CERT] [CRT]
  [006] example.com                [CERT] [CRT]

Probing live HTTP status via worker...

  [001] files.example.com          --   unreachable
  [002] files1.example.com         401  HTTPS
  [003] api.example.com            200  HTTPS
  [004] staging.example.com        403  HTTPS
  [005] www.example.com            200  HTTPS
  [006] example.com                301  → https://www.example.com/
```

Results are sorted alphabetically. The apex domain itself is included when found in CT logs. Source tags show which CT source(s) discovered each subdomain.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| `admin`, `dashboard`, or `portal` subdomain | Management interface potentially exposed to the internet |
| `dev`, `staging`, or `test` subdomain | Non-production environment with potentially weaker security |
| `api` subdomain | Backend service — may expose endpoints not visible on the main site |
| `cpanel` or `whm` subdomain | Shared hosting control panel — indicates budget hosting infrastructure |
| `vpn` or `remote` subdomain | Remote access infrastructure |
| Subdomain returning `401` | Live service requiring authentication — worth investigating what it hosts |
| Subdomain returning `403` | Server is reachable but actively denying access |
| Subdomain redirecting to an unexpected domain | Possible misconfiguration, third-party platform, or subdomain takeover risk |
| HTTP-only subdomain (no HTTPS fallback) | Older or poorly maintained service |
| Very few subdomains on a supposedly large organisation | Possibly hiding infrastructure through different domain names |
| Many subdomains on a recently registered domain | Rapid infrastructure deployment — worth investigating each service |
| Subdomains showing `unreachable` | Decommissioned services with stale CT log entries — DNS records may need cleaning |

---

## Examples across different use cases

### Bug bounty attack surface mapping

A bug bounty hunter is starting an engagement on a target with a well-defined scope. They run subdomain discovery to map what is available:

```
Total unique subdomains    8

  [001] api.target.com             [CERT] [CRT]
  [002] api-v2.target.com          [CRT]
  [003] auth.target.com            [CERT] [CRT]
  [004] beta.target.com            [CERT]
  [005] dashboard.target.com       [CERT] [CRT]
  [006] dev.target.com             [CERT]
  [007] staging.target.com         [CERT] [CRT]
  [008] www.target.com             [CERT] [CRT]

Probing live HTTP status via worker...

  [001] api.target.com             200  HTTPS
  [002] api-v2.target.com          200  HTTPS
  [003] auth.target.com            200  HTTPS
  [004] beta.target.com            --   unreachable
  [005] dashboard.target.com       401  HTTPS
  [006] dev.target.com             200  HTTPS
  [007] staging.target.com         200  HTTPS
  [008] www.target.com             200  HTTPS
```

Several interesting targets emerge immediately. `api.target.com` and `api-v2.target.com` are both live, suggesting a versioned API with a legacy endpoint still running. `auth.target.com` is a live authentication service — a high-value target. `dashboard.target.com` returns `401`, meaning an interface exists and is accessible but requires credentials. `dev.target.com` and `staging.target.com` are both live non-production environments. The hunter now has a clear map of where to focus their effort.

---

### Forgotten infrastructure audit

An IT administrator at a medium-sized company runs subdomain discovery on their own domain and discovers:

```
  [001] old-crm.company.com        [CERT]
  [002] legacy-portal.company.com  [CERT]
  [003] test2019.company.com       [CERT]

Probing live HTTP status via worker...

  [001] old-crm.company.com        --   unreachable
  [002] legacy-portal.company.com  200  HTTP
  [003] test2019.company.com       200  HTTP
```

None of these were in their current infrastructure inventory. `legacy-portal.company.com` and `test2019.company.com` are both live and serving over plain HTTP with no HTTPS — indicating old, unmaintained servers. `test2019.company.com` was a test environment from several years ago that was never properly decommissioned. The administrator investigates, finds an outdated application framework still running, shuts both servers down, and removes the DNS records.

---

### Investigating a domain with minimal subdomains

A researcher investigates a domain used in a suspicious communication. Subdomain discovery returns:

```
Total unique subdomains    3

  [001] api.suspicious-domain.com    [CERT]
  [002] webex.suspicious-domain.com  [CERT]
  [003] suspicious-domain.com        [CERT]

Probing live HTTP status via worker...

  [001] api.suspicious-domain.com    200  HTTPS
  [002] webex.suspicious-domain.com  200  HTTPS
  [003] suspicious-domain.com        301  → https://webex.suspicious-domain.com/
```

Only three subdomains on a domain that claims to be a corporate platform used by thousands of employees. The root domain redirects to `webex.suspicious-domain.com`, and the `webex.` subdomain is live. This suggests the domain is being used to impersonate a Webex meeting platform rather than being a genuine service. A real enterprise conferencing platform would have a far richer subdomain footprint.

---

## Limitations

- **Passive enumeration only** — NetSpecter does not brute-force subdomains. Subdomains that have never had a certificate issued will not be found through the CT log sources. For comprehensive active enumeration, tools such as `amass` or `subfinder` are more thorough.
- **CT log coverage** — not all certificates are indexed at the same speed across providers. Very recently issued certificates may not appear immediately in either source.
- **Historical vs active** — CT log results include subdomains that may no longer be live. The live probe phase identifies which are currently reachable, but `unreachable` does not always mean the subdomain is permanently gone — it may be temporarily down or restricted by IP.
- **crt.sh availability** — crt.sh can be slow or temporarily unavailable under load. If it times out, Certspotter results are still returned and the probe still runs.
- **Wildcard certificates** — a wildcard certificate (`*.example.com`) does not reveal which specific subdomains exist, only that the organisation uses a wildcard. CT log sources cannot enumerate individual subdomains from a wildcard entry.
- **Probe accuracy** — the live status probe uses a `HEAD` request via the NetSpecter proxy worker. Some servers do not support `HEAD` and may return `405 Method Not Allowed` even when live. A `403` or `401` still confirms the subdomain is reachable.

---

## API used

**Certificate transparency (Certspotter):** [Certspotter API](https://sslmate.com/certspotter/api/) by SSLMate. No API key required.

```
https://api.certspotter.com/v1/issuances?domain={domain}&include_subdomains=true&expand=dns_names
```

**Certificate transparency (crt.sh):** [crt.sh](https://crt.sh) by Sectigo. No API key required.

```
https://crt.sh/?q=%.{domain}&output=json
```

**Live status probe:** NetSpecter proxy worker. Routes `HEAD` requests to each discovered subdomain server-side to work around browser CORS restrictions. Results include HTTP status code, protocol, and redirect destination where applicable.

See [API Rate Limits](/api-limits) for a full breakdown across all modules.