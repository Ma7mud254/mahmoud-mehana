import { createFileRoute } from "@tanstack/react-router";

import { AlloyAdmin } from "@/components/AlloyAdmin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة الإدارة — Mahmoud Mehana" },
      { name: "description", content: "لوحة إدارة البراندات الخاصة بموقع Mahmoud Mehana." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "لوحة الإدارة — Mahmoud Mehana" },
      { property: "og:description", content: "منطقة خاصة لإدارة البراندات واللوجوهات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return <AlloyAdmin />;
}
