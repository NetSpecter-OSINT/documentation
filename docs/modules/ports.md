---
title: Services & Ports
description: How NetSpecter's services and ports module works, what open ports and running services reveal about a host, and practical examples across different use cases.
---

# Services & Ports

The Services & Ports module combines two passive data sources to map the network services running on a target host. It first queries Shodan's InternetDB for real scan data about the resolved IP address, then supplements those findings with DNS-based service inference. The result is a picture of what services are publicly accessible, what software is running, and whether any known vulnerabilities have been identified.

This module is entirely passive. NetSpecter never connects directly to the target's ports. All data comes from Shodan's existing scan database and DNS records — both of which are public.

---

## When to use this module

Use Services & Ports when you want to:

- Identify which network services are publicly accessible on a host
- Check whether a server has exposed services that should not be internet-facing
- See which software versions are running and whether they carry known CVEs
- Understand the hosting infrastructure behind a domain
- Supplement DNS and fingerprint findings with network-layer data
- Quickly pivot to Shodan, Censys, or GreyNoise for deeper host analysis

**Common scenarios:**

- A security team is performing an asset inventory and wants to know what services are exposed on their public-facing infrastructure
- A penetration tester is gathering passive intelligence during the reconnaissance phase of an authorised engagement
- An IT administrator suspects a server has an exposed service it should not have and wants to verify before investigating further
- A researcher is assessing the attack surface of an organisation's public infrastructure
- Someone is investigating a suspicious IP address and wants to understand what it is running

---

## How it works

The module runs two sources in sequence and combines the results.

**Source 1 — Shodan InternetDB**

[Shodan](https://www.shodan.io/) continuously scans the entire internet, probing common ports and recording the services that respond. InternetDB is a free, public-facing subset of Shodan's data that returns port, software, and vulnerability information for any IP address with no API key required.

When you enter a domain, NetSpecter first resolves it to an IP address via DNS. It then queries InternetDB with that IP. The response includes open ports, software fingerprints in CPE format, known CVEs, associated hostnames, and infrastructure tags.

Because Shodan's data is passively collected over time, results reflect what was observed during Shodan's most recent scan of that IP — typically within the last few weeks for well-connected infrastructure. Brand new or rarely connected servers may have no Shodan data yet.

**Source 2 — DNS signal inference**

Some services are strongly implied by DNS records even without active scanning. NetSpecter uses the following logic to infer additional services not found in Shodan:

| DNS signal | Inferred services |
|---|---|
| MX records present | SMTP (25), SMTP/TLS (587), IMAPS (993) |
| NS records present | DNS (53) |
| `api.` subdomain in CT logs | HTTPS-alt (8443) |
| `dev.` or `staging.` subdomain in CT logs | HTTP-alt (8080) |

These inferred services are displayed separately from the Shodan results and labelled with their basis so you can distinguish confirmed scan data from inference.

---

## What the results tell you

### Open ports

Each confirmed open port is displayed with its service name, risk level, and a plain-language note:

| Risk level | Meaning |
|---|---|
| LOW | Standard, expected service with no particular concern |
| MED | Worth noting — may indicate attack surface or configuration worth reviewing |
| HIGH | Significant concern — service should not normally be internet-facing |

**High-risk services to look for:**

| Port | Service | Why it is high risk |
|---|---|---|
| 21 | FTP | Unencrypted file transfer — credentials sent in plain text |
| 23 | Telnet | Unencrypted remote access — entirely superseded by SSH |
| 445 | SMB | Windows file sharing — commonly exploited (EternalBlue, WannaCry) |
| 1433 | MSSQL | Database exposed to the internet — should never be public |
| 1521 | Oracle DB | Database exposed to the internet |
| 2375 | Docker | Unprotected Docker socket — full container escape risk |
| 3306 | MySQL | Database exposed to the internet |
| 3389 | RDP | Remote desktop — frequent target for brute-force and ransomware |
| 5432 | PostgreSQL | Database exposed to the internet |
| 5900 | VNC | Remote desktop with historically weak authentication |
| 6379 | Redis | Often deployed without authentication by default |
| 9200 | Elasticsearch | Often deployed without authentication by default |
| 27017 | MongoDB | Often deployed without authentication by default |

---

### Software fingerprints (CPE)

CPE stands for Common Platform Enumeration — a standardised format for identifying software and operating systems. When Shodan identifies software on a port, it records it as a CPE string. NetSpecter displays these in a human-readable format.

**Example CPE entries:**

```
[CPE] apache http_server 2.4.51
[CPE] debian debian_linux 11
[CPE] openbsd openssh 9.2p1
```

These entries tell you the web server software, operating system, and SSH version running on the host. Each of these can be cross-referenced against vulnerability databases to determine whether known CVEs apply.

---

### CVEs

CVE stands for Common Vulnerabilities and Exposures — the standardised identifiers for publicly known security vulnerabilities. When Shodan's scan data identifies software with known vulnerabilities, it records the relevant CVE IDs against the IP.

NetSpecter displays any CVEs found and links each one directly to the National Vulnerability Database entry at `nvd.nist.gov` where full technical details, CVSS scores, and patch information are available.

::: warning
The presence of a CVE does not automatically mean the host is actively exploitable. Patches, configuration mitigations, or network-level controls may already be in place. CVE findings should be treated as starting points for investigation rather than confirmed vulnerabilities.
:::

---

### Hostnames

Shodan records which hostnames have been seen resolving to a given IP address. This is useful for identifying related infrastructure — other domains hosted on the same server, or the true hostname of a server sitting behind a CDN.

Each hostname is displayed with quick links to URLScan.io and Shodan for immediate pivoting.

---

### Infrastructure tags

Shodan applies descriptive tags to IP addresses based on their observed behaviour. Common tags include:

| Tag | Meaning |
|---|---|
| `cdn` | Content delivery network infrastructure |
| `cloud` | Cloud provider infrastructure |
| `self-signed` | Server uses a self-signed certificate |
| `vpn` | VPN infrastructure |
| `tor` | Tor exit node |
| `scanner` | Known scanning or research infrastructure |

---

### Cloudflare ports

Cloudflare exposes several non-standard ports on its CDN infrastructure in addition to 80 and 443. Seeing these ports does not indicate anything unusual about the site itself — they are standard Cloudflare offerings:

| Port | Service |
|---|---|
| 2052, 8080, 8880 | Cloudflare alternative HTTP ports |
| 2053, 2083, 8443 | Cloudflare alternative HTTPS ports |
| 2082 | cPanel HTTP |
| 2086 | WHM HTTP |
| 2095 | cPanel Webmail (unencrypted) |
| 2087 | WHM SSL |
| 2096 | cPanel Webmail SSL |

The presence of cPanel and WHM ports confirms the IP is on Cloudflare's shared hosting range — a Cloudflare IP used by domains that host through cPanel-based shared hosting providers like Hostinger or Bluehost.

---

## Reading the output

**A host with Shodan data:**

```
Resolved IP           176.31.251.146
Hostnames             1 found
  Host                ns361200.ip-176-31-251.eu     [urlscan] [shodan]
Tags                  self-signed

Open ports (Shodan)   3

  PORT       SERVICE              RISK      NOTES
  22         SSH                  MED       Remote access
  80         HTTP                 LOW       Unencrypted web
  443        HTTPS                LOW       Encrypted web

Software (CPE)        4 detected
  [CPE] debian debian_linux
  [CPE] apache http_server
  [CPE] linux linux_kernel
  [CPE] openbsd openssh 9.2p1

CVEs                  None detected in Shodan database

DNS signal inference (supplementary)
  25         SMTP                 MED       MX record
  587        SMTP/TLS             LOW       MX record
  993        IMAPS                LOW       MX record
  53         DNS                  LOW       NS record
```

A Debian Linux server running Apache and OpenSSH, directly hosted at OVH. The `self-signed` tag means the server's certificate is not from a trusted CA. Three Shodan-confirmed ports plus four DNS-inferred mail and DNS services. No CVEs in Shodan's database.

**A Cloudflare-proxied host:**

```
Resolved IP           104.21.70.107
Hostnames             1 found
  Host                jpatelier.hr                  [urlscan] [shodan]
Tags                  cdn

Open ports (Shodan)   13

  PORT       SERVICE              RISK      NOTES
  80         HTTP                 LOW       Unencrypted web
  443        HTTPS                LOW       Encrypted web
  2052       Cloudflare HTTP      LOW       CF alternative HTTP port
  2053       Cloudflare HTTPS     LOW       CF alternative HTTPS port
  2082       cPanel HTTP          MED       Hosting panel unencrypted
  2083       cPanel SSL           MED       Hosting control panel
  ...

Software (CPE)        1 detected
  [CPE] cloudflare cloudflare

CVEs                  None detected in Shodan database
```

The `cdn` tag and Cloudflare CPE confirm this is a Cloudflare IP. The cPanel ports confirm the domain uses Cloudflare in front of cPanel-based shared hosting. The hostname `jpatelier.hr` is another domain on the same Cloudflare IP range — worth investigating if building a picture of related infrastructure.

---

## Investigative signals to look for

| Signal | What it may indicate |
|---|---|
| Database ports open (3306, 5432, 27017 etc.) | Database exposed to the internet — serious misconfiguration |
| RDP open (3389) | Remote desktop exposed — common ransomware entry point |
| Telnet open (23) | Severely outdated and insecure remote access |
| Docker port open (2375) | Container infrastructure potentially exposed |
| CVEs present | Software with known unpatched vulnerabilities |
| `self-signed` tag | Certificate not from trusted CA — may cause browser warnings |
| `tor` tag | IP is a Tor exit node — anonymisation infrastructure |
| `scanner` tag | IP belongs to a known scanning service |
| cPanel ports on a CDN IP | Shared hosting behind Cloudflare proxy |
| No Shodan data at all | IP not yet scanned, private range, or very new infrastructure |
| Hostname pivot reveals unrelated domains | Shared hosting or related infrastructure worth investigating |

---

## Examples across different use cases

### Exposed database investigation

A security team receives a tip that one of their servers may have an exposed database. They run the ports module on the relevant domain:

```
Open ports (Shodan)   5

  PORT       SERVICE              RISK      NOTES
  22         SSH                  MED       Remote access
  80         HTTP                 LOW       Unencrypted web
  443        HTTPS                LOW       Encrypted web
  3306       MySQL                HIGH      Exposed database
  6379       Redis                HIGH      Often auth-free

CVEs                  None detected
```

Two high-risk services confirmed — MySQL and Redis both exposed. Redis in particular is notorious for being deployed without authentication. The team immediately moves to verify whether authentication is configured and restrict both services to internal network access only.

---

### CVE triage during an incident

A security analyst is investigating an alert involving a suspicious IP and runs it through the ports module:

```
Open ports (Shodan)   4

  PORT       SERVICE              RISK
  22         SSH                  MED
  80         HTTP                 LOW
  443        HTTPS                LOW
  8888       HTTP-alt             MED

Software (CPE)        2 detected
  [CPE] python cpython 3.9.7
  [CPE] jupyter notebook 6.4.3

CVEs detected         3
  [CVE] CVE-2021-32798
  [CVE] CVE-2021-32797
  [CVE] CVE-2020-26215
```

A Jupyter notebook server exposed on port 8888 running Python 3.9 with three known CVEs. Jupyter notebooks are development tools that should never be internet-facing — they provide code execution capabilities to anyone who can connect. The analyst escalates this as a critical finding.

---

### Pre-launch infrastructure review

A startup is about to launch their product and wants to verify their server is not exposing anything unexpected:

```
Open ports (Shodan)   3

  PORT       SERVICE              RISK
  22         SSH                  MED
  80         HTTP                 LOW
  443        HTTPS                LOW

Software (CPE)        3 detected
  [CPE] ubuntu linux 22.04
  [CPE] nginx nginx 1.22.1
  [CPE] openssl openssl 3.0.2

CVEs                  None detected
```

Three ports — SSH, HTTP, and HTTPS. No databases, no admin panels, no unexpected services exposed. No CVEs in Shodan's database. The infrastructure looks clean. The startup notes the SSH port and confirms it is restricted to their team's IP addresses via firewall rules.

---

### Shared hosting identification

An investigator is looking at a domain used in a suspicious communication and wants to understand the hosting:

```
Resolved IP           172.67.222.221
Tags                  cdn
Hostnames             mappe.uk.com     [urlscan] [shodan]

Software (CPE)        cloudflare cloudflare
```

The IP belongs to Cloudflare's CDN range, tagged as `cdn`. The hostname `mappe.uk.com` is an unrelated domain sharing the same Cloudflare IP range. The investigator pivots to Shodan and URLScan on that hostname to see whether it reveals anything about the shared infrastructure or connected operators.

---

## Limitations

- **Shodan scan recency** — Shodan rescans IP addresses periodically but not in real time. Data may be days or weeks old. A service that was just opened or just closed may not be reflected yet.
- **CDN and proxy masking** — domains behind Cloudflare, Fastly, or similar CDNs will return data for the CDN's IP, not the origin server. The origin server's actual open ports are not visible through passive means.
- **No direct scanning** — NetSpecter never touches the target's ports directly. For a comprehensive and real-time port scan, active tools such as `nmap` should be used against infrastructure you have permission to test.
- **Shodan free tier** — InternetDB is a free, public endpoint with no authentication. It covers common ports only. Shodan's full paid API provides significantly more detail.
- **CVE completeness** — Shodan's CVE detection is based on software version matching. It may miss vulnerabilities that require runtime configuration analysis, and may occasionally flag false positives for versions that have been backport-patched by the OS vendor.

---

## API used

**Port and vulnerability data:** [Shodan InternetDB](https://internetdb.shodan.io/). Free, no API key required. Returns ports, CPEs, CVEs, hostnames, and tags for any public IP address.

```
https://internetdb.shodan.io/{ip}
```

**DNS inference:** [Google Public DNS over HTTPS](https://developers.google.com/speed/public-dns/docs/doh). MX and NS records are queried to infer likely mail and DNS services.

See [API Rate Limits](/api-limits) for a full breakdown across all modules.