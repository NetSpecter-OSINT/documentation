---
title: Tech Fingerprinting
description: How NetSpecter's tech fingerprint module works, how it infers a technology stack from DNS records alone, and practical examples across different use cases.
---

# Tech Fingerprinting

The Tech Fingerprint module infers the technology stack behind a domain entirely from DNS records — without making a single request to the target's web server. By analysing nameserver records, A records, CNAME records, MX records, and TXT records, it identifies the DNS provider, CDN or hosting platform, email provider, and SaaS tools in use.

This approach is both powerful and genuinely passive. The target has no way of knowing the analysis took place because no connection is ever made to their infrastructure.

---

## When to use this module

Use Tech Fingerprinting when you want to:

- Identify which platforms and services an organisation uses without visiting their website
- Detect CDN or WAF providers protecting a domain
- Understand the email platform an organisation has deployed
- Find SaaS tool usage through DNS verification tokens
- Build a picture of an organisation's technical maturity and investment level
- Supplement findings from the DNS module with interpreted conclusions

**Common scenarios:**

- A sales team wants to know which technology platforms a prospect uses before an outreach call
- A security researcher is building a profile of an organisation's infrastructure during authorised reconnaissance
- A developer is considering a migration and wants to understand how a similar company has structured their stack
- An IT administrator is auditing their own DNS records to see what information is publicly visible
- An investigator wants to quickly assess whether a domain belongs to a real operational business or a minimal setup

---

## How it works

The module queries five DNS record types in sequence and applies pattern matching against known signatures for each category.

```
NS records    →    DNS provider detection
A records     →    Cloudflare proxy detection + IP range matching
CNAME records →    CDN and hosting platform detection
MX records    →    Email provider detection
TXT records   →    SaaS service token detection
```

No requests are made to the target's web server at any point. Every inference is derived entirely from publicly available DNS data.

---

## What the results tell you

### DNS provider

The nameserver (NS) records reveal which company controls DNS resolution for the domain. This is detected by matching NS hostnames against a database of known provider patterns.

**Common DNS providers and what they suggest:**

| Provider | Notes |
|---|---|
| Cloudflare DNS | Very common — also likely using Cloudflare proxy |
| AWS Route 53 | Suggests AWS infrastructure elsewhere in the stack |
| Azure DNS | Suggests Microsoft Azure infrastructure |
| Google Cloud DNS | Suggests Google Cloud infrastructure |
| Hetzner DNS | Common with Hetzner dedicated or VPS hosting |
| DigitalOcean DNS | Common with DigitalOcean VPS hosting |
| Namecheap / Registrar DNS | Domain using registrar's default nameservers — minimal configuration |

The DNS provider is often a strong signal about the rest of the stack. An organisation on Route 53 is almost certainly hosting in AWS. An organisation on Cloudflare DNS may or may not be using Cloudflare's proxy — the A records confirm this.

---

### CDN and hosting platform

CDN and hosting detection works through two signals. First, A records are checked against Cloudflare's known IP ranges — if the IP belongs to Cloudflare, the domain is behind Cloudflare's proxy. Second, CNAME records on the root domain and `www` subdomain are matched against known hosting platform patterns.

**Detected platforms and what they reveal:**

| Platform | What it indicates |
|---|---|
| Cloudflare (Proxy / WAF) | Traffic routed through Cloudflare — origin hidden, DDoS protection active |
| AWS CloudFront | Using Amazon's CDN — often with S3 or EC2 origin |
| Fastly | CDN typically used by developers and media companies |
| Netlify | Static site or JAMstack deployment |
| Vercel | Frontend framework deployment — Next.js, React etc. |
| GitHub Pages | Static site hosted on GitHub |
| Shopify | E-commerce platform |
| Squarespace | Website builder platform |
| WP Engine | Managed WordPress hosting |
| Heroku | Application platform — common for startups and MVPs |
| Render | Modern application hosting platform |

**What Cloudflare proxy detection specifically tells you:**

When Cloudflare proxy is detected the origin server's true IP address and hosting provider are hidden. All GEO-IP and port data will reflect Cloudflare's infrastructure rather than the real host. This is extremely common among legitimate businesses and is not inherently suspicious — but it does limit what passive analysis can determine about the underlying infrastructure.

---

### Email provider

MX records are matched against known mail server patterns to identify the email platform. This is one of the most reliable fingerprinting signals because MX records are mandatory for receiving email and their values are highly distinctive.

**Common email providers and what they suggest:**

| Provider | Notes |
|---|---|
| Google Workspace | Professional Google email — common across businesses of all sizes |
| Microsoft 365 | Enterprise Microsoft email — very common in corporates |
| Proton Mail | Privacy-focused email — common with security-conscious operators |
| Hostinger | Budget shared hosting email |
| Zoho Mail | Cost-effective business email — common with smaller companies |
| Mimecast | Enterprise email security layer — sits in front of Exchange or 365 |
| Proofpoint | Enterprise email security — similar to Mimecast |
| Amazon SES | Transactional email sending service — not typically for receiving |
| Mailgun | Developer-focused transactional email |

The email provider choice often reflects organisational maturity. A domain claiming to be an enterprise company using budget shared hosting email is an inconsistency worth noting.

---

### SaaS service tokens

TXT records frequently contain domain verification tokens published when an organisation connects a third-party service. Each token follows a distinctive format that identifies the service it belongs to. NetSpecter matches over 20 known token patterns.

**Detected services and what they reveal:**

| Token pattern | Service detected |
|---|---|
| `google-site-verification` | Google Search Console |
| `MS=` | Microsoft 365 or Entra ID |
| `atlassian-domain-verification` | Atlassian (Jira, Confluence) |
| `docusign=` | DocuSign — electronic signature workflows |
| `facebook-domain-verification` | Meta / Facebook business account |
| `stripe-verification` | Stripe — payment processing |
| `zoom-` | Zoom — video conferencing |
| `hubspot-` | HubSpot — CRM and marketing |
| `salesforce-` | Salesforce — enterprise CRM |
| `klaviyo` | Klaviyo — email marketing |
| `shopify` | Shopify — e-commerce |
| `ahrefs` | Ahrefs — SEO tooling |
| `braintree` | Braintree / PayPal — payment processing |
| `intercom` | Intercom — customer messaging |
| `pardot` | Salesforce Pardot — B2B marketing |
| `adobe-idp` | Adobe Experience Cloud |
| `zendesk` | Zendesk — customer support |
| `twilio` | Twilio — communications platform |

SaaS tokens are one of the most revealing passive signals available. An organisation may not publish their technology stack, but their DNS TXT records often tell the story clearly. A domain with tokens for Salesforce, HubSpot, DocuSign, and Stripe is almost certainly a legitimate commercial operation. A domain with no tokens at all is either very new, very minimal, or deliberately sparse.

---

### Fingerprint summary

At the end of the module a summary consolidates the key findings:

```
DNS Host        Cloudflare DNS
CDN / WAF       Cloudflare (Proxy / WAF)
Email Stack     Google Workspace
SaaS Count      4 service(s) identified
Cloudflare      YES - IP behind CF proxy
```

---

## Reading the full output

**A well-established organisation:**

```
NS Records           2 nameservers found
  NS                 ns1.company.awsdns-01.com.
  NS                 ns2.company.awsdns-01.net.
DNS Provider         AWS Route 53

A Record             52.84.12.44
A Record             52.84.12.45

CDN / HOSTING STACK
  Detected           AWS CloudFront CDN

Probing MX for email provider...
Email Provider       Microsoft 365

Mining TXT records for SaaS service tokens...
  Detected           Microsoft 365 / Entra ID
  Detected           Google Search Console
  Detected           Atlassian (Jira/Confluence)
  Detected           Salesforce
  Detected           DocuSign

FINGERPRINT SUMMARY
DNS Host             AWS Route 53
CDN / WAF            AWS CloudFront CDN
Email Stack          Microsoft 365
SaaS Count           5 service(s) identified
Cloudflare           No CF proxy detected
```

Route 53 and CloudFront suggest an AWS-native infrastructure. Microsoft 365 for email. Five SaaS tokens indicating Google Search Console, Atlassian, Salesforce, and DocuSign — a technology footprint consistent with a mid-to-large enterprise.

**A minimal or suspicious domain:**

```
NS Records           2 nameservers found
  NS                 paul.ns.cloudflare.com.
  NS                 kinsley.ns.cloudflare.com.
DNS Provider         Cloudflare DNS

A Record             172.67.222.221
A Record             104.21.70.107

CDN / HOSTING STACK
  Detected           Cloudflare (Proxy / WAF)

Email Provider       Self-hosted / Unknown
  MX                 mx1.hostinger.com.
  MX                 mx2.hostinger.com.

SaaS Services        No recognisable tokens in TXT records

FINGERPRINT SUMMARY
DNS Host             Cloudflare DNS
CDN / WAF            Cloudflare (Proxy / WAF)
Email Stack          Unknown
SaaS Count           0 service(s) identified
Cloudflare           YES - IP behind CF proxy
```

Cloudflare DNS and proxy, Hostinger email, zero SaaS tokens. This is the minimum viable configuration — a domain that has been set up quickly with budget infrastructure and no third-party service integrations visible.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| Zero SaaS tokens on a supposedly established business | Minimal DNS footprint — inconsistent with genuine operational history |
| Email provider inconsistent with claimed company size | Budget email on an enterprise claim |
| CDN proxy masking origin | Cannot determine real hosting location passively |
| Registrar-default nameservers | Domain using default DNS — minimal configuration |
| Many SaaS tokens | Genuine operational footprint — hard to fake |
| AWS Route 53 or Azure DNS | Infrastructure likely hosted on the same cloud platform |
| Token for payment processor (Stripe, Braintree) | Organisation processes payments — consistent with commercial operation |
| Token for security tools (Ahrefs, SEMrush) | Organisation invests in SEO and online presence |

---

## Examples across different use cases

### Sales intelligence before an outreach call

A sales representative is preparing for a call with a prospect and wants to understand their technology stack beforehand:

```
Email Stack     Google Workspace
SaaS Count      3 service(s) identified
  Detected      HubSpot
  Detected      Salesforce
  Detected      Stripe
```

The prospect uses Google Workspace for email, HubSpot for marketing, Salesforce for CRM, and Stripe for payments. The sales representative knows to frame their pitch around integration with these platforms and avoid suggesting the prospect adopt any competing tools they already use.

---

### Competitive intelligence

A product manager wants to understand how a competitor has structured their technical infrastructure:

```
DNS Host        AWS Route 53
CDN / WAF       AWS CloudFront CDN
Email Stack     Google Workspace
SaaS Count      6 service(s) identified
  Detected      Google Search Console
  Detected      Atlassian (Jira/Confluence)
  Detected      Intercom
  Detected      Zendesk
  Detected      HubSpot
  Detected      Klaviyo
```

The competitor is AWS-native, uses Google Workspace for email, Atlassian for internal project management, Intercom and Zendesk for customer support, HubSpot for marketing, and Klaviyo for email campaigns. This is a substantial investment in tooling — consistent with a well-funded, operationally mature company.

---

### Auditing your own DNS exposure

An IT administrator wants to see what information their organisation's DNS records reveal to anyone who queries them:

```
SaaS Count      8 service(s) identified
  Detected      Google Search Console
  Detected      Microsoft 365 / Entra ID
  Detected      Atlassian (Jira/Confluence)
  Detected      Salesforce
  Detected      DocuSign
  Detected      Zoom
  Detected      Adobe Experience Cloud
  Detected      Stripe
```

Eight services are publicly identifiable through TXT tokens alone. The administrator reviews the list and removes two tokens for services that were decommissioned six months ago but whose DNS records were never cleaned up. They also note that the full list reveals more about the organisation's tooling than they would like to be publicly visible and discuss whether any tokens can be removed without breaking the associated service verifications.

---

### Assessing a domain claiming to be an established business

An analyst is investigating a domain that was used in a suspicious approach. The company claims to have been operating for several years:

```
Email Stack     Self-hosted / Unknown
  MX            mx1.hostinger.com.
SaaS Count      0 service(s) identified
Cloudflare      YES - IP behind CF proxy
```

Zero SaaS tokens. Budget shared hosting email. No third-party integrations visible anywhere in the DNS records. A company operating for several years and claiming to work with corporate clients would typically accumulate at least some SaaS service tokens — Google Search Console at minimum, and likely several others. The complete absence of any tokens, combined with other findings across modules, is a strong indicator this domain does not belong to a genuine established business.

---

## Limitations

- **DNS only** — the module infers the stack from DNS records exclusively. Technologies deployed at the application layer (frameworks, databases, analytics tools) that do not leave DNS traces are not detected.
- **Token removal** — organisations can remove verification tokens from their DNS after initial setup. A service may be in active use but no longer have a visible token if it was cleaned up.
- **CNAME detection scope** — CNAME-based platform detection works for domains using CNAME records on their root or `www` subdomain. Domains using A records directly (rather than CNAMEs) will not trigger CNAME-based platform detection.
- **Non-standard patterns** — the module matches against a curated list of known signatures. Unusual or custom configurations may not be recognised.
- **Cloudflare proxy limitation** — when Cloudflare proxy is active, CNAME records pointing to origin hosting platforms may not be visible because Cloudflare replaces them with its own A records.

---

## API used

All fingerprinting uses [Google Public DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh). NS, A, CNAME, MX, and TXT records are queried. The `www` subdomain CNAME is also checked separately.

No API key is required. There are no meaningful rate limits for normal use.

```
https://dns.google/resolve?name={domain}&type={record_type}
https://dns.google/resolve?name=www.{domain}&type=CNAME
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.