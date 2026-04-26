---
title: Threat Intelligence
description: How NetSpecter's threat intelligence module works, what each platform offers, and how to use the pivot links effectively for deeper investigation.
---

# Threat Intelligence

The Threat Intelligence module generates a curated set of deep links to ten external threat intelligence platforms, each pre-populated with the target domain and resolved IP address. Rather than querying these platforms directly — which would require API keys, account registrations, and rate limit management — NetSpecter prepares the links so you can open any of them with a single click and immediately see the relevant data.

This module is the pivot point of a NetSpecter investigation. After the earlier modules have established the infrastructure picture, threat intelligence platforms let you ask the next question: has this domain or IP been seen doing something malicious?

---

## When to use this module

Use Threat Intelligence when you want to:

- Check whether a domain or IP has been flagged as malicious by antivirus engines or security researchers
- Look up the reputation of an IP address across multiple databases simultaneously
- Find historical URL scans, screenshots, and behaviour analysis for a domain
- Check whether an IP has been reported for abuse such as spam, scanning, or attacks
- Pivot from passive DNS data into active threat intelligence research
- Verify whether a domain has been associated with phishing, malware, or other threats

**Common scenarios:**

- A security analyst has identified a suspicious domain in network logs and wants to check its reputation across multiple platforms before escalating
- An IT administrator has blocked an IP and wants to understand why it was flagged and whether it is part of a known threat campaign
- A user has received a suspicious email and wants to check whether the sending domain has a known malicious history
- A researcher is documenting a threat actor's infrastructure and needs to cross-reference across multiple intelligence sources
- A developer wants to verify a third-party domain before integrating it into their application

---

## How it works

When you run the Threat Intelligence module, NetSpecter resolves the target domain to an IP address via DNS and then constructs pre-built links for each platform using both the domain name and the resolved IP.

The links open in a new browser tab. Each platform has its own data, methodology, and update frequency — running all ten gives you a broad cross-section of the intelligence community's view of the target.

No data is fetched automatically. You choose which platforms to query and when. This keeps the module fast, avoids API rate limits entirely, and lets you focus your investigation on the platforms most relevant to your use case.

---

## The ten platforms

### VirusTotal

[VirusTotal](https://www.virustotal.com/) aggregates results from over 90 antivirus engines and URL scanners. For a domain it shows detection ratios, historical URL scans, associated IP addresses, and DNS record history. For an IP it shows geolocation, associated domains, and passive DNS data.

VirusTotal is usually the first stop in any reputation check. A domain with zero detections across 90 engines is a strong signal. Any detections — even a handful — warrant further investigation.

**Best for:** Initial reputation check, malware and phishing detection ratios, passive DNS history.

---

### Shodan

[Shodan](https://www.shodan.io/) is a search engine for internet-connected devices. Searching for a domain or IP shows open ports, running services, software versions, SSL certificates, and any historical scan data Shodan has collected.

The Shodan link in the Threat Intelligence module complements the Services & Ports module — it opens the full Shodan interface where you can see more detail than the InternetDB API returns, including banner data and historical snapshots.

**Best for:** Detailed service and port data, historical infrastructure changes, banner grabbing.

---

### AbuseIPDB

[AbuseIPDB](https://www.abuseipdb.com/) is a collaborative database of IP addresses reported for malicious activity. Community members submit reports when an IP engages in brute-force attacks, spam, scanning, web application attacks, or other abuse. Each IP receives a confidence score based on the volume and recency of reports.

**Best for:** Checking whether an IP has been reported for active abuse, understanding what type of malicious activity has been associated with it.

---

### URLScan.io

[URLScan.io](https://urlscan.io/) scans URLs and captures a full record of the HTTP transaction — the redirect chain, DNS lookups, HTTP requests, response headers, rendered screenshot, and DOM content. Historical scans submitted by other users are also searchable.

URLScan is particularly useful for investigating suspicious links before clicking them. The screenshot preview lets you see what a page looks like without visiting it. The redirect chain reveals whether a short URL or seemingly innocuous link leads somewhere unexpected.

**Best for:** Safe investigation of suspicious URLs, redirect chain analysis, historical screenshots, DOM inspection without visiting the site.

---

### GreyNoise

[GreyNoise](https://viz.greynoise.io/) distinguishes between background internet noise — automated scanners, crawlers, and research tools — and genuinely targeted malicious traffic. It classifies IP addresses as benign, malicious, or unknown based on observed behaviour.

An IP that GreyNoise classifies as a known scanner or crawler is less concerning than one with no classification or one flagged as malicious. If an IP is hitting your infrastructure, GreyNoise can tell you whether it is part of routine internet background noise or something more targeted.

**Best for:** Distinguishing automated scanning from targeted attacks, understanding whether an IP is a known research tool or a genuine threat.

---

### AlienVault OTX

[AlienVault OTX](https://otx.alienvault.com/) (Open Threat Exchange) is a community-driven threat intelligence platform. Analysts contribute indicators of compromise (IoCs) grouped into pulses — collections of related threat data for a specific campaign or threat actor. Searching for a domain or IP shows whether it appears in any published pulses.

OTX is valuable for connecting an indicator to a broader threat campaign. If a domain appears in a pulse alongside other known malicious indicators, it places the finding in a threat actor context.

**Best for:** Connecting indicators to threat campaigns, finding community-contributed intelligence on specific actors or malware families.

---

### IBM X-Force Exchange

[IBM X-Force Exchange](https://exchange.xforce.ibmcloud.com/) provides threat intelligence including URL categorisation, IP reputation, malware analysis, and vulnerability data. It draws on IBM's commercial threat intelligence feed and community contributions.

X-Force assigns risk scores to URLs and IPs based on their category and observed behaviour. It also provides geographic and network context and links indicators to known threat reports.

**Best for:** URL risk scoring, cross-referencing with IBM's commercial threat intelligence, finding associated threat reports.

---

### MXToolbox Blacklist Check

[MXToolbox](https://mxtoolbox.com/blacklists.aspx) checks an IP or domain against over 100 DNS-based blacklists (DNSBLs) simultaneously. These blacklists are used by mail servers worldwide to filter spam and malicious email — an IP on a DNSBL will have its email rejected or flagged by many mail systems.

This is particularly relevant when investigating email-sending infrastructure. A domain used to send phishing or spam will frequently appear on multiple blacklists once the campaign is detected.

**Best for:** Email deliverability issues, spam and phishing sending infrastructure, bulk blacklist checking.

---

### Google Safe Browsing

[Google Safe Browsing](https://transparencyreport.google.com/safe-browsing/search) shows whether Google has flagged a URL for phishing, malware, or unwanted software. Safe Browsing powers the warnings shown in Chrome, Firefox, and Safari when a user navigates to a dangerous site.

A domain listed in Safe Browsing will actively warn users who visit it in major browsers. The absence of a listing does not confirm a site is safe — new or sophisticated threats may not yet be indexed.

**Best for:** Checking whether a site actively warns users in major browsers, phishing and malware detection from Google's crawler.

---

### URLHaus

[URLHaus](https://urlhaus.abuse.ch/) by abuse.ch is a database of URLs used to distribute malware. Security researchers submit malware distribution URLs when they find them. Searching a domain shows whether it has been used to host or distribute malicious payloads.

URLHaus is particularly strong for malware distribution detection — it is less focused on phishing and more focused on drive-by downloads, exploit kits, and malware command and control infrastructure.

**Best for:** Malware distribution detection, identifying domains used to host malicious payloads, connecting to the abuse.ch threat intelligence ecosystem.

---

## Reading the output

```
Target Domain    example.com
Resolved IP      93.184.216.34

[LINK] VirusTotal          https://www.virustotal.com/gui/domain/example.com
[LINK] Shodan              https://www.shodan.io/search?query=example.com
[LINK] AbuseIPDB           https://www.abuseipdb.com/check/93.184.216.34
[LINK] URLScan.io          https://urlscan.io/search/#page.domain%3Aexample.com
[LINK] GreyNoise           https://viz.greynoise.io/ip/93.184.216.34
[LINK] AlienVault OTX      https://otx.alienvault.com/indicator/domain/example.com
[LINK] IBM X-Force         https://exchange.xforce.ibmcloud.com/url/example.com
[LINK] MXToolbox Blacklist https://mxtoolbox.com/blacklists.aspx?hostname=example.com
[LINK] Google Safe Browsing https://transparencyreport.google.com/safe-browsing/search?url=example.com
[LINK] URLHaus             https://urlhaus.abuse.ch/browse.php?search=example.com
```

Notice that domain-focused platforms (VirusTotal, URLScan, OTX, X-Force) receive the domain name, while IP-focused platforms (AbuseIPDB, GreyNoise) receive the resolved IP address. This ensures each platform receives the most relevant identifier for its data model.

---

## How to approach a threat intelligence investigation

Rather than opening all ten links at once, a structured approach is more efficient:

**Step 1 — Start with VirusTotal**
It gives the broadest coverage fastest. Zero detections across 90 engines is reassuring. Any detections tell you what category of threat has been identified.

**Step 2 — Check URLScan for a safe preview**
If the domain is new or has low VirusTotal detections, URLScan lets you see what the site looks like and what it does without visiting it directly.

**Step 3 — Check AbuseIPDB for the resolved IP**
Particularly relevant if the domain is not behind a CDN — you get a direct read on whether the hosting IP has been reported for abuse.

**Step 4 — Check GreyNoise for the IP**
Understand whether the IP is part of background internet noise or something more targeted.

**Step 5 — Check OTX for campaign context**
If earlier steps found something suspicious, OTX tells you whether this indicator is part of a known campaign and gives you related IoCs to investigate.

**Step 6 — Check MXToolbox if email is involved**
If the domain is used for email, blacklist status directly affects deliverability and tells you whether the sending IP has been reported for spam.

---

## Platform account recommendations

All ten platforms offer free access without an account for basic lookups. However creating a free account on the key platforms unlocks additional features:

| Platform | Free account benefits |
|---|---|
| VirusTotal | Higher rate limits, API access, historical data |
| URLScan.io | Private scans, saved searches, full scan history |
| AbuseIPDB | Higher rate limits, API access, abuse reporting |
| Shodan | More search results, filters, saved queries |
| OTX | Create and subscribe to threat pulses |
| GreyNoise | More scan detail, API access |

---

## Examples across different use cases

### Investigating an alert

A SOC analyst receives an alert for outbound connections from an internal workstation to an unfamiliar IP. They run the target domain through NetSpecter and open the threat intelligence links:

- VirusTotal shows 3/91 detections categorised as malware
- AbuseIPDB shows the IP has been reported 47 times for C2 communication
- OTX shows the domain appears in a published pulse for a known RAT campaign
- GreyNoise shows the IP is not a known scanner — it is targeted traffic

Three independent platforms have flagged the same indicator. The analyst escalates to incident response with high confidence.

---

### Verifying a suspicious email link

A user forwards a suspicious email to their IT helpdesk. The email contains a link to a domain the user does not recognise. The IT administrator runs the domain through NetSpecter before anyone clicks it:

- VirusTotal shows 0/91 detections — the domain is too new to have been flagged yet
- URLScan shows a historical scan from two days ago — screenshot reveals a convincing Microsoft login page clone
- AbuseIPDB shows no reports on the IP
- Google Safe Browsing shows no current listing

VirusTotal missed it because it was too new. URLScan caught it because another researcher had already submitted a scan. The link is a phishing page. The administrator blocks the domain and notifies the user without anyone having to visit the site.

---

### Domain reputation check before integration

A developer is considering integrating a third-party API into their application. Before doing so they want to verify the API provider's domain has a clean reputation:

- VirusTotal: 0 detections, domain registered 4 years ago
- AbuseIPDB: 0 reports on the IP
- MXToolbox: Not listed on any blacklists
- GreyNoise: IP not classified as malicious
- URLScan: Multiple historical scans of the domain, all showing a legitimate API documentation site

All clear across the platforms checked. The developer proceeds with the integration with confidence.

---

### Blacklist check for email deliverability

An email marketing manager is investigating why their campaigns are going to spam for some recipients. They run their sending domain through the Threat Intelligence module and open MXToolbox:

- The sending IP appears on three DNSBL blacklists
- One listing is for spam, two are for bulk email

The sending IP has been listed due to volume. The manager contacts their email service provider to request a dedicated sending IP and submits delisting requests to the relevant blacklist operators.

---

## Limitations

- **NetSpecter does not fetch threat data directly** — all ten platforms are accessed via links that open in your browser. NetSpecter itself does not retrieve or display the threat intelligence data.
- **Platform coverage gaps** — no single platform sees everything. A clean result on one platform does not guarantee the domain is safe. Running multiple platforms in combination gives a more complete picture.
- **New domains and zero-day threats** — very recently registered domains and newly deployed phishing infrastructure often have no reputation data yet. A clean reputation can simply mean the domain has not yet been analysed.
- **CDN IP addresses** — for Cloudflare-proxied domains, the resolved IP belongs to Cloudflare's shared infrastructure. AbuseIPDB and GreyNoise results for Cloudflare IPs reflect the CDN infrastructure, not the specific domain being investigated. Domain-based queries (VirusTotal, URLScan, OTX) are more relevant for proxied targets.
- **Account rate limits** — without an account, some platforms limit the number of lookups per day. For high-volume investigations, free accounts on the key platforms are recommended.

---

## No API used

This module makes no external API calls. It resolves the target's IP via DNS and constructs pre-built links. All threat intelligence queries happen in your browser when you click a link.

See [API Rate Limits](/api-limits) for a full breakdown across all modules.