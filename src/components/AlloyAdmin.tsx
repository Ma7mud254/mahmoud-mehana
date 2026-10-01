import { useEffect, useRef } from "react";

import "@/alloy/admin/admin.css";

/**
 * Mounts the private admin panel (src/alloy/admin/admin.js).
 * All reads and writes go through the live database with database-enforced
 * roles; there is no local or mock persistence.
 */
export function AlloyAdmin() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    async function start() {
      if (!node) return;
      try {
        const [{ mountAdmin }, { createBackend }] = await Promise.all([
          import("@/alloy/admin/admin.js"),
          import("@/alloy/backend/client.js"),
        ]);

        const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
        const supabaseKey = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
          import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;

        const backend = createBackend({
          ...(supabaseUrl ? { supabaseUrl } : {}),
          ...(supabaseKey ? { supabaseKey } : {}),
        });

        if (disposed) return;
        cleanup = mountAdmin(node, backend);
      } catch {
        if (!disposed) {
          node.textContent = "تعذّر تشغيل لوحة الإدارة. راجع إعدادات الاتصال بقاعدة البيانات.";
        }
      }
    }

    void start();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={root} id="admin-root" />;
}
