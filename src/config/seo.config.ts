import {
  createPageSchemaGraph,
  createSoftwareApplicationSchema,
  BreadcrumbItem,
  FAQItem,
} from "./schema.config";

export const SITE_URL = "https://www.tryvoke.in";
export const SITE_NAME = "Voke";
export const DEFAULT_AUTHOR = "Voke";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const TWITTER_HANDLE = "@tryvoke";

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  author: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogType: "website" | "article" | "product";
  ogImage: string;
  ogUrl: string;
  twitterCard: "summary" | "summary_large_image";
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  structuredData?: object | object[];
  isPublic: boolean;
}

export interface RouteSEOInput {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  structuredData?: (canonical: string) => object | object[];
}

// Known public company slugs for pre-rendering static routes
export const KNOWN_COMPANY_SLUGS = [
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

// Private route prefixes that must be noindex, nofollow and excluded from sitemaps
export const PRIVATE_ROUTE_PREFIXES = [
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

/**
 * Factory helper to construct complete, non-duplicated SEOData objects
 * guaranteeing all 13 required metadata fields are populated.
 */
export function createSEOData(input: Partial<SEOData> & { title: string; description: string; canonicalUrl: string }): SEOData {
  const title = input.title;
  const description = input.description;
  const canonicalUrl = input.canonicalUrl;
  const ogImage = input.ogImage || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    keywords: input.keywords,
    author: input.author || DEFAULT_AUTHOR,
    canonicalUrl,
    robots: input.robots || "index, follow",
    ogTitle: input.ogTitle || title,
    ogDescription: input.ogDescription || description,
    ogType: input.ogType || "website",
    ogImage,
    ogUrl: input.ogUrl || canonicalUrl,
    twitterCard: input.twitterCard || "summary_large_image",
    twitterTitle: input.twitterTitle || input.ogTitle || title,
    twitterDescription: input.twitterDescription || input.ogDescription || description,
    twitterImage: input.twitterImage || ogImage,
    twitterSite: TWITTER_HANDLE,
    structuredData: input.structuredData,
    isPublic: input.isPublic !== undefined ? input.isPublic : true,
  };
}

export const PUBLIC_ROUTES_REGISTRY: Record<string, RouteSEOInput> = {
  "/": {
    path: "/",
    title: "Voke – AI Powered Interview Practice for Tech Students & Engineers",
    description:
      "Practice tech interviews with AI-powered feedback, resume-based questions, real-time mock sessions, and coding practice. Built for B.Tech CSE students preparing for placements and software engineering roles.",
    keywords: [
      "Voke",
      "AI interview practice",
      "technical mock interview",
      "behavioral interview AI",
      "resume analysis interview",
      "B.Tech placement preparation",
      "coding interview prep"
    ],
    changefreq: "daily",
    priority: 1.0,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Voke – AI Powered Interview Practice Platform",
        pageDescription: "AI-powered technical and behavioral mock interview platform for college students and developers.",
        includeSoftwareApp: true,
        breadcrumbs: [{ name: "Home", url: SITE_URL }]
      })
  },
  "/pricing": {
    path: "/pricing",
    title: "Pricing Plans & Subscriptions – Voke AI",
    description:
      "Explore affordable Voke AI pricing plans for Tech Students and Engineers. Get unlimited AI mock interviews, resume feedback, and company-specific question prep.",
    keywords: ["Voke pricing", "AI interview cost", "mock interview subscription", "tech interview prep plans"],
    changefreq: "weekly",
    priority: 0.9,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Pricing Plans & Subscriptions",
        pageDescription: "Explore affordable Voke AI pricing plans for Students and Engineers.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Pricing", url: "/pricing" }
        ],
        extraSchemas: [
          {
            "@type": "Product",
            "@id": `${canonicalUrl}#product`,
            "name": "Voke AI Interview Preparation",
            "description": "AI-powered mock interview subscription with resume reviews and company problem sets.",
            "brand": { "@type": "Brand", "name": "Voke" },
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "INR",
              "url": canonicalUrl,
              "lowPrice": "0",
              "highPrice": "2999",
              "offerCount": "3"
            }
          }
        ]
      })
  },
  "/companies": {
    path: "/companies",
    title: "Top Tech Companies Interview Questions & AI Practice – Voke",
    description:
      "Practice real interview questions asked by Google, Meta, Amazon, Microsoft, Apple, Uber, and top tech companies. Filter by question frequency, difficulty, and practice live.",
    keywords: ["company interview questions", "Google interview questions", "Amazon tech questions", "coding interview questions by company"],
    changefreq: "daily",
    priority: 0.9,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Top Tech Companies Interview Questions",
        pageDescription: "Practice real technical interview questions asked by top tech companies.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Companies", url: "/companies" }
        ],
        extraSchemas: [
          {
            "@type": "ItemList",
            "@id": `${canonicalUrl}#itemlist`,
            "name": "Top Tech Companies",
            "description": "Top companies technical interview problem sets.",
            "url": canonicalUrl,
            "itemListElement": KNOWN_COMPANY_SLUGS.slice(0, 10).map((slug, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "name": slug.charAt(0).toUpperCase() + slug.slice(1),
              "url": `${SITE_URL}/companies/${slug}`
            }))
          }
        ]
      })
  },
  "/dsa-sheet": {
    path: "/dsa-sheet",
    title: "Curated Data Structures & Algorithms (DSA) Sheet – Voke",
    description:
      "Master Data Structures and Algorithms with Voke's handpicked DSA problem sheet. From Arrays and Trees to Dynamic Programming, practice with instant AI guidance.",
    keywords: ["DSA sheet", "Data Structures Algorithms practice", "coding interview roadmap", "SDE prep sheet"],
    changefreq: "weekly",
    priority: 0.8,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Curated Data Structures & Algorithms Sheet",
        pageDescription: "Complete Data Structures & Algorithms practice curriculum with AI evaluation.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "DSA Sheet", url: "/dsa-sheet" }
        ]
      })
  },
  "/question-practice": {
    path: "/question-practice",
    title: "Technical & Behavioral Question Practice Bank – Voke",
    description:
      "Browse and practice thousands of technical, system design, and behavioral interview questions with instant AI solution feedback.",
    keywords: ["interview question bank", "behavioral interview practice", "system design questions", "coding practice"],
    changefreq: "weekly",
    priority: 0.8,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Technical & Behavioral Question Bank",
        pageDescription: "Interactive question bank for technical, coding, and behavioral prep.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Question Practice", url: "/question-practice" }
        ]
      })
  },
  "/daily-challenge": {
    path: "/daily-challenge",
    title: "Daily Coding & Technical Interview Challenge – Voke",
    description:
      "Solve today's coding and interview challenge on Voke. Build problem-solving consistency, earn streak rewards, and sharpen technical skills daily.",
    keywords: ["daily coding challenge", "interview question of the day", "daily DSA challenge"],
    changefreq: "daily",
    priority: 0.8,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Daily Interview Challenge",
        pageDescription: "Daily interview preparation problem for tech developers.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Daily Challenge", url: "/daily-challenge" }
        ]
      })
  },
  "/elite-prep": {
    path: "/elite-prep",
    title: "Elite Interview Preparation Program – Voke",
    description:
      "Accelerated 1-on-1 style AI coaching for tier-1 tech company placement. High-intensity mock interviews, system design drills, and resume optimization.",
    keywords: ["elite prep program", "MAANG interview coaching", "tier 1 placement prep", "system design mock interview"],
    changefreq: "weekly",
    priority: 0.8,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Elite Prep Program",
        pageDescription: "Accelerated 1-on-1 style AI coaching for tier-1 tech company placement.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Elite Prep", url: "/elite-prep" }
        ]
      })
  },
  "/community": {
    path: "/community",
    title: "Tech Student & Job Seeker Community Hub – Voke",
    description:
      "Connect with B.Tech students and tech job seekers. Share interview experiences, study strategies, peer practice feedback, and career guidance.",
    keywords: ["tech community", "interview experience sharing", "B.Tech placement forum", "peer mock practice"],
    changefreq: "daily",
    priority: 0.7,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Candidate & Student Community Hub",
        pageDescription: "Connect with tech job seekers and B.Tech students.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Community", url: "/community" }
        ]
      })
  },
  "/leaderboard": {
    path: "/leaderboard",
    title: "Global Student & Developer Interview Leaderboard – Voke",
    description:
      "See top performing students and developers practicing on Voke. Track practice hours, completed challenges, and interview preparation rankings.",
    keywords: ["interview leaderboard", "top coding students", "Voke practice rankings"],
    changefreq: "daily",
    priority: 0.7,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Global Interview Leaderboard",
        pageDescription: "See top performing students and developers practicing on Voke.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Leaderboard", url: "/leaderboard" }
        ]
      })
  },
  "/help": {
    path: "/help",
    title: "Help Center & FAQs – Voke AI Interview Platform",
    description:
      "Find answers to frequently asked questions about Voke AI, account management, subscription plans, resume parsing, and mock interview tools.",
    keywords: ["Voke help", "Voke FAQ", "AI interview platform guide", "Voke support"],
    changefreq: "monthly",
    priority: 0.6,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Help Center & FAQs",
        pageDescription: "Frequently asked questions about Voke AI interview platform.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Help", url: "/help" }
        ],
        faqs: [
          {
            question: "How does Voke AI mock interview work?",
            answer:
              "Voke uses advanced AI models to conduct voice and video interviews, evaluating technical correctness, communication clarity, and confidence while giving personalized feedback based on your resume."
          },
          {
            question: "Is Voke suitable for B.Tech CSE students?",
            answer:
              "Yes! Voke is specifically designed for college students and developers preparing for internships, campus placements, and software engineering roles."
          },
          {
            question: "Does Voke analyze resume and GitHub projects?",
            answer:
              "Yes, Voke extracts key experience, tech stack, and GitHub repository details to generate custom interview questions tailored directly to your profile."
          }
        ]
      })
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy – Voke Data Protection & Security",
    description:
      "Read Voke's privacy policy. Learn how we protect your personal information, resume documents, and interview data with enterprise AES-256 encryption.",
    keywords: ["Voke privacy policy", "data security", "DPDP compliance"],
    changefreq: "monthly",
    priority: 0.5,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Privacy Policy",
        pageDescription: "Privacy policy and data protection overview for Voke users.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Privacy", url: "/privacy" }
        ]
      })
  },
  "/about": {
    path: "/about",
    title: "About Voke – E-E-A-T Verified AI Interview Platform & Founder Story",
    description:
      "Learn about Voke's engineering lineage, founder credibility, AI interview scoring methodology, and security standards.",
    keywords: ["About Voke", "AI interview methodology", "Voke founders", "interview scoring system"],
    changefreq: "monthly",
    priority: 0.8,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "About Voke & Our AI Interview Methodology",
        pageDescription: "Founder story, engineering background, and AI scoring transparency.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "About", url: "/about" }
        ]
      })
  },
  "/terms": {
    path: "/terms",
    title: "Terms of Service – Voke",
    description:
      "Review Voke's terms of service, platform usage licenses, and user data protection commitments.",
    keywords: ["Voke terms of service", "Voke terms", "legal agreement"],
    changefreq: "monthly",
    priority: 0.5,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Terms of Service",
        pageDescription: "Terms of service and legal agreement for Voke platform users.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Terms", url: "/terms" }
        ]
      })
  },
  "/contact": {
    path: "/contact",
    title: "Contact Us & Support – Voke AI",
    description:
      "Get in touch with Voke support, founder engineering team, and data privacy officers.",
    keywords: ["Contact Voke", "Voke support", "Voke founders contact"],
    changefreq: "monthly",
    priority: 0.6,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Contact Us & Support",
        pageDescription: "Contact information for Voke support and engineering team.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Contact", url: "/contact" }
        ]
      })
  },
  "/blog": {
    path: "/blog",
    title: "Voke Engineering & Tech Interview Preparation Blog",
    description:
      "Expert insights, coding interview strategies, system design guides, and placement preparation tips for software engineering candidates.",
    keywords: ["tech interview blog", "coding interview tips", "system design guide", "software placement blog"],
    changefreq: "daily",
    priority: 0.8,
    structuredData: (canonicalUrl) =>
      createPageSchemaGraph({
        canonicalUrl,
        pageName: "Engineering & Tech Interview Blog",
        pageDescription: "Coding interview strategies, system design guides, and placement tips.",
        breadcrumbs: [
          { name: "Home", url: SITE_URL },
          { name: "Blog", url: "/blog" }
        ]
      })
  }
};

/**
 * Dynamic route matchers supporting future features, blogs, companies, and landing pages
 */
const DYNAMIC_ROUTE_RESOLVERS: Array<{
  match: (path: string) => RegExpMatchArray | null;
  resolve: (match: RegExpMatchArray, cleanPath: string) => SEOData;
}> = [
  // 1. Dynamic Blog Pages: /blog/:slug or /blogs/:slug
  {
    match: (path) => path.match(/^\/(?:blog|blogs)\/([a-zA-Z0-9_-]+)$/),
    resolve: (match, cleanPath) => {
      const slug = match[1];
      const titleWords = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1));
      const postTitle = titleWords.join(" ");
      const canonicalUrl = `${SITE_URL}${cleanPath}`;

      return createSEOData({
        title: `${postTitle} – Voke Tech Blog`,
        description: `Read ${postTitle} on Voke. Discover key technical interview insights, problem-solving strategies, and career growth tips.`,
        keywords: [postTitle.toLowerCase(), "tech interview tips", "software engineer guide", "Voke blog"],
        canonicalUrl,
        ogType: "article",
        robots: "index, follow",
        structuredData: createPageSchemaGraph({
          canonicalUrl,
          pageName: postTitle,
          pageDescription: `Read ${postTitle} on Voke Tech Blog.`,
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: "Blog", url: "/blog" },
            { name: postTitle, url: cleanPath }
          ],
          extraSchemas: [
            {
              "@type": "BlogPosting",
              "@id": `${canonicalUrl}#blogposting`,
              "headline": postTitle,
              "url": canonicalUrl,
              "author": { "@type": "Organization", "name": DEFAULT_AUTHOR, "url": SITE_URL },
              "publisher": { "@id": `${SITE_URL}/#organization` }
            }
          ]
        })
      });
    }
  },

  // 2. Dynamic Feature Pages: /features/:slug
  {
    match: (path) => path.match(/^\/features\/([a-zA-Z0-9_-]+)$/),
    resolve: (match, cleanPath) => {
      const slug = match[1];
      const featureName = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const canonicalUrl = `${SITE_URL}${cleanPath}`;

      return createSEOData({
        title: `${featureName} – AI Feature Overview | Voke`,
        description: `Explore Voke's ${featureName} feature. Real-time AI evaluation, adaptive feedback, and interactive technical practice tailored for engineers.`,
        keywords: [`${featureName} AI`, "Voke feature", "tech interview tools"],
        canonicalUrl,
        robots: "index, follow",
        structuredData: createPageSchemaGraph({
          canonicalUrl,
          pageName: featureName,
          pageDescription: `AI-driven ${featureName} tool for technical interview practice.`,
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: "Features", url: "/#features" },
            { name: featureName, url: cleanPath }
          ]
        })
      });
    }
  },

  // 3. Dynamic Company Pages: /companies/:slug
  {
    match: (path) => path.match(/^\/companies\/([a-zA-Z0-9_-]+)$/),
    resolve: (match, cleanPath) => {
      const slug = match[1];
      const companyName = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      const canonicalUrl = `${SITE_URL}/companies/${slug}`;

      return createSEOData({
        title: `${companyName} Interview Questions & AI Practice | Voke`,
        description: `Practice real ${companyName} technical and behavioral interview questions. Filter questions by frequency and difficulty, and prepare with live AI mock interviews.`,
        keywords: [
          `${companyName} interview questions`,
          `practice ${companyName} coding problems`,
          `${companyName} tech interview`,
          "company mock interview"
        ],
        canonicalUrl,
        robots: "index, follow",
        structuredData: createPageSchemaGraph({
          canonicalUrl,
          pageName: `${companyName} Technical & Behavioral Interview Questions`,
          pageDescription: `Practice real ${companyName} technical and behavioral interview questions on Voke.`,
          breadcrumbs: [
            { name: "Home", url: SITE_URL },
            { name: "Companies", url: "/companies" },
            { name: companyName, url: cleanPath }
          ]
        })
      });
    }
  }
];

/**
 * Scalable entry point for resolving full SEO metadata for any path.
 * Ensures zero duplication and automatic population of all 13 metadata attributes.
 */
export function getSEOForPath(pathname: string): SEOData {
  const cleanPath = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  // 1. Check if route is private
  const isPrivate = PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
  );

  if (isPrivate) {
    return createSEOData({
      title: "Voke – AI Interview Practice Portal",
      description: "Private user dashboard and practice portal on Voke.",
      canonicalUrl: `${SITE_URL}${cleanPath}`,
      robots: "noindex, nofollow",
      isPublic: false,
    });
  }

  // 2. Check static public routes registry
  const staticConfig = PUBLIC_ROUTES_REGISTRY[cleanPath];
  if (staticConfig) {
    const canonicalUrl = `${SITE_URL}${cleanPath === "/" ? "/" : cleanPath}`;
    return createSEOData({
      title: staticConfig.title,
      description: staticConfig.description,
      keywords: staticConfig.keywords,
      author: staticConfig.author,
      canonicalUrl,
      robots: staticConfig.robots || "index, follow",
      ogTitle: staticConfig.ogTitle,
      ogDescription: staticConfig.ogDescription,
      ogType: staticConfig.ogType || "website",
      ogImage: staticConfig.ogImage,
      twitterTitle: staticConfig.twitterTitle,
      twitterDescription: staticConfig.twitterDescription,
      twitterImage: staticConfig.twitterImage,
      structuredData: staticConfig.structuredData ? staticConfig.structuredData(canonicalUrl) : undefined,
      isPublic: true,
    });
  }

  // 3. Check dynamic route resolvers (blog, features, companies)
  for (const resolver of DYNAMIC_ROUTE_RESOLVERS) {
    const match = resolver.match(cleanPath);
    if (match) {
      return resolver.resolve(match, cleanPath);
    }
  }

  // 4. Default fallback for unmatched routes
  return createSEOData({
    title: "Voke – AI Powered Interview Practice",
    description: "Master your interview skills with AI-powered practice sessions, instant feedback, and personalized learning paths.",
    canonicalUrl: `${SITE_URL}${cleanPath}`,
    robots: "noindex, follow",
    isPublic: false,
  });
}
