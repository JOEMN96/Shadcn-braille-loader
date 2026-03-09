export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://braille-loader.dev";

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Braille Loader",
    description:
      "A registry-first, accessible braille loader library for shadcn/ui featuring 19 unique animation variants. Built with React, TypeScript, and Tailwind CSS.",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Braille Loader Contributors",
      url: siteUrl,
    },
    screenshot: `${siteUrl}/og-image.png`,
    softwareVersion: "1.0.0",
    license: "https://opensource.org/licenses/MIT",
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Braille Loader",
    description:
      "Accessible braille loader animations for shadcn/ui with 19 unique variants",
    url: siteUrl,
    author: {
      "@type": "Organization",
      name: "Braille Loader Contributors",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Registry",
        item: `${siteUrl}/r/registry.json`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Braille Loader Component",
        item: `${siteUrl}/r/braille-loader.json`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplication),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webSite),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbList),
        }}
      />
    </>
  );
}
