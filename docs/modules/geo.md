---
title: GEO-IP Location
description: How NetSpecter's GEO-IP module works, what location and network data reveals, and practical examples across different use cases.
---

# GEO-IP Location

The GEO-IP module resolves a domain or IP address to its approximate physical location and network context — country, city, ISP, ASN, timezone, and more. It is a fast way to understand where infrastructure is physically hosted and who owns the network it sits on.

---

## When to use this module

Use GEO-IP when you want to:

- Identify the country and city where a server is physically located
- Determine which ISP or hosting provider owns the IP address
- Find the Autonomous System Number (ASN) that controls the network
- Check whether a domain resolves to a CDN or proxy rather than an origin server
- Spot geographic inconsistencies — for example a company claiming to be based in one country but hosting infrastructure in another
- Enrich an IP address with contextual network information

**Common scenarios:**

- A sysadmin sees an unfamiliar IP in server logs and wants to know where it originates
- A security analyst is triaging an alert and needs to quickly establish the geographic origin of a connection
- An IT team is verifying that a SaaS vendor's infrastructure is hosted in a region that meets their data residency requirements
- A researcher wants to know which hosting provider a target organisation uses
- Someone has received a suspicious email and wants to understand where the sending infrastructure is based

---

## How it works

When you enter a domain name, NetSpecter first resolves it to an IP address using a DNS A record query. It then queries `ipapi.co` with the resolved IP to retrieve geographic and network metadata.

If you enter an IP address directly, the DNS resolution step is skipped and the geolocation query runs immediately.

```
Domain input   →   DNS A record query   →   IP address   →   ipapi.co   →   Results
IP input       →   ipapi.co directly    →   Results
```

---

## What the results tell you

### Location fields

| Field | What it means |
|---|---|
| IP Address | The resolved IP that was geolocated |
| City | Approximate city — accuracy varies, see note below |
| Region | State or region within the country |
| Country | Country name and two-letter ISO code |
| Latitude / Longitude | Approximate coordinates |
| Timezone | IANA timezone identifier (e.g. `America/New_York`) |
| UTC Offset | Current offset from UTC including DST |
| Currency | Currency used in that country |
| EU Member | Whether the country is an EU member state |

::: warning Accuracy note
GEO-IP data is approximate. City-level accuracy is typically within 25 to 50 miles for residential IPs and significantly less precise for cloud and CDN infrastructure. IP geolocation is based on registration data and network routing, not GPS. Never rely on it for precise physical location.
:::

---

### Network fields

| Field | What it means |
|---|---|
| ISP / Org | The organisation that owns this IP block |
| ASN | Autonomous System Number — the network routing entity |

The ISP and ASN fields are often more useful than the geographic location. They tell you who actually owns and operates the network, which reveals what kind of infrastructure you are looking at.

**Common ASN patterns to recognise:**

| ASN / Org | What it indicates |
|---|---|
| `AS13335 Cloudflare, Inc.` | Cloudflare CDN or proxy — origin server is hidden |
| `AS16509 Amazon.com, Inc.` | AWS infrastructure |
| `AS15169 Google LLC` | Google Cloud or Google services |
| `AS8075 Microsoft Corporation` | Azure infrastructure |
| `AS14061 DigitalOcean` | DigitalOcean VPS hosting |
| `AS24940 Hetzner Online GmbH` | Hetzner dedicated or VPS hosting |
| `AS16276 OVH SAS` | OVH dedicated or VPS hosting |

When the ASN belongs to a major CDN (Cloudflare, Fastly, Akamai), the physical location shown is the CDN edge node, not the origin server. The real hosting location is hidden behind the CDN.

---

### EU Member flag

The EU Member field indicates whether the server's apparent country is an EU member state. This is a quick reference for data residency and GDPR compliance questions — if a domain resolves to infrastructure outside the EU, data processed by that service may not be subject to GDPR protections.

---

## Reading the output

A typical result for a Cloudflare-proxied domain:

```
IP Address    172.67.222.221
City          Toronto
Region        Ontario
Country       Canada (CA)
Latitude      43.6492
Longitude     -79.3823
Timezone      America/Toronto
UTC Offset    -0400
ISP / Org     Cloudflare, Inc.
ASN           AS13335
Currency      Dollar
EU Member     NO
```

The location shows Toronto but the ISP is Cloudflare. This means the domain is behind Cloudflare's CDN — the Toronto edge node is simply the closest Cloudflare point of presence to wherever the query originated. The actual hosting server could be anywhere in the world.

A typical result for a directly hosted server:

```
IP Address    176.31.251.146
City          Roubaix
Region        Nord
Country       France (FR)
Latitude      50.6942
Longitude     3.1746
Timezone      Europe/Paris
UTC Offset    +0200
ISP / Org     OVH SAS
ASN           AS16276
Currency      Euro
EU Member     YES
```

The IP resolves directly to OVH in France. No CDN in the way — this is the actual hosting location. The EU Member flag confirms the infrastructure is within the EU.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| ASN belongs to Cloudflare, Fastly or Akamai | Origin server is hidden behind a CDN |
| Location shows a major CDN hub city | Likely a CDN edge node, not the real host |
| ASN belongs to a VPS provider (DigitalOcean, Hetzner, Vultr) | Low-cost hosting — common for small operations and test infrastructure |
| Country inconsistent with claimed business location | Infrastructure hosted in a different jurisdiction than claimed |
| EU Member: NO | Data processed by this service may not be subject to GDPR |
| Multiple domains resolving to the same IP or ASN | Shared hosting or related infrastructure |

---

## Examples across different use cases

### Data residency check

An IT manager is evaluating a new HR software vendor. The vendor claims their platform is hosted in the EU. Running GEO-IP on their domain returns:

```
Country       United States (US)
ISP / Org     Amazon.com, Inc.
ASN           AS16509
EU Member     NO
```

The platform is hosted on AWS in the US. This directly contradicts the vendor's claim and is a compliance concern for any organisation subject to GDPR or EU data residency requirements.

---

### Server log investigation

A sysadmin notices repeated failed login attempts from an IP address in their web server logs. They run GEO-IP directly on the IP:

```
IP Address    45.152.66.234
City          Amsterdam
Region        North Holland
Country       Netherlands (NL)
ISP / Org     M247 Europe SRL
ASN           AS9009
EU Member     YES
```

M247 is a hosting provider frequently used for VPN exit nodes and automated attack infrastructure. Combined with the login attempt pattern, this warrants blocking the IP range and investigating further.

---

### Verifying a supplier's claimed location

A logistics company is onboarding a new supplier who claims to be based in Germany. Their website domain resolves to:

```
Country       Russia (RU)
ISP / Org     Selectel Ltd.
ASN           AS49505
EU Member     NO
```

The infrastructure is hosted in Russia, not Germany. This geographic inconsistency is worth raising with the supplier before proceeding with the onboarding process.

---

### Personal curiosity

Someone notices their favourite indie game studio's website loads slowly and wonders where it is hosted:

```
City          San Francisco
Country       United States (US)
ISP / Org     Fastly, Inc.
ASN           AS54113
```

Fastly is a CDN — the studio is distributing their site through a content delivery network. The slow loading is unlikely to be a hosting location issue and is more probably a local network or caching problem.

---

## Limitations

GEO-IP has inherent limitations that are worth understanding before drawing conclusions:

- **CDN and proxy masking** — any domain behind Cloudflare, Fastly, or a similar CDN will show CDN infrastructure rather than the origin server location
- **City-level inaccuracy** — geolocation databases are updated periodically but can lag behind IP reassignments by weeks or months
- **VPN and proxy use** — if the target domain's server is itself behind a VPN, the resolved location will be the VPN exit node
- **Shared hosting** — many domains share an IP on shared hosting; the geolocation reflects the hosting provider's infrastructure, not the specific site

For hidden origin servers behind Cloudflare, combine GEO-IP findings with the [Tech Fingerprint](/modules/fingerprint) module and cross-reference with [Threat Intelligence](/modules/threat) links to Shodan for deeper host analysis.

---

## API used

Geographic and network data is provided by [ipapi.co](https://ipapi.co). No API key is required for normal use. The free tier supports up to 1,000 requests per day per IP address.

```
https://ipapi.co/{ip}/json/
```

See [API Rate Limits](/api-limits) for a full breakdown across all modules.