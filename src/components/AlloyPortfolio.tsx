import { useEffect, useRef } from "react";

import markup from "@/alloy/portfolio.html?raw";
import seedBrands from "@/alloy/data/brands.json";
import type { PortfolioBrand } from "@/alloy/portfolio.js";

/**
 * Mounts the ALLOY portfolio UI (real DOM, built from src/alloy/portfolio.html,
 * styled by src/alloy/alloy.css and driven by src/alloy/portfolio.js).
 * Brands come from the live catalog; the bundled snapshot is only a fallback
 * when no backend is configured at all.
 */
export function AlloyPortfolio() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      if (!node) return;
      try {
        const [{ mountPortfolio }, { createBackend }] = await Promise.all([
          import("@/alloy/portfolio.js"),
          import("@/alloy/backend/client.js"),
        ]);

        const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
        const supabaseKey = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
          import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;

        const backend = createBackend({
          ...(supabaseUrl ? { supabaseUrl } : {}),
          ...(supabaseKey ? { supabaseKey } : {}),
        });

        let brands = seedBrands as PortfolioBrand[];
        let unavailable = false;
        if (backend) {
          try {
            brands = await backend.publicBrands();
          } catch {
            brands = [];
            unavailable = true;
          }
        }
        if (disposed) return;

        // Only this developer-owned template is inserted. Admin inputs are escaped.
        node.innerHTML = markup;
        cleanup = mountPortfolio(node, brands, {
          assetBase: "/",
          loadThree: () => import("three"),
        });

        if (unavailable) {
          const notice = document.createElement("p");
          notice.className = "catalog-unavailable";
          notice.setAttribute("role", "status");
          notice.textContent =
            "The brand collection is temporarily unavailable. Please refresh. / قائمة البراندات غير متاحة مؤقتًا. حدّث الصفحة.";
          node.querySelector("#brands")?.prepend(notice);
        }
      } catch {
        if (!disposed) {
          node.textContent = "تعذّر تشغيل الموقع. راجع إعدادات الاتصال بقاعدة البيانات.";
        }
      }
    }

    void start();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={root} id="portfolio-root" />;
}
