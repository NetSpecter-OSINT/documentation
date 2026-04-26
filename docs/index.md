---
layout: home
title: NetSpecter - Free Browser OSINT & Recon Tool
description: Passive intelligence platform. DNS, WHOIS, SSL, subdomains, ports, tech fingerprinting - all in the browser, no install, no account required.

hero:
  name: "NetSpecter"
  text: "Open Source OSINT & Recon"
  tagline: "Passive intelligence gathering in your browser. No install. No account. No configuration. Completely free."
  image:
    light: /logo.png
    dark: /logo-dark.png
    alt: NetSpecter
    
  actions:
    - theme: brand
      text: Launch Tool
      link: https://netspecter-osint.github.io/NetSpecter/
    - theme: alt
      text: Read the Docs
      link: /modules/dns
    - theme: alt
      text: View on GitHub
      link: https://github.com/NetSpecter-OSINT

features:
  - icon: 🌐
    title: DNS Enumeration
    details: Query all DNS record types - A, AAAA, MX, NS, TXT, CNAME, SOA. Understand who controls a domain's infrastructure in seconds.
    link: /modules/dns
    linkText: Learn more

  - icon: 📋
    title: WHOIS / RDAP
    details: Retrieve domain registration data using the modern RDAP protocol. Identify registrars, creation dates, nameservers and domain age risk scoring.
    link: /modules/whois
    linkText: Learn more

  - icon: 📍
    title: GEO-IP Location
    details: Resolve any domain or IP to its physical location, ISP, ASN, timezone and currency. Useful for identifying where infrastructure is hosted.
    link: /modules/geo
    linkText: Learn more

  - icon: 🔒
    title: SSL / Certificates
    details: Analyse certificate transparency logs, check expiry dates, and run a live TLS grade via SSL Labs. Identify weak or misconfigured HTTPS.
    link: /modules/ssl
    linkText: Learn more

  - icon: 🔍
    title: Subdomain Discovery
    details: Passively discover subdomains using certificate transparency logs and DNS probing. Map an organisation's attack surface without touching their servers.
    link: /modules/subdomains
    linkText: Learn more

  - icon: 🛡️
    title: HTTP Headers & Security Audit
    details: Fetch response headers and score security posture against nine critical security headers. Instantly spot misconfigured or exposed web servers.
    link: /modules/headers
    linkText: Learn more

  - icon: 📧
    title: Email Security
    details: Check SPF, DKIM and DMARC configuration. Identify domains vulnerable to spoofing and impersonation - a common vector in phishing and fraud.
    link: /modules/email
    linkText: Learn more

  - icon: 🔌
    title: Services & Ports
    details: Combine Shodan InternetDB passive scan data with DNS signal inference to identify open services, exposed software, and known CVEs.
    link: /modules/ports
    linkText: Learn more

  - icon: 🧬
    title: Tech Fingerprinting
    details: Infer the technology stack from DNS records alone. Detect CDN providers, email platforms, hosting environments and SaaS tools without visiting the site.
    link: /modules/fingerprint
    linkText: Learn more

  - icon: ⚠️
    title: Threat Intelligence
    details: Generate pre-built deep links to VirusTotal, Shodan, AbuseIPDB, URLScan, GreyNoise and more. One click to pivot into any threat intel platform.
    link: /modules/threat
    linkText: Learn more
---

## What is NetSpecter?

NetSpecter is a free, open source OSINT and passive reconnaissance tool that runs entirely in your browser. Enter any domain name or IP address and run eleven intelligence modules instantly - from DNS record analysis to live TLS grading to Shodan port data.

There is nothing to install. No account to create. No API keys to manage. Everything runs client-side using free public APIs.

It was built for security researchers, IT professionals, journalists, fraud investigators, and anyone who needs to quickly understand the infrastructure behind a domain.

---

## Why passive recon?

Passive reconnaissance means gathering intelligence without directly interacting with the target's systems. NetSpecter only queries public data sources - DNS servers, certificate transparency logs, WHOIS databases, and third-party intelligence platforms.

This approach has two advantages. First, it leaves no trace on the target's infrastructure. Second, it is legal to perform against any domain, because you are only querying public records that anyone can access.

Active techniques like port scanning or web crawling are outside NetSpecter's scope by design.

---

## Quick start

1. Open [NetSpecter](https://netspecter-osint.github.io/NetSpecter/)
2. Enter a domain name (e.g. `example.com`) or IP address in the input field
3. Select a module from the tab bar
4. Press **[ SCAN ]** or hit `Enter`

For a complete picture of a domain, select **FULL SCAN** to run all eleven modules in sequence with an automated risk summary at the end.

---

## Who is it for?

| Use case | How NetSpecter helps |
|---|---|
| Security researchers | Rapid passive triage of unknown domains |
| IT and sysadmin | Audit your own infrastructure's public exposure |
| Fraud investigators | Identify suspicious domain patterns and fake infrastructure |
| Journalists | Verify the legitimacy of companies and online operations |
| Students | Learn how DNS, TLS, and email security work in practice |
| Bug bounty hunters | Map attack surface before engaging a target |

---

## Responsible use

NetSpecter performs passive reconnaissance only. It queries public data sources on your behalf - DNS servers, certificate transparency logs, WHOIS databases, and third-party intelligence platforms. No credentials or API keys are required from you as a user.

No active exploitation, injection, or unauthorised access is performed at any point.

Only scan domains and IP addresses you own, or that you have explicit written permission to test. The authors accept no responsibility for misuse.

---

## Support the project

NetSpecter is free and always will be. If it saved you time or helped with an investigation, consider supporting development.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/wabbuwabbu)