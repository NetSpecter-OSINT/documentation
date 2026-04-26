---
title: Subdomain Discovery
description: How NetSpecter's subdomain discovery module works, what subdomains reveal about an organisation's infrastructure, and practical examples across different use cases.
---

# Subdomain Discovery

The Subdomain Discovery module passively enumerates subdomains associated with a target domain. Subdomains reveal the internal structure of an organisation's infrastructure — the services they run, the platforms they use, and sometimes systems that were meant to stay out of public view.

Unlike active subdomain brute-forcing, which hammers a DNS server with thousands of guesses, NetSpecter uses entirely passive sources. No requests are made to the target's servers and no unusual traffic is generated against their infrastructure.

---

## When to use this module

Use Subdomain Discovery when you want to:

- Map the public-facing infrastructure of a domain beyond the main website
- Find services such as APIs, admin panels, staging environments, and mail servers
- Identify platforms and tools an organisation uses through subdomain naming conventions
- Discover subdomains that may have been forgotten or left unmaintained
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

NetSpecter uses two passive sources in parallel and combines the results.

**Source 1 — Certspotter certificate transparency logs**

Every TLS certificate issued for a domain must be logged in a public certificate transparency log. When an organisation issues a certificate for `api.example.com` or `staging.example.com`, that subdomain is permanently recorded in the CT logs regardless of whether the service is still running.

NetSpecter queries the Certspotter API to retrieve all certificate issuances for the target domain including subdomains. Every unique hostname found in the `dns_names` field of each certificate is extracted and added to the results.

This source is particularly powerful for finding subdomains that were once active but have since been removed — they may still appear in CT logs from years ago, giving you historical visibility that DNS alone cannot provide.

**Source 2 — Common subdomain DNS probe**

NetSpecter probes a curated list of 35 common subdomain prefixes directly against DNS. Each prefix is checked for a live A record. Any that resolve to an IP address are added to the results, even if they have no corresponding certificate log entry.

The probed prefixes include:

```
www, mail, email, smtp, pop, imap, ftp, sftp,
api, dev, staging, test, beta, app, portal, admin,
dashboard, blog, shop, store, cdn, media, static,
assets, img, images, vpn, remote, mx, ns1, ns2,
cpanel, whm, webmail, autodiscover, autoconfig
```

This source catches actively running subdomains that may not have their own certificate — for example an internal mail server, a cPanel panel, or an autodiscover endpoint for email client configuration.

Both sources run simultaneously and their results are merged and deduplicated before display.

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

A subdomain appearing in certificate transparency logs does not necessarily mean it is still active. CT logs are permanent records — a subdomain that was live two years ago and then decommissioned will still appear in the results. This historical data can be useful for:

- Understanding how an organisation's infrastructure has evolved
- Finding services that were once public but may now be internal
- Identifying naming conventions the organisation uses

To verify whether a historical subdomain is still live, you can manually query its DNS or attempt to connect to it.

---

## Reading the output

```
Source [1/2]: Certspotter CT logs...
Certspotter returned 8 entries.

Source [2/2]: Common subdomain DNS probe...
DNS probe found 3 additional subdomains.

Total subdomains found    11

[001] api.example.com
[002] autoconfig.example.com
[003] autodiscover.example.com
[004] blog.example.com
[005] dev.example.com
[006] mail.example.com
[007] smtp.example.com
[008] staging.example.com
[009] static.example.com
[010] www.example.com
[011] example.com
```

Results are sorted alphabetically. The apex domain itself is included when found in CT logs.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| `admin`, `dashboard`, or `portal` subdomain | Management interface potentially exposed to the internet |
| `dev`, `staging`, or `test` subdomain | Non-production environment with potentially weaker security |
| `api` subdomain | Backend service — may expose endpoints not visible on the main site |
| `cpanel` or `whm` subdomain | Shared hosting control panel — indicates budget hosting infrastructure |
| `vpn` or `remote` subdomain | Remote access infrastructure |
| Very few subdomains on a supposedly large organisation | Possibly hiding infrastructure through different domain names |
| Many subdomains on a recently registered domain | Rapid infrastructure deployment — worth investigating each service |
| Subdomains that no longer resolve to DNS | Historical services that have been decommissioned |

---

## Examples across different use cases

### Bug bounty attack surface mapping

A bug bounty hunter is starting an engagement on a target with a well-defined scope. They run subdomain discovery to map what is available:

```
Total subdomains found    23

[001] api.target.com
[002] api-v2.target.com
[003] auth.target.com
[004] beta.target.com
[005] cdn.target.com
[006] dashboard.target.com
[007] dev.target.com
[008] docs.target.com
[009] staging.target.com
[010] status.target.com
...
```

Several interesting targets emerge immediately. `api.target.com` and `api-v2.target.com` suggest a versioned API with a legacy endpoint still running. `auth.target.com` is an authentication service — a high-value target. `dev.target.com` and `staging.target.com` are non-production environments that may have different security configurations. The hunter now has a clear map of where to focus their effort.

---

### Forgotten infrastructure audit

An IT administrator at a medium-sized company runs subdomain discovery on their own domain and discovers:

```
[001] old-crm.company.com
[002] legacy-portal.company.com
[003] test2019.company.com
```

None of these were in their current infrastructure inventory. `test2019.company.com` was a test environment from several years ago that was never decommissioned — it still has a live DNS record pointing to an old server. The administrator investigates and finds the server is still running an outdated version of a web application framework. It gets shut down and the DNS record is removed.

---

### Understanding a competitor's technical footprint

A product manager wants to understand what services a competitor runs to inform their own product roadmap. Running subdomain discovery reveals:

```
[001] api.competitor.com
[002] app.competitor.com
[003] docs.competitor.com
[004] status.competitor.com
[005] webhooks.competitor.com
[006] www.competitor.com
```

The presence of `status.competitor.com` suggests they use a status page service. `webhooks.competitor.com` indicates they have a webhook integration feature. `docs.competitor.com` means they maintain separate developer documentation. All of this is publicly visible information that provides useful competitive context.

---

### Investigating a domain with minimal subdomains

A researcher investigates a domain used in a suspicious communication. Subdomain discovery returns:

```
Total subdomains found    3

[001] api.suspicious-domain.com
[002] webex.suspicious-domain.com
[003] suspicious-domain.com
```

Only three subdomains on a domain that claims to be a corporate platform used by thousands of employees. The `webex.` subdomain is particularly interesting — it suggests the domain is being used to impersonate a Webex meeting platform rather than being a genuine service. A real enterprise conferencing platform would have a far richer subdomain footprint.

---

## Limitations

- **Passive sources only** — NetSpecter does not brute-force subdomains. Subdomains that have never had a certificate and do not match the 35 common prefixes will not be found. For comprehensive subdomain enumeration, active tools such as `amass` or `subfinder` are more thorough.
- **CT log coverage** — not all certificates are indexed by all CT logs at the same speed. Very recently issued certificates may not appear immediately.
- **Historical vs active** — CT log results include historical subdomains that may no longer be live. The DNS probe confirms active subdomains, but CT log entries should be verified manually if currency matters.
- **Certspotter rate limits** — the free Certspotter API allows a limited number of requests per hour. If results show unexpectedly few entries for a well-established domain, try again after a few minutes.
- **Wildcard certificates** — a wildcard certificate (`*.example.com`) does not reveal which specific subdomains exist. It only confirms the organisation uses a wildcard. The DNS probe is the primary tool for discovering actual subdomains in this case.

---

## API used

**Certificate transparency:** [Certspotter API](https://sslmate.com/certspotter/api/) by SSLMate. No API key required.

```
https://api.certspotter.com/v1/issuances?domain={domain}&include_subdomains=true&expand=dns_names
```

**DNS probe:** [Google Public DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh). No API key required. 35 common prefixes are probed in parallel.

```
https://dns.google/resolve?name={subdomain}&type=A
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.