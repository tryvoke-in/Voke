import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSEOForPath, SEOData, SITE_URL } from "@/config/seo.config";
import { updateHeadMetadata } from "@/utils/seo";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalPath?: string;
  robots?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  structuredData?: object | object[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalPath,
  robots,
  ogType,
  ogImage,
  structuredData,
}) => {
  const location = useLocation();

  useEffect(() => {
    const routeSeo = getSEOForPath(location.pathname);

    const mergedSeo: SEOData = {
      title: title || routeSeo.title,
      description: description || routeSeo.description,
      keywords: keywords || routeSeo.keywords,
      canonicalUrl: canonicalPath
        ? `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`
        : routeSeo.canonicalUrl,
      robots: robots || routeSeo.robots,
      ogType: ogType || routeSeo.ogType,
      ogImage: ogImage || routeSeo.ogImage,
      twitterCard: routeSeo.twitterCard,
      structuredData: structuredData || routeSeo.structuredData,
      isPublic: routeSeo.isPublic,
    };

    updateHeadMetadata(mergedSeo);
  }, [
    location.pathname,
    title,
    description,
    keywords,
    canonicalPath,
    robots,
    ogType,
    ogImage,
    structuredData,
  ]);

  return null;
};

export default SEO;
