import React from "react";
import Script from "next/script";

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Standard base component that outputs a schema.org compliant json+ld block
 */
export function JsonLd({ data }: JsonLdProps) {
  // Generate a deterministic ID based on content to prevent hydration mismatches
  const contentHash = JSON.stringify(data).slice(0, 30).replace(/[^a-zA-Z0-9]/g, "");
  const scriptId = `jsonld-${contentHash}`;

  return (
    <Script
      id={scriptId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="afterInteractive"
    />
  );
}

interface OrganizationProps {
  name: string;
  url: string;
  logo: string;
  sameAs?: string[];
  contactPoint?: {
    telephone: string;
    contactType: string;
    areaServed?: string;
    availableLanguage?: string[];
  };
}

/**
 * Outputs Organization Schema
 */
export function OrganizationJsonLd({ name, url, logo, sameAs, contactPoint }: OrganizationProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    ...(sameAs && { sameAs }),
    ...(contactPoint && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: contactPoint.telephone,
        contactType: contactPoint.contactType,
        ...(contactPoint.areaServed && { areaServed: contactPoint.areaServed }),
        ...(contactPoint.availableLanguage && { availableLanguage: contactPoint.availableLanguage }),
      },
    }),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return <JsonLd data={schema} />;
}

interface SoftwareApplicationProps {
  name: string;
  url: string;
  category: string; // e.g. "BusinessApplication"
  operatingSystem: string; // e.g. "All", "iOS, Android, Windows, macOS"
  description: string;
  price: string; // e.g. "0"
  priceCurrency: string; // e.g. "VND"
  ratingValue?: number;
  ratingCount?: number;
}

/**
 * Outputs SoftwareApplication Schema
 */
export function SoftwareApplicationJsonLd({
  name,
  url,
  category,
  operatingSystem,
  description,
  price,
  priceCurrency,
  ratingValue = 4.9,
  ratingCount = 128,
}: SoftwareApplicationProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    downloadUrl: url,
    applicationCategory: category,
    operatingSystem,
    description,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toString(),
      ratingCount: ratingCount.toString(),
      bestRating: "5",
      worstRating: "1"
    },
  };

  return <JsonLd data={schema} />;
}

interface ProductProps {
  name: string;
  image: string[];
  description: string;
  sku?: string;
  mpn?: string;
  brand: string;
  price: string;
  priceCurrency: string;
  priceValidUntil?: string;
  availability?: string; // e.g. "https://schema.org/InStock"
  ratingValue?: number;
  ratingCount?: number;
}

/**
 * Outputs Product Schema
 */
export function ProductJsonLd({
  name,
  image,
  description,
  sku,
  mpn,
  brand,
  price,
  priceCurrency,
  priceValidUntil = "2027-12-31",
  availability = "https://schema.org/InStock",
  ratingValue = 4.8,
  ratingCount = 42,
}: ProductProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image,
    description,
    ...(sku && { sku }),
    ...(mpn && { mpn }),
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      url: typeof window !== "undefined" ? window.location.href : "",
      priceCurrency,
      price,
      priceValidUntil,
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toString(),
      ratingCount: ratingCount.toString(),
    },
  };

  return <JsonLd data={schema} />;
}

interface FAQProps {
  mainEntity: {
    question: string;
    answer: string;
  }[];
}

/**
 * Outputs FAQPage Schema
 */
export function FAQPageJsonLd({ mainEntity }: FAQProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: mainEntity.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={schema} />;
}

interface ArticleProps {
  title: string;
  images: string[];
  datePublished: string;
  dateModified?: string;
  description: string;
  authorName: string;
  authorUrl?: string;
  publisherName: string;
  publisherLogoUrl: string;
  url: string;
}

/**
 * Outputs Article (Blog post) Schema
 */
export function ArticleJsonLd({
  title,
  images,
  datePublished,
  dateModified,
  description,
  authorName,
  authorUrl,
  publisherName,
  publisherLogoUrl,
  url,
}: ArticleProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: title,
    image: images,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorUrl && { url: authorUrl }),
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      logo: {
        "@type": "ImageObject",
        url: publisherLogoUrl,
      },
    },
    description,
  };

  return <JsonLd data={schema} />;
}

interface BreadcrumbItem {
  name: string;
  item: string; // The URL
}

interface BreadcrumbsProps {
  itemListElement: BreadcrumbItem[];
}

/**
 * Outputs BreadcrumbList Schema
 */
export function BreadcrumbsJsonLd({ itemListElement }: BreadcrumbsProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itemListElement.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };

  return <JsonLd data={schema} />;
}
