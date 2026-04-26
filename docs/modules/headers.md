---
title: HTTP Headers & Security Audit
description: How NetSpecter's HTTP headers module works, what response headers reveal about a server, how to interpret the security audit score, and practical examples.
---

# HTTP Headers & Security Audit

The HTTP Headers module fetches the response headers returned by a web server and audits them against nine critical security headers. Headers are metadata attached to every HTTP response — they control how browsers interact with a page, reveal information about the server software, and determine whether key security protections are in place.

This module answers two questions simultaneously: what is the server telling us about itself, and how well is it protecting its visitors?

---

## When to use this module

Use HTTP Headers when you want to:

- Audit the security posture of a web server against modern best practices
- Identify missing security headers that leave users exposed to common attacks
- Check what server software and technology a site is running
- Detect caching behaviour and content delivery configuration
- Verify that security headers are correctly configured after a deployment
- Assess the maturity of an organisation's web security practices

**Common scenarios:**

- A developer has deployed a new application and wants to verify security headers are configured correctly before going live
- A security team is conducting a web application assessment and needs a quick header audit as a starting point
- An IT administrator is reviewing the security posture of their organisation's public-facing websites
- A penetration tester is gathering passive intelligence about a target's server configuration
- A user wants to understand why their browser is blocking certain resources on a site

---

## How it works

NetSpecter routes the header fetch through a Cloudflare Worker proxy. This is necessary because browsers block direct cross-origin header fetches as a security measure — without a proxy, the request would never reach the target server.

The worker makes a standard GET request to the target domain over HTTPS (falling back to HTTP if HTTPS fails), collects all response headers, and returns them as JSON. NetSpecter then parses the headers, displays them in full, and runs the security audit.

```
Browser   →   Cloudflare Worker   →   Target server   →   Response headers   →   Security audit
```

---

## What the results tell you

### Raw headers

All headers returned by the server are displayed in the order received. Some headers are informational, some reveal server configuration, and some are the security controls being audited.

**Commonly seen headers and what they reveal:**

| Header | What it reveals |
|---|---|
| `server` | Web server software (nginx, Apache, cloudflare etc.) |
| `content-type` | The type of content being served |
| `content-length` | The size of the response body in bytes |
| `date` | The server's current date and time |
| `last-modified` | When the content was last changed on the server |
| `cf-ray` | Cloudflare ray ID — confirms the site is behind Cloudflare |
| `x-powered-by` | Application framework (PHP, Express etc.) — often a fingerprinting risk |
| `cache-control` | How the response should be cached by browsers and proxies |
| `transfer-encoding` | How the response body is transmitted |
| `vary` | Which request headers affect the cached response |

A `content-length` value below 100 bytes on a domain that claims to be an operational website is flagged automatically as an anomaly. A response body of 15 bytes is not a website — it is a stub, a redirect handler, or a placeholder.

A `content-type` of `text/plain` on a domain that presents itself as a web platform is similarly flagged. Real websites return `text/html`.

---

### Security header audit

NetSpecter audits the response against nine security headers and produces a score out of nine. Each header either passes (PRESENT) or fails (MISSING).

| Header | What it does | Risk if missing |
|---|---|---|
| `strict-transport-security` | Forces browsers to use HTTPS only | Users can be downgraded to HTTP by a network attacker |
| `content-security-policy` | Controls which resources the page can load | Cross-site scripting (XSS) attacks are easier to execute |
| `x-frame-options` | Prevents the page being embedded in an iframe | Clickjacking attacks become possible |
| `x-content-type-options` | Stops browsers guessing the content type | MIME-type confusion attacks |
| `referrer-policy` | Controls how much referrer information is shared | Sensitive URLs may leak to third parties |
| `permissions-policy` | Controls browser feature access (camera, mic etc.) | Unwanted access to device features |
| `x-xss-protection` | Legacy XSS filter for older browsers | Reduced protection in older browsers |
| `cross-origin-opener-policy` | Isolates the browsing context | Cross-origin attacks via window references |
| `cross-origin-resource-policy` | Controls cross-origin resource loading | Resources can be embedded by other origins |

**Security score interpretation:**

| Score | Assessment |
|---|---|
| 7 to 9 / 9 | Strong security posture — well-configured server |
| 4 to 6 / 9 | Moderate — some protections in place but gaps remain |
| 1 to 3 / 9 | Weak — most security headers are missing |
| 0 / 9 | No security headers — minimal web security configuration |

---

### The most important headers to look for

Not all nine headers carry equal weight. These three have the highest impact:

**Strict-Transport-Security (HSTS)** is the most critical. Without it, a user who types the domain into their browser without specifying `https://` can be silently redirected to an unencrypted HTTP version of the site by a network attacker. Any site that handles accounts, payments, or sensitive data should have this configured.

**Content-Security-Policy (CSP)** is the most complex and often missing even on otherwise well-configured servers. A properly configured CSP significantly reduces the impact of cross-site scripting attacks by restricting which scripts, styles, and resources the page can load.

**X-Frame-Options** prevents the page being embedded in an iframe on another domain — a technique used in clickjacking attacks where a victim is tricked into clicking something on an invisible overlay.

---

### Anomaly detection

Beyond the nine-header audit, NetSpecter flags two specific anomalies:

**Minimal response body** — if `content-length` is present and below 100 bytes, the module flags this. A legitimate website does not fit in 100 bytes. This pattern is consistent with stub domains, redirect handlers, or placeholder pages set up during infrastructure deployment.

**Plain text content type** — if the server returns `content-type: text/plain` rather than `text/html`, this is unusual for a domain presenting itself as a website and is flagged accordingly.

---

## Reading the output

```
cf-ray                     9f144b761c8f638d-MAD
content-type               text/html
date                       Fri, 24 Apr 2026 10:07:35 GMT
last-modified              Fri, 27 Mar 2026 21:53:30 GMT
referrer-policy            strict-origin-when-cross-origin
server                     cloudflare
x-content-type-options     nosniff
x-frame-options            SAMEORIGIN
x-xss-protection           1; mode=block

>> SECURITY HEADER AUDIT

strict-transport-security      MISSING
content-security-policy        MISSING
x-frame-options                PRESENT
x-content-type-options         PRESENT
referrer-policy                PRESENT
permissions-policy             MISSING
x-xss-protection               PRESENT
cross-origin-opener-policy     MISSING
cross-origin-resource-policy   MISSING

Security Header Score          4/9 (44%)
```

This result shows a Cloudflare-hosted site with four security headers in place. The missing headers — HSTS, CSP, Permissions-Policy, COOP, and CORP — represent the most common gaps seen on sites that have applied some but not all security hardening.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| Score 0 to 2 / 9 | Minimal security configuration — poorly maintained or rapidly deployed |
| `content-length` below 100 bytes | Stub or placeholder — not a real website |
| `content-type: text/plain` | Not serving HTML — unusual for a web domain |
| `x-powered-by` header present | Reveals application framework — useful for fingerprinting, should be removed |
| `server: cloudflare` | Behind Cloudflare CDN |
| `server: nginx` or `server: apache` | Direct server exposure — version information may be visible |
| HSTS missing | Users can be downgraded to HTTP |
| CSP missing | Higher XSS risk |
| `last-modified` date inconsistent with claimed history | Page was created or significantly changed recently |

---

## Examples across different use cases

### Post-deployment security check

A developer has just configured security headers on their web application after reading an OWASP guide. They run the headers module to verify:

```
strict-transport-security      PRESENT
content-security-policy        PRESENT
x-frame-options                PRESENT
x-content-type-options         PRESENT
referrer-policy                PRESENT
permissions-policy             PRESENT
x-xss-protection               PRESENT
cross-origin-opener-policy     PRESENT
cross-origin-resource-policy   PRESENT

Security Header Score          9/9 (100%)
```

All nine headers present. The developer confirms the configuration is correct before announcing the launch.

---

### Security audit of a public sector website

A security researcher is assessing a local government website as part of a responsible disclosure programme:

```
strict-transport-security      PRESENT
content-security-policy        MISSING
x-frame-options                PRESENT
x-content-type-options         PRESENT
referrer-policy                MISSING
permissions-policy             MISSING
x-xss-protection               PRESENT
cross-origin-opener-policy     MISSING
cross-origin-resource-policy   MISSING

Security Header Score          4/9 (44%)
```

A score of 4/9 on a public sector site handling citizen data. The missing CSP is the most significant gap. The researcher documents the findings and submits a responsible disclosure report recommending the missing headers be added.

---

### Spotting a stub domain

An investigator is checking the headers of a domain used in a suspicious communication:

```
content-type      text/plain; charset=UTF-8
content-length    15
server            cloudflare

⚠ Response body only 15 bytes - possible shell or placeholder domain.
⚠ Server returned text/plain not text/html - unusual for a web domain.

Security Header Score    2/9 (22%)
```

Fifteen bytes of plain text. Not a website. This domain has a Cloudflare front but is serving essentially nothing — consistent with a domain set up purely to host subdomains or redirect traffic rather than serve legitimate content. 

---

### Identifying server software

A penetration tester is gathering passive intelligence before an authorised engagement:

```
server           Apache/2.4.51 (Ubuntu)
x-powered-by     PHP/7.4.33
```

The server header reveals the exact Apache version and the `x-powered-by` header reveals PHP 7.4 — a version that reached end of life in November 2022 and no longer receives security patches. Both headers should be suppressed in production and their presence reveals a server that has not been hardened. The tester notes this for the vulnerability assessment phase.

---

## Limitations

- **HTTPS only for scoring** — the security header audit is most meaningful for HTTPS sites. Sites served over HTTP cannot implement HSTS meaningfully and the score should be interpreted with that context.
- **Cloudflare and CDN headers** — headers returned for Cloudflare-proxied sites reflect Cloudflare's configuration as well as the origin server's. Some headers may be added or modified by Cloudflare itself rather than the origin application.
- **Dynamic headers** — some headers vary by page, user agent, or session state. The module fetches the root URL (`/`) so headers configured only on specific pages or for authenticated users will not appear.
- **Worker rate limits** — the header fetch routes through a Cloudflare Worker. The free tier supports 100,000 requests per day which is more than sufficient for normal use.

---

## API used

HTTP headers are fetched via a Cloudflare Worker proxy to handle cross-origin restrictions. The worker makes a standard GET request to the target and returns all response headers as JSON.

No third-party API key is required. The worker is self-hosted as part of the NetSpecter infrastructure.

See [API Rate Limits](/api-limits) for a full breakdown across all modules.