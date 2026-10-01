import { createFileRoute } from "@tanstack/react-router";

import { AlloyPortfolio } from "@/components/AlloyPortfolio";
import ogCoverAsset from "@/assets/og-cover.jpg.asset.json";

const title = "Mahmoud Mehana — Shopify Developer | Building considered Shopify experiences";
const description =
  "Mahmoud Mehana — Shopify Developer | Building considered Shopify experiences. Custom Liquid, Figma to Shopify, responsive storefronts and thoughtful e-commerce experiences. Explore the work and start a conversation.";
const ogImage = ogCoverAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "theme-color", content: "#f3f2ea" },
      { property: "og:title", content: "Mahmoud Mehana — Building considered Shopify experiences." },
      {
        property: "og:description",
        content:
          "Custom Shopify development, Liquid, Arabic storefronts, and the brands behind the work.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Mahmoud Mehana",
          jobTitle: "Shopify Developer",
          email: "mailto:arch.ma7mud@gmail.com",
          telephone: ["+966509435879", "+201020600306"],
          sameAs: [
            "https://www.facebook.com/mahmoud.mehana87",
            "https://www.linkedin.com/in/ma7mud-mehana/",
          ],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <AlloyPortfolio />;
}
