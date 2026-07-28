import { SEOData, SITE_NAME } from "@/config/seo.config";

function getOrCreateTag<T extends HTMLElement>(
  selector: string,
  createFn: () => T
): T {
  let element = document.head.querySelector<T>(selector);
  if (!element) {
    element = createFn();
    document.head.appendChild(element);
  }
  return element;
}

function setMetaTag(nameOrProperty: "name" | "property", key: string, content: string | undefined) {
  if (!content) {
    const existing = document.head.querySelector(`meta[${nameOrProperty}="${key}"]`);
    if (existing) existing.remove();
    return;
  }
  const meta = getOrCreateTag<HTMLMetaElement>(
    `meta[${nameOrProperty}="${key}"]`,
    () => {
      const el = document.createElement("meta");
      el.setAttribute(nameOrProperty, key);
      return el;
    }
  );
  meta.setAttribute("content", content);
}

export function updateHeadMetadata(data: SEOData) {
  if (typeof document === "undefined") return;

  // 1. Title
  document.title = data.title;

  // 2. Primary Meta Tags
  setMetaTag("name", "description", data.description);
  setMetaTag("name", "author", data.author);
  setMetaTag("name", "robots", data.robots);
  if (data.keywords && data.keywords.length > 0) {
    setMetaTag("name", "keywords", data.keywords.join(", "));
  } else {
    setMetaTag("name", "keywords", undefined);
  }

  // 3. Canonical Link
  const canonicalLink = getOrCreateTag<HTMLLinkElement>(
    'link[rel="canonical"]',
    () => {
      const el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      return el;
    }
  );
  canonicalLink.setAttribute("href", data.canonicalUrl);

  // 4. Open Graph Tags
  setMetaTag("property", "og:title", data.ogTitle);
  setMetaTag("property", "og:description", data.ogDescription);
  setMetaTag("property", "og:url", data.ogUrl);
  setMetaTag("property", "og:type", data.ogType);
  setMetaTag("property", "og:image", data.ogImage);
  setMetaTag("property", "og:site_name", SITE_NAME);
  setMetaTag("property", "og:locale", "en_IN");

  // 5. Twitter Card Tags
  setMetaTag("name", "twitter:card", data.twitterCard);
  setMetaTag("name", "twitter:title", data.twitterTitle);
  setMetaTag("name", "twitter:description", data.twitterDescription);
  setMetaTag("name", "twitter:image", data.twitterImage);
  setMetaTag("name", "twitter:site", data.twitterSite);

  // 6. JSON-LD Structured Data
  const jsonLdScript = getOrCreateTag<HTMLScriptElement>(
    'script[id="voke-json-ld"]',
    () => {
      const el = document.createElement("script");
      el.setAttribute("id", "voke-json-ld");
      el.setAttribute("type", "application/ld+json");
      return el;
    }
  );

  if (data.structuredData) {
    jsonLdScript.textContent = JSON.stringify(data.structuredData, null, 2);
  } else {
    jsonLdScript.textContent = "";
  }
}
