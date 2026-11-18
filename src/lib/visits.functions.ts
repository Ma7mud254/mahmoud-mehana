import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

type VisitInput = { kind: "view" | "brand_open" | "store_click"; brandId: string | null; referrer: string | null };

function deviceFrom(ua: string): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

/** Records one anonymous visit event: no IP, no cookies, no personal data. */
export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((input: VisitInput): VisitInput => {
    const kind = ["view", "brand_open", "store_click"].includes(input.kind) ? input.kind : "view";
    const brandId = typeof input.brandId === "string" ? input.brandId.slice(0, 100) : null;
    const referrer = typeof input.referrer === "string" ? input.referrer.slice(0, 120) : null;
    return { kind, brandId, referrer };
  })
  .handler(async ({ data }) => {
    const ua = getRequestHeader("user-agent") ?? "";
    if (/bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(ua)) return { ok: true };
    const country = (getRequestHeader("cf-ipcountry") ?? "").toUpperCase().slice(0, 3) || null;
    let referrerHost: string | null = null;
    if (data.referrer) {
      try {
        referrerHost = new URL(data.referrer).hostname.replace(/^www\./, "").slice(0, 120) || null;
      } catch {
        referrerHost = null;
      }
    }
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error } = await sb.from("portfolio_visits").insert({
      kind: data.kind,
      brand_id: data.brandId,
      referrer_host: referrerHost,
      country: country === "XX" || country === "T1" ? null : country,
      device: deviceFrom(ua),
    });
    if (error) console.error("recordVisit", error.message);
    return { ok: !error };
  });
