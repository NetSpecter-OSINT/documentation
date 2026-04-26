---
title: OSINT Workflow
description: How to structure an investigation with NetSpecter, chain module results together, and build a coherent picture from passive recon data.
---

# OSINT Workflow

NetSpecter is a passive recon tool. It reads publicly available data and surfaces signals. On its own, a single scan is a snapshot. Used methodically, a series of connected scans builds an evidence base.

This guide covers how to structure that process: where to start, how to chain results together, when you have enough to draw a conclusion, and where passive recon ends.

---

## The core principle: follow the data

The most common mistake in passive recon is deciding on a conclusion before the data supports it. A single red flag is an incentive to look further. The workflow below is designed to keep investigation ahead of interpretation.

The second mistake is scanning a domain once and stopping. NetSpecter's modules produce outputs that point to new inputs. A hostname leads to an IP. An IP leads to a hosting block. A certificate leads to related domains. Each scan should produce the next question.

---

## Starting points

You will typically begin an investigation with one of three inputs:

- **A domain name** (e.g. `nova-parcels.com`) - the most common starting point
- **An IP address** - begin with GEO-IP and Ports/CVEs, then reverse to associated domains
- **An email address** - begin with the domain portion; run DNS and Email Security to assess the sending infrastructure

In all three cases, run a **Full Scan** first. This gives you the broadest possible picture in one pass and produces the Overall Assessment, which tells you where to focus.

---

## The investigation workflow

### Step 1: Full Scan

Run a Full Scan on your starting domain. Read the Overall Assessment first for a quick orientation, then read each module block in full.

While reading, note:

- Any **red or yellow signals** that warrant deeper investigation
- Any **values that can become new inputs**: IPs, related domains in SANs, name servers, registrar, hosting ASN
- Any **absences that are themselves significant**: no MX records, no subdomains, no TXT records, no identifiable tech stack

Export the result immediately using the Export button. NetSpecter does not persist results between sessions.

---

### Step 2: Expand from the SSL certificate (SANs)

The Subject Alternative Names (SANs) field in the SSL module lists every domain covered by the same certificate. This is one of the most productive chaining paths in passive recon.

**Why it matters:** operators running multiple domains often use a single certificate across all of them. A certificate issued to `nova-parcels.com` that also covers `nova-tracking.net`, `nova-returns.co` and `nova-shipping.info` immediately reveals a wider operation than a single domain suggests.

For each domain found in the SANs:

1. Run a Full Scan on that domain
2. Check registration dates against your original domain - were they registered together?
3. Check whether they resolve to the same IP or same hosting block
4. Check their WHOIS registrar against your original domain

Domains registered within days of each other, on the same registrar, resolving to the same IP, sharing a certificate - that is a cluster, and a cluster built this way is a meaningful signal.

---

### Step 3: Pivot on the IP address

The A record from DNS gives you the server's IP. Take that IP and consider it independently from the domain.

**GEO-IP** tells you the hosting provider and country. Note the ASN (Autonomous System Number). An ASN is a block of IP addresses owned by one organisation. If your domain's IP shares an ASN with known abuse-tolerant infrastructure, that context matters.

**Threat Intelligence** checks whether the IP itself has been flagged. A domain can be brand new while the IP it points to already has a history.

**Ports / CVEs** tells you what the server is exposing. This is particularly relevant in security research contexts: open ports beyond 80 and 443, combined with known CVEs, suggest a poorly maintained or deliberately exposed server.

If the IP is shared hosting, the IP alone may not tell you much about the specific domain - many unrelated sites can share one IP. Cloudflare proxy (flagged in the Overall Assessment) means the IP you see is Cloudflare's, not the origin server's. In that case, the IP pivot is less useful.

---

### Step 4: Investigate the registrar and name servers

The WHOIS registrar and the NS records from DNS are two further pivot points that are often overlooked.

**Registrar clustering:** if multiple domains in your investigation were registered with the same registrar in the same window, that is circumstantial evidence of a common operator. This is especially meaningful when the registrar is one associated with elevated abuse rates.

**Name server clustering:** shared name servers across multiple domains is a stronger signal than shared registrar, because operators actively configure name servers rather than just selecting a registrar at checkout. Two unrelated legitimate businesses are unlikely to share obscure or private name servers.

In both cases, the pivot is the same: take the value (registrar name or NS hostname), search for other domains in your investigation that share it, and map the relationships.

---

### Step 5: Assess email infrastructure

Run the Email Security module if you have not already. For investigations involving potential impersonation, invoice fraud, or phishing, this is critical.

The questions to answer:

- **Can this domain send email?** (MX records present)
- **Can this domain be spoofed?** (SPF and DMARC absent = yes)
- **Does the email security configuration match the claimed purpose of the site?**

A domain claiming to be a financial institution with no DMARC enforcement policy is either negligently configured or not what it claims to be. Either finding is significant.

---

### Step 6: Subdomains as an infrastructure map

The Subdomains module reveals the domain's operational footprint via Certificate Transparency logs.

A mature, legitimate operation will typically have subdomains: `www`, `mail`, `app`, `api`, `portal`, `staging`, or similar. Their absence on a domain claiming to be an established business is a signal.

Each subdomain can also become a new input. A `cpanel.` or `webmail.` subdomain reveals the server stack. An `api.` subdomain may reveal integrations. A `staging.` or `dev.` subdomain may expose an unprotected environment.

Run individual module scans on significant subdomains, particularly SSL (to check for additional SANs) and Headers (to check for differing security configurations).

---

### Step 7: Build the picture

Before drawing conclusions, map what you have found:

| What you have | What it tells you |
|---------------|------------------|
| Domain age and registration pattern | Whether the domain was set up recently and deliberately |
| IP and ASN | Who is hosting it and whether that infrastructure has a history |
| Certificate SANs | Whether this domain is part of a wider cluster |
| Registrar / NS clustering | Whether multiple domains share a common operator |
| Email security posture | Whether the domain can or is designed to send or spoof email |
| Subdomain footprint | How much operational infrastructure exists |
| Threat intelligence hits | Whether the infrastructure has a documented history |

Conclusions should be proportional to the convergence of signals. One red flag is a reason to look further. Five red flags pointing in the same direction, across multiple pivot points, is an evidence base.

---

## Chaining in practice: a worked path

Starting point: a suspicious domain shared in a fraud report.

```
nova-parcels.com
  └── Full Scan
        ├── A record: 185.220.101.47
        │     ├── GEO-IP → Netherlands, AS205100 (abuse-tolerant ASN)
        │     └── Threat Intel → IP flagged Nov 2024
        ├── SSL SANs → nova-tracking.net, nova-returns.co
        │     ├── Full Scan: nova-tracking.net
        │     │     └── Same IP, same registrar, registered same week
        │     └── Full Scan: nova-returns.co
        │           └── Same IP, registered two days later
        ├── WHOIS → Namecheap, created Nov 2024
        │     └── All three domains: Namecheap, Nov 2024
        └── Email Security → No SPF, no DMARC on all three domains
```

Three domains. Same IP. Same registrar. Same registration window. Shared certificate. No email security on any of them. That is a cluster built by one operator, and the pattern is consistent with a fraud infrastructure.

---

## Where passive recon ends

NetSpecter does not interact with the target. It reads public records. There are things it cannot tell you:

- **Page content** - what the site actually shows visitors
- **Historical changes** - how the domain or infrastructure has changed over time (the Wayback Machine and similar tools cover this)
- **WHOIS history** - whether the domain has changed ownership
- **Email headers** - whether a specific email actually came from this domain
- **Identity** - who the registrant actually is behind privacy protection

These are the points where passive recon ends and active investigation, legal process, or specialist tooling begins. NetSpecter's role is to give you the infrastructure picture before you go further.

---

## Using NetSpecter alongside other tools

NetSpecter is a starting point, not a complete toolkit. Common complements:

- **Wayback Machine** (web.archive.org) - historical snapshots of the domain's content
- **MXToolbox** - deeper mail server diagnostics
- **VirusTotal** - additional threat intelligence coverage for domains and IPs
- **RDAP / regional registries** - for deeper WHOIS data where available
- **Certificate search** (crt.sh) - broader CT log searching than Certspotter alone

The workflow above applies regardless of which tools you use. Follow the data, chain the results, build the picture before drawing conclusions.

---
