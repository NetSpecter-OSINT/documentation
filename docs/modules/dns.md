---
title: DNS Enumeration
description: How NetSpecter's DNS module works, what each record type means, when to use it, and how to interpret your results.
---

# DNS Enumeration

The DNS module queries the public Domain Name System to retrieve all available record types for a target domain. It is usually the first module to run in any investigation because DNS records reveal the fundamental infrastructure behind a domain — where it is hosted, how email is handled, and who controls it.

---

## When to use this module

DNS enumeration is the natural starting point for almost any domain investigation. Use it when you want to:

- Understand the basic infrastructure behind an unfamiliar domain
- Identify who hosts a website and which company handles their email
- Verify whether a domain is actively configured or just registered and parked
- Detect whether a domain is hiding behind a CDN or proxy like Cloudflare
- Find SPF records and email security configuration before running the Email Security module
- Spot TXT verification tokens that reveal which third-party services an organisation uses

**Common scenarios:**

- You receive an email from an unfamiliar company and want to verify they are legitimate before responding
- A client asks you to audit their public-facing infrastructure
- You are investigating a suspicious domain and want a quick picture of its setup
- You are a student learning how the internet works in practice

---

## How it works

NetSpecter queries Google's DNS over HTTPS (DoH) endpoint at `dns.google`. This means DNS queries travel over encrypted HTTPS rather than traditional unencrypted UDP port 53. The results are identical to a standard DNS lookup but are less likely to be intercepted or filtered by your network.

Seven record types are queried in sequence:

| Record | Full name | What it reveals |
|---|---|---|
| A | Address | The IPv4 address the domain resolves to |
| AAAA | IPv6 Address | The IPv6 address, if configured |
| MX | Mail Exchanger | Which servers handle incoming email |
| NS | Nameserver | Which DNS provider controls the domain |
| TXT | Text | SPF records, verification tokens, service ownership proofs |
| CNAME | Canonical Name | Whether the domain is an alias for another domain |
| SOA | Start of Authority | The primary nameserver and administrative contact |

---

## What each record tells you

### A and AAAA records

The A record is the most fundamental DNS record. It maps a domain name to an IPv4 address. When you see two A records, the domain is either load balanced across two servers or sitting behind a proxy like Cloudflare, which assigns multiple IPs for redundancy.

If both A record IPs fall within Cloudflare's ranges (such as `104.21.x.x` or `172.67.x.x`), the real origin server is hidden. You are seeing Cloudflare's infrastructure, not the actual host. This is very common and not inherently suspicious, but it means geolocation and port data will reflect Cloudflare rather than the true hosting provider.

AAAA records indicate the domain supports IPv6. Many domains still only have A records, so a missing AAAA record is not unusual.

**Example — what a Cloudflare-proxied domain looks like:**

```
A       172.67.222.221    TTL:300
A       104.21.70.107     TTL:300
NS      paul.ns.cloudflare.com
NS      kinsley.ns.cloudflare.com
```

Both A record IPs belong to Cloudflare. The real server is hidden behind their network.

**Example — what a directly hosted domain looks like:**

```
A       176.31.251.146    TTL:3600
NS      ns1.ovh.net
NS      ns2.ovh.net
```

A single IP with OVH nameservers. The server is hosted directly at OVH with no proxy.

---

### MX records

MX records tell you where email for this domain is delivered. Each record has a priority number — lower numbers are tried first. Common patterns to recognise:

| MX value | Email provider |
|---|---|
| `*.google.com` or `aspmx.l.google.com` | Google Workspace |
| `*.mail.protection.outlook.com` | Microsoft 365 |
| `*.hostinger.com` | Hostinger |
| `*.amazonses.com` | Amazon SES |
| `*.zoho.com` | Zoho Mail |
| `*.mimecast.com` | Mimecast (enterprise security layer) |
| `*.protonmail.ch` | Proton Mail |

**A domain with no MX records cannot receive email.** This is a significant finding when investigating a domain that claims to belong to an operational business. It strongly suggests the domain was set up for web operations only, or is a placeholder.

**Example — operational business using Microsoft 365:**

```
MX      10  company-com.mail.protection.outlook.com
```

**Example — no email configured:**

```
MX      NO RECORD
```

---

### NS records

Nameserver records reveal who controls DNS for a domain. This is distinct from who hosts the website. Common patterns:

| NS value | DNS provider |
|---|---|
| `*.ns.cloudflare.com` | Cloudflare DNS |
| `*.awsdns-*.com` | AWS Route 53 |
| `*.azure-dns.com` | Azure DNS |
| `*.googledomains.com` | Google Domains |
| `*.ovh.net` | OVH |

::: tip
Seeing Cloudflare nameservers does not automatically mean Cloudflare is proxying traffic. It may simply be handling DNS resolution while the website is hosted elsewhere. Check the A records to confirm whether the IP addresses actually belong to Cloudflare.
:::

---

### TXT records

TXT records serve several purposes simultaneously and are one of the most information-rich record types for investigators.

- **SPF records** begin with `v=spf1` and define which mail servers are authorised to send email on behalf of the domain. Covered in detail in the [Email Security](/modules/email) module.
- **Verification tokens** prove domain ownership to third-party services. A token like `google-site-verification=xxxxx` means the domain owner has verified the domain in Google Search Console.
- **Service fingerprints** — each token reveals a service the organisation actually uses, even if they do not publicly advertise it.

**Example — TXT records revealing the technology stack:**

```
TXT     v=spf1 include:_spf.google.com ~all
TXT     google-site-verification=abc123
TXT     MS=ms12345678
TXT     atlassian-domain-verification=xyz
TXT     stripe-verification=abc
```

From this single record type you can infer: Google Workspace email, verified in Google Search Console, uses Microsoft 365 or Azure AD, uses Atlassian (Jira or Confluence), and uses Stripe for payments.

**Example — minimal TXT records on a suspicious domain:**

```
TXT     v=spf1 include:_spf.mail.hostinger.com ~all
```

Only a basic SPF record. No verification tokens, no service fingerprints. Consistent with a recently created, minimally configured domain.

---

### CNAME records

A CNAME record means the domain is an alias pointing to another domain name rather than directly to an IP address. This is common for subdomains pointing to hosted platforms:

```
shop.example.com      →    example.myshopify.com
docs.example.com      →    example.github.io
app.example.com       →    app.netlify.app
status.example.com    →    example.statuspage.io
```

CNAME records on subdomains are a useful pivot point — they tell you which platforms an organisation actually uses for different parts of their business.

---

### SOA record

The Start of Authority record identifies the primary nameserver and contains administrative metadata including a serial number that increments each time DNS is updated. Very low or very recent serial numbers can indicate the domain DNS was configured recently.

---

## Reading the output

Each record is displayed with its value and TTL (Time to Live) in seconds. TTL indicates how long DNS resolvers cache the record before re-checking.

```
A       172.67.222.221    TTL:300
A       104.21.70.107     TTL:300
MX      5 mx1.hostinger.com.    TTL:14400
NS      paul.ns.cloudflare.com.    TTL:21600
TXT     v=spf1 include:_spf.mail.hostinger.com ~all    TTL:3600
CNAME   NO RECORD
SOA     kinsley.ns.cloudflare.com. dns.cloudflare.com. ...    TTL:1800
```

A `NO RECORD` result means the record type is simply not configured for this domain. This is normal for many record types, particularly CNAME and AAAA.

**Low TTL values** (under 300 seconds) sometimes indicate the domain owner is actively making changes or preparing to migrate infrastructure.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| Two A records in Cloudflare IP ranges | Origin server is hidden behind Cloudflare proxy |
| No MX records | Domain cannot receive email — possible shell or redirect domain |
| Very low TTL across all records | DNS was recently configured or is being actively changed |
| No TXT records on a supposedly established business | Minimal configuration — possibly newly created or disposable |
| TXT tokens for many SaaS services | Established organisation with a real operational footprint |
| CNAME pointing to a platform (Shopify, Netlify etc.) | Reveals hosting and business tooling |
| Mismatch between registrar and nameserver tier | May indicate domain transfer or more sophisticated operator |

---

## Real world example

Below is the DNS output from an investigation into a suspicious crypto recruitment domain. Several red flags are immediately visible.

```
A       172.67.222.221    TTL:300
A       104.21.70.107     TTL:300
MX      5 mx1.hostinger.com.
MX      10 mx2.hostinger.com.
NS      paul.ns.cloudflare.com.
NS      kinsley.ns.cloudflare.com.
TXT     v=spf1 include:_spf.mail.hostinger.com ~all
CNAME   NO RECORD
SOA     kinsley.ns.cloudflare.com. ...    TTL:1800
```

**Reading this output:**

- Both A records are Cloudflare IPs — the real server is hidden
- MX records point to Hostinger — a budget shared hosting provider, not typical for a crypto company
- Only one TXT record present — a basic SPF, no service verification tokens whatsoever
- No CNAME records — no third-party platform integrations visible

Cross-referencing with WHOIS showed this domain was registered 44 days before the investigation. Combined with the minimal DNS footprint, this is consistent with freshly deployed, disposable infrastructure rather than an established business. See the full [Case Study](/guides/scam-investigation) for the complete investigation.

---

## API used

All DNS queries use [Google Public DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh). No API key is required. There are no meaningful rate limits for normal use.

```
https://dns.google/resolve?name={domain}&type={record_type}
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.