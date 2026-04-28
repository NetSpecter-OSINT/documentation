import { defineConfig } from 'vitepress'

export default defineConfig({
  // ---- Site metadata ----
  title: 'NetSpecter',
  description: 'Free browser based OSINT and passive recon tool. DNS, WHOIS, SSL, subdomains, ports, tech fingerprinting, no need to install anything, no API keys.',
  lang: 'en-GB',
  sitemap: {
    hostname: 'https://netspecter-osint.github.io'
  },
  appearance: 'light',

  // ---- Base URL ----
  // Change to '/' if using a custom domain like docs.netspecter.io
  base: '/documentation/',

  // ---- Head tags - SEO ----
  head: [
    ['meta', { name: 'google-site-verification', content: 'tv-KIgtCqJjsIIUJWPUxnVSvnQ9tONfiFutrqnm8kjs' }],
    ['meta', { name: 'theme-color', content: '#00ff41' }],
    ['meta', { name: 'author', content: 'NetSpecter' }],
    ['meta', { name: 'keywords', content: 'osint, recon, dns lookup, whois, subdomain finder, ssl checker, passive recon, network intelligence, free security tool' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'NetSpecter Docs' }],
    ['meta', { property: 'og:image', content: 'https://netspecter-osint.github.io/documentation/logo.png' }],
    ['meta', { name: 'twitter:image', content: 'https://netspecter-osint.github.io/documentation/logo.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/documentation/logo.png' }],
    ['link', { rel: 'icon', type: 'image/x-icon', href: '/documentation/favicon.ico' }],
    
        
  ],

  // ---- Theme config ----
  themeConfig: {

    logo: '/logo.png',
    siteTitle: 'NetSpecter',

    // ---- Top navigation ----
    nav: [
      { text: 'Home',       link: '/' },
      { text: 'Modules',    link: '/modules/dns' },
      { text: 'Guides',     link: '/guides/reading-results' },
      { text: 'API Limits', link: '/api-limits' },
      {
        text: 'Links',
        items: [
          { text: 'Launch NetSpecter',    link: 'https://netspecter-osint.github.io/NetSpecter/' },
          { text: 'GitHub',         link: 'https://github.com/netspecter-osint/Netspecter' },
          { text: 'Support on Ko-fi', link: 'https://ko-fi.com/wabbuwabbu' },
        ]
      }
    ],

    // ---- Sidebar ----
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'What is NetSpecter?', link: '/' },
          { text: 'API Rate Limits',     link: '/api-limits' },
        ]
      },
      {
        text: 'Modules',
        collapsed: false,
        items: [
          { text: 'DNS Enumeration',      link: '/modules/dns' },
          { text: 'WHOIS / RDAP',         link: '/modules/whois' },
          { text: 'GEO-IP Location',      link: '/modules/geo' },
          { text: 'SSL / Certificates',   link: '/modules/ssl' },
          { text: 'Subdomain Discovery',  link: '/modules/subdomains' },
          { text: 'HTTP Headers',         link: '/modules/headers' },
          { text: 'Email Security',       link: '/modules/email' },
          { text: 'Services & Ports',     link: '/modules/ports' },
          { text: 'Tech Fingerprint',     link: '/modules/fingerprint' },
          { text: 'Threat Intelligence',  link: '/modules/threat' },
        ]
      },
      {
        text: 'Guides',
        collapsed: false,
        items: [
          { text: 'Reading Your Results',  link: '/guides/reading-results' },
          { text: 'OSINT Workflow',        link: '/guides/osint-workflow' },
          { text: 'Case Study: Fake Crypto Recruitment', link: '/guides/scam-investigation' },
        ]
      },
      /*{
        text: 'More',
        items: [
          { text: 'Deployment',   link: '/deployment' },
          { text: 'Contributing', link: '/contributing' },
        ]
      }*/
    ],

    // ---- Social links ----
    socialLinks: [
      { icon: 'github', link: 'https://github.com/netspecter-osint/NetSpecter' },
    ],

    // ---- Footer ----
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'NetSpecter · Use responsibly · Authorised targets only',
    },

    // ---- Search ----
    search: {
      provider: 'local',
    },

    // ---- Edit link ----
    editLink: {
      pattern: 'https://github.com/netspecter-osint/docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    // ---- Last updated ----
    lastUpdated: {
      text: 'Last updated',
    },
  },

  // ---- Markdown options ----
  markdown: {
    lineNumbers: true,
  },
})