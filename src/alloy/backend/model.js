/** Shared, dependency-free validation. Always repeated by the server/database. */
export const CATEGORIES = ['Fashion','Beauty','Food','Books','Technology','Lifestyle','Other'];
export const MAX_LOGO_BYTES = 3 * 1024 * 1024;
export function cleanURL(value) {
  const input = String(value || '').trim();
  if (!input) return null;
  let u;
  try { u = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`); }
  catch { throw new Error('اكتب رابط متجر صحيحًا.'); }
  if (u.protocol !== 'https:' || u.username || u.password || !u.hostname.includes('.') || u.hostname.length > 253 || input.length > 2048)
    throw new Error('الرابط لازم يكون HTTPS لمتجر عام، بدون اسم مستخدم أو كلمة مرور.');
  if (u.hostname === 'localhost' || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(u.hostname))
    throw new Error('استخدم رابط متجر عام، وليس عنوانًا محليًا.');
  return u.href;
}
export function validateBrand(input) {
  const name = String(input.name || '').trim();
  if (name.length < 2 || name.length > 100) throw new Error('اسم البراند من حرفين إلى 100 حرف.');
  const category = CATEGORIES.includes(input.category) ? input.category : 'Other';
  const url = cleanURL(input.url);
  const position = Number(input.position ?? 0);
  if (!Number.isInteger(position) || position < 0 || position > 100000) throw new Error('الترتيب رقم من 0 إلى 100000.');
  if (input.link_enabled === true && !url) throw new Error('أضف رابط المتجر قبل تفعيل زيارته.');
  const logo = input.logo ? String(input.logo) : null;
  if (logo && (logo.length > 2048 || !(/^(?:logos\/[a-z0-9-]+\.webp|\/uploads\/[a-f0-9-]+\.webp|https:\/\/[^\s]+)$/.test(logo))))
    throw new Error('مسار اللوجو غير صالح. ارفع الصورة من زر الرفع.');
  return { name, category, url, logo, position, is_visible: input.is_visible === true, link_enabled: input.link_enabled === true };
}
export function toPublicBrand(b) {
  return { ...b, url: b.link_enabled === false ? null : b.url };
}
export function initialBrand(b, i) {
  return { ...b, position: i * 10, is_visible: true, link_enabled: Boolean(b.url) };
}
