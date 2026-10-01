/** Local adapter uses HttpOnly cookies. Cloud adapter uses Supabase Auth + RLS. */
import { createSupabaseBackend } from './supabase.js';
export function createBackend(config = {}) {
  if (config.supabaseUrl && config.supabaseKey) return createSupabaseBackend(config);
  if (config.mode === 'local') return createLocalBackend();
  return null;
}
function createLocalBackend() {
  let csrf = null;
  async function call(path, { method = 'GET', body, raw = false } = {}) {
    const headers = {};
    if (method !== 'GET') {
      if (csrf) headers['X-CSRF-Token'] = csrf;
      headers['Content-Type'] = raw ? 'image/webp' : 'application/json';
    }
    let response;
    try { response = await fetch(`/api${path}`, { method, credentials: 'same-origin', cache: 'no-store', headers, body: body === undefined ? undefined : raw ? body : JSON.stringify(body), signal: AbortSignal.timeout(20000) }); }
    catch { throw new Error('تعذّر الاتصال بالسيرفر. تأكد من الاتصال وجرّب مرة أخرى.'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data.error || 'تعذّر إكمال الطلب.'); error.status = response.status; throw error; }
    if (data.csrf) csrf = data.csrf;
    return data;
  }
  return {
    kind: 'local',
    publicBrands: () => call('/brands'),
    login: (email,password) => call('/login',{method:'POST',body:{email,password}}),
    session: () => call('/session'),
    logout: async () => { await call('/logout',{method:'POST',body:{}}); csrf=null; },
    list: () => call('/admin/brands'),
    save: (brand,id,version) => call(id?`/admin/brands/${encodeURIComponent(id)}`:'/admin/brands',{method:id?'PUT':'POST',body:{...brand,version}}),
    remove: (id,version) => call(`/admin/brands/${encodeURIComponent(id)}`,{method:'DELETE',body:{version}}),
    upload: blob => call('/admin/upload',{method:'POST',body:blob,raw:true}),
    changePassword: (current,password) => call('/admin/password',{method:'POST',body:{current,password}}),
    exportData: () => call('/admin/export')
  };
}
