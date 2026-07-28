import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://www.tryvoke.in';
const SITE_NAME = 'Voke';
const DEFAULT_OG_IMAGE = `${SITE_URL}/favicon.png`;
const TWITTER_HANDLE = '@tryvoke';

const KNOWN_COMPANY_SLUGS = [
  "google",
  "meta",
  "amazon",
  "apple",
  "microsoft",
  "netflix",
  "uber",
  "airbnb",
  "linkedin",
  "twitter",
  "tesla",
  "spotify",
  "adobe",
  "salesforce",
  "oracle",
  "ibm",
  "intel",
  "nvidia",
  "amd",
  "cisco",
  "paypal",
  "stripe",
  "slack",
  "bytedance",
  "snapchat",
  "reddit",
  "dropbox",
  "gitlab",
  "github",
  "atlassian"
];

const PRIVATE_ROUTE_PREFIXES = [
  "/auth",
  "/waitlist",
  "/dashboard",
  "/admin",
  "/profile",
  "/interview",
  "/video-interview",
  "/timed-interview",
  "/voice-interview",
  "/multi-question-results",
  "/voice-assistant",
  "/video-practice",
  "/progress-analytics",
  "/adaptive-interview",
  "/peer-interviews",
  "/job-recommendations",
  "/career-plan",
  "/daily-challenge/solve",
  "/playground",
  "/resume-builder"
];

const PUBLIC_ROUTES = [
  {
    path: '/',
    title: 'Voke – AI Powered Interview Practice for Tech Students & Engineers',
    description: 'Practice tech interviews with AI-powered feedback, resume-based questions, real-time mock sessions, and coding practice. Built for B.Tech CSE students preparing for placements and software engineering roles.',
    keywords: ['Voke', 'AI interview practice', 'technical mock interview', 'behavioral interview AI', 'resume analysis interview', 'B.Tech placement preparation', 'coding interview prep'],
    changefreq: 'daily',
    priority: 1.0,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": `${SITE_URL}/#webapp`,
          "name": "Voke",
          "url": `${SITE_URL}/`,
          "description": "AI-powered interview practice platform for B.Tech CSE students and software developers.",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
          "author": { "@type": "Organization", "name": "Voke", "url": SITE_URL }
        },
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          "name": "Voke",
          "url": SITE_URL,
          "logo": `${SITE_URL}/favicon.png`,
          "sameAs": [
            "https://twitter.com/tryvoke",
            "https://www.linkedin.com/company/vokeaii/",
            "https://www.instagram.com/tryvoke.in"
          ]
        }
      ]
    }
  },
  {
    path: '/pricing',
    title: 'Pricing Plans & Subscriptions – Voke AI',
    description: 'Explore affordable Voke AI pricing plans for Tech Students and Engineers. Get unlimited AI mock interviews, resume feedback, and company-specific question prep.',
    keywords: ['Voke pricing', 'AI interview cost', 'mock interview subscription', 'tech interview prep plans'],
    changefreq: 'weekly',
    priority: 0.9,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Voke AI Interview Preparation",
      "description": "AI-powered mock interview subscription with resume reviews and company problem sets.",
      "brand": { "@type": "Brand", "name": "Voke" },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "url": `${SITE_URL}/pricing`,
        "lowPrice": "0",
        "highPrice": "2999",
        "offerCount": "3"
      }
    }
  },
  {
    path: '/companies',
    title: 'Top Tech Companies Interview Questions & AI Practice – Voke',
    description: 'Practice real interview questions asked by Google, Meta, Amazon, Microsoft, Apple, Uber, and top tech companies. Filter by question frequency, difficulty, and practice live.',
    keywords: ['company interview questions', 'Google interview questions', 'Amazon tech questions', 'coding interview questions by company'],
    changefreq: 'daily',
    priority: 0.9,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Top Tech Companies Interview Questions",
      "description": "Curated technical interview questions from top tech companies.",
      "url": `${SITE_URL}/companies`,
      "itemListElement": KNOWN_COMPANY_SLUGS.slice(0, 10).map((slug, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": slug.charAt(0).toUpperCase() + slug.slice(1),
        "url": `${SITE_URL}/companies/${slug}`
      }))
    }
  },
  {
    path: '/dsa-sheet',
    title: 'Curated Data Structures & Algorithms (DSA) Sheet – Voke',
    description: "Master Data Structures and Algorithms with Voke's handpicked DSA problem sheet. From Arrays and Trees to Dynamic Programming, practice with instant AI guidance.",
    keywords: ['DSA sheet', 'Data Structures Algorithms practice', 'coding interview roadmap', 'SDE prep sheet'],
    changefreq: 'weekly',
    priority: 0.8,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Voke DSA Master Sheet",
      "description": "Complete Data Structures & Algorithms practice curriculum with AI evaluation.",
      "provider": { "@type": "Organization", "name": "Voke", "url": SITE_URL },
      "url": `${SITE_URL}/dsa-sheet`
    }
  },
  {
    path: '/question-practice',
    title: 'Technical & Behavioral Question Practice Bank – Voke',
    description: 'Browse and practice thousands of technical, system design, and behavioral interview questions with instant AI solution feedback.',
    keywords: ['interview question bank', 'behavioral interview practice', 'system design questions', 'coding practice'],
    changefreq: 'weekly',
    priority: 0.8,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "EducationalOccupationalProgram",
      "name": "Voke Interview Question Practice Bank",
      "description": "Interactive technical and behavioral interview practice question set.",
      "provider": { "@type": "Organization", "name": "Voke", "url": SITE_URL },
      "url": `${SITE_URL}/question-practice`
    }
  },
  {
    path: '/daily-challenge',
    title: 'Daily Coding & Technical Interview Challenge – Voke',
    description: "Solve today's coding and interview challenge on Voke. Build problem-solving consistency, earn streak rewards, and sharpen technical skills daily.",
    keywords: ['daily coding challenge', 'interview question of the day', 'daily DSA challenge'],
    changefreq: 'daily',
    priority: 0.8,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "Voke Daily Interview Challenge",
      "description": "Daily interview preparation problem for tech developers.",
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": { "@type": "VirtualLocation", "url": `${SITE_URL}/daily-challenge` },
      "organizer": { "@type": "Organization", "name": "Voke", "url": SITE_URL }
    }
  },
  {
    path: '/elite-prep',
    title: 'Elite Interview Preparation Program – Voke',
    description: 'Accelerated 1-on-1 style AI coaching for tier-1 tech company placement. High-intensity mock interviews, system design drills, and resume optimization.',
    keywords: ['elite prep program', 'MAANG interview coaching', 'tier 1 placement prep', 'system design mock interview'],
    changefreq: 'weekly',
    priority: 0.8,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Voke Elite Prep Coaching",
      "description": "Personalized tier-1 interview preparation program.",
      "provider": { "@type": "Organization", "name": "Voke", "url": SITE_URL },
      "url": `${SITE_URL}/elite-prep`
    }
  },
  {
    path: '/community',
    title: 'Tech Student & Job Seeker Community Hub – Voke',
    description: 'Connect with B.Tech students and tech job seekers. Share interview experiences, study strategies, peer practice feedback, and career guidance.',
    keywords: ['tech community', 'interview experience sharing', 'B.Tech placement forum', 'peer mock practice'],
    changefreq: 'daily',
    priority: 0.7,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "DiscussionForumPosting",
      "headline": "Voke Tech Candidate & Student Community",
      "url": `${SITE_URL}/community`,
      "author": { "@type": "Organization", "name": "Voke Community" }
    }
  },
  {
    path: '/leaderboard',
    title: 'Global Student & Developer Interview Leaderboard – Voke',
    description: 'See top performing students and developers practicing on Voke. Track practice hours, completed challenges, and interview preparation rankings.',
    keywords: ['interview leaderboard', 'top coding students', 'Voke practice rankings'],
    changefreq: 'daily',
    priority: 0.7
  },
  {
    path: '/help',
    title: 'Help Center & FAQs – Voke AI Interview Platform',
    description: 'Find answers to frequently asked questions about Voke AI, account management, subscription plans, resume parsing, and mock interview tools.',
    keywords: ['Voke help', 'Voke FAQ', 'AI interview platform guide', 'Voke support'],
    changefreq: 'monthly',
    priority: 0.6,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Voke AI mock interview work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Voke uses advanced AI models to conduct voice and video interviews, evaluating technical correctness, communication clarity, and confidence while giving personalized feedback based on your resume."
          }
        },
        {
          "@type": "Question",
          "name": "Is Voke suitable for B.Tech CSE students?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Voke is specifically designed for college students and developers preparing for internships, campus placements, and software engineering roles."
          }
        },
        {
          "@type": "Question",
          "name": "Does Voke analyze resume and GitHub projects?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, Voke extracts key experience, tech stack, and GitHub repository details to generate custom interview questions tailored directly to your profile."
          }
        }
      ]
    }
  },
  {
    path: '/privacy',
    title: 'Privacy Policy – Voke',
    description: "Read Voke's privacy policy. Learn how we collect, protect, and use your personal information, resume documents, and mock interview data.",
    keywords: ['Voke privacy policy', 'data security', 'terms and privacy'],
    changefreq: 'monthly',
    priority: 0.5,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Privacy Policy",
      "url": `${SITE_URL}/privacy`,
      "publisher": { "@type": "Organization", "name": "Voke", "url": SITE_URL }
    }
  }
];

// Add dynamic company routes
KNOWN_COMPANY_SLUGS.forEach((slug) => {
  const companyName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
  PUBLIC_ROUTES.push({
    path: `/companies/${slug}`,
    title: `${companyName} Interview Questions & AI Practice | Voke`,
    description: `Practice real ${companyName} technical and behavioral interview questions. Filter questions by frequency and difficulty, and prepare with live AI mock interviews.`,
    keywords: [`${companyName} interview questions`, `practice ${companyName} coding problems`, `${companyName} tech interview`],
    changefreq: 'weekly',
    priority: 0.8,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
        { "@type": "ListItem", "position": 2, "name": "Companies", "item": `${SITE_URL}/companies` },
        { "@type": "ListItem", "position": 3, "name": companyName, "item": `${SITE_URL}/companies/${slug}` }
      ]
    }
  });
});

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const urlEntries = PUBLIC_ROUTES.map((route) => {
    const loc = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq || 'weekly'}</changefreq>
    <priority>${route.priority !== undefined ? route.priority.toFixed(1) : '0.8'}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

function generateRobotsTxt() {
  const disallows = PRIVATE_ROUTE_PREFIXES.map((prefix) => `Disallow: ${prefix}`).join('\n');
  return `User-agent: *
Allow: /
${disallows}

Sitemap: ${SITE_URL}/sitemap.xml`;
}

function buildPreRenderedHtml(templateHtml, page) {
  const canonicalUrl = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  const keywordsStr = page.keywords && page.keywords.length > 0 ? page.keywords.join(', ') : '';

  let html = templateHtml;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/s, `<title>${page.title}</title>`);

  // Replace or inject meta description
  if (html.includes('name="description"')) {
    html = html.replace(/<meta name="description" content=".*?"\s*\/?>/s, `<meta name="description" content="${page.description}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${page.description}" />\n</head>`);
  }

  // Inject or replace canonical
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link rel="canonical" href=".*?"\s*\/?>/s, `<link rel="canonical" href="${canonicalUrl}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
  }

  // Replace Open Graph Tags
  html = html.replace(/<meta property="og:title" content=".*?"\s*\/?>/s, `<meta property="og:title" content="${page.title}" />`);
  html = html.replace(/<meta property="og:description" content=".*?"\s*\/?>/s, `<meta property="og:description" content="${page.description}" />`);
  html = html.replace(/<meta property="og:url" content=".*?"\s*\/?>/s, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:image" content=".*?"\s*\/?>/s, `<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />`);

  // Replace Twitter Card Tags
  html = html.replace(/<meta name="twitter:title" content=".*?"\s*\/?>/s, `<meta name="twitter:title" content="${page.title}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?"\s*\/?>/s, `<meta name="twitter:description" content="${page.description}" />`);
  html = html.replace(/<meta name="twitter:image" content=".*?"\s*\/?>/s, `<meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />`);

  // Replace keywords if present
  if (keywordsStr) {
    if (html.includes('name="keywords"')) {
      html = html.replace(/<meta name="keywords" content=".*?"\s*\/?>/s, `<meta name="keywords" content="${keywordsStr}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="keywords" content="${keywordsStr}" />\n</head>`);
    }
  }

  // Inject structured data
  if (page.structuredData) {
    const jsonLdScript = `\n    <script id="voke-json-ld" type="application/ld+json">\n${JSON.stringify(page.structuredData, null, 2)}\n    </script>\n`;
    if (html.includes('id="voke-json-ld"')) {
      html = html.replace(/<script id="voke-json-ld".*?<\/script>/s, jsonLdScript);
    } else {
      html = html.replace('</head>', `${jsonLdScript}</head>`);
    }
  }

  return html;
}

function main() {
  const distDir = path.resolve(__dirname, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(distDir) || !fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  console.log('🚀 Running Voke SEO Generation Pipeline...');

  // 1. Generate sitemap.xml
  const sitemapXml = generateSitemap();
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('  ✅ Generated dist/sitemap.xml (Public pages only)');

  // Also copy to public/sitemap.xml for dev
  const publicDir = path.resolve(__dirname, '../public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
    console.log('  ✅ Updated public/sitemap.xml');
  }

  // 2. Generate robots.txt
  const robotsTxt = generateRobotsTxt();
  fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('  ✅ Generated dist/robots.txt (Disallowed private routes)');

  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
    console.log('  ✅ Updated public/robots.txt');
  }

  // 3. Pre-render HTML shell for each public page into dist/
  const templateHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
  let prerenderCount = 0;

  PUBLIC_ROUTES.forEach((page) => {
    const prerenderedHtml = buildPreRenderedHtml(templateHtml, page);

    if (page.path === '/') {
      fs.writeFileSync(indexHtmlPath, prerenderedHtml, 'utf-8');
      prerenderCount++;
    } else {
      const targetDir = path.join(distDir, page.path.replace(/^\//, ''));
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'index.html'), prerenderedHtml, 'utf-8');
      prerenderCount++;
    }
  });

  console.log(`  ✅ Pre-rendered static HTML shell files for ${prerenderCount} public routes into dist/`);
  console.log('🎉 SEO Architecture Generation Complete!');
}

main();
