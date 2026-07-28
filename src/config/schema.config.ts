import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from "./seo.config";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Reusable Organization JSON-LD Schema
 */
export function createOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      "url": DEFAULT_OG_IMAGE,
      "caption": SITE_NAME
    },
    "sameAs": [
      "https://twitter.com/tryvoke",
      "https://www.linkedin.com/company/vokeaii/",
      "https://www.instagram.com/tryvoke.in"
    ]
  };
}

/**
 * Reusable WebSite Schema with SearchAction (Sitelinks Search Box)
 */
export function createWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "url": SITE_URL,
    "name": SITE_NAME,
    "description": "AI-Powered Technical & Behavioral Interview Practice Platform for Tech Students & Engineers",
    "publisher": {
      "@id": `${SITE_URL}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/companies?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Reusable WebApplication & SoftwareApplication Schema
 */
export function createSoftwareApplicationSchema(canonicalUrl: string = SITE_URL) {
  return {
    "@type": ["WebApplication", "SoftwareApplication"],
    "@id": `${SITE_URL}/#softwareapplication`,
    "name": "Voke AI Interview Preparation Platform",
    "url": canonicalUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript and WebRTC support.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@id": `${SITE_URL}/#organization`
    }
  };
}

/**
 * Reusable WebPage Schema
 */
export function createWebPageSchema(name: string, description: string, canonicalUrl: string) {
  return {
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    "url": canonicalUrl,
    "name": name,
    "description": description,
    "isPartOf": {
      "@id": `${SITE_URL}/#website`
    },
    "publisher": {
      "@id": `${SITE_URL}/#organization`
    }
  };
}

/**
 * Reusable BreadcrumbList Schema
 */
export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${items[items.length - 1]?.url || SITE_URL}#breadcrumb`,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url.startsWith("/") ? item.url : `/${item.url}`}`
    }))
  };
}

/**
 * Reusable FAQPage Schema
 */
export function createFAQPageSchema(faqs: FAQItem[], canonicalUrl: string = `${SITE_URL}/help`) {
  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#faqpage`,
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Composite Graph Schema Generator to eliminate duplication and ensure valid Google Rich Results
 */
export function createPageSchemaGraph(options: {
  canonicalUrl: string;
  pageName: string;
  pageDescription: string;
  breadcrumbs?: BreadcrumbItem[];
  faqs?: FAQItem[];
  includeSoftwareApp?: boolean;
  extraSchemas?: object[];
}) {
  const graph: object[] = [
    createOrganizationSchema(),
    createWebSiteSchema(),
    createWebPageSchema(options.pageName, options.pageDescription, options.canonicalUrl)
  ];

  if (options.includeSoftwareApp) {
    graph.push(createSoftwareApplicationSchema(options.canonicalUrl));
  }

  if (options.breadcrumbs && options.breadcrumbs.length > 0) {
    graph.push(createBreadcrumbSchema(options.breadcrumbs));
  }

  if (options.faqs && options.faqs.length > 0) {
    graph.push(createFAQPageSchema(options.faqs, options.canonicalUrl));
  }

  if (options.extraSchemas && options.extraSchemas.length > 0) {
    graph.push(...options.extraSchemas);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
