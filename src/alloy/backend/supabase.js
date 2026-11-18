/** Supabase REST adapter: no server secrets, no sign-up path, database-enforced roles. */
import { validateBrand, toPublicBrand } from './model.js';
export function createSupabaseBackend(config) {
  const base = String(config.supabaseUrl).replace(/\/$/,'');
  if (!/^https:\/\/[a-z0-9.-]+$/.test(base)) throw new Error('Invalid Supabase URL');
  const key = String(config.supabaseKey);
  if (key.startsWith('sb_secret_')) throw new Error('A secret key must never be used in the frontend.');
  try { if (key.split('.').length===3 && JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='service_role') throw new Error('SERVICE_ROLE_FORBIDDEN'); }
  catch(e) { if (e.message==='SERVICE_ROLE_FORBIDDEN') throw e; }
  const storageKey = `mm-admin-${new URL(base).hostname}`;
  let auth=null, refreshing=null;
  try { auth=JSON.parse(sessionStorage.getItem(storageKey)||'null'); } catch { /* empty session */ }
  const keep = value => { auth=value; try { value?sessionStorage.setItem(storageKey,JSON.stringify(value)):sessionStorage.removeItem(storageKey); } catch { /* memory-only session remains functional */ } };
  async function request(path,{method='GET',body,token,headers={},binary=false}={}) {
    let res;
    try { res=await fetch(base+path,{method,headers:{apikey:key,...(token?{Authorization:`Bearer ${token}`}:{ }),...(!binary&&body!==undefined?{'Content-Type':'application/json'}:{}),...headers},body:body===undefined?undefined:binary?body:JSON.stringify(body),signal:AbortSignal.timeout(25000)}); }
    catch { throw new Error('تعذّر الاتصال بقاعدة البيانات. حاول مرة أخرى.'); }
    const data=await res.json().catch(()=>null);
    if(!res.ok){const error=new Error(res.status===401?'انتهت الجلسة. سجّل الدخول مرة أخرى.':res.status===429?'محاولات كثيرة. انتظر قليلًا قبل إعادة المحاولة.':'تعذّر حفظ الطلب. راجع الاتصال والصلاحيات.');error.status=res.status;error.code=data?.code;throw error;}
    return data;
  }
  async function token(){
    if(!auth?.access_token){const e=new Error('سجّل الدخول أولًا.');e.status=401;throw e;}
    if(Date.now()/1000>auth.expires_at-60){
      if(!refreshing) refreshing=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:auth.refresh_token}}).then(d=>keep({...d,expires_at:Math.floor(Date.now()/1000)+d.expires_in})).catch(e=>{keep(null);throw e;}).finally(()=>{refreshing=null;});
      await refreshing;
    }
    return auth.access_token;
  }
  async function session(){
    const t=await token();
    const user=await request('/auth/v1/user',{token:t});
    const isAdmin=await request('/rest/v1/rpc/is_portfolio_admin',{method:'POST',body:{},token:t});
    if(isAdmin!==true){keep(null);const e=new Error('هذا الحساب غير مصرح له بالإدارة.');e.status=403;throw e;}
    return {email:user.email};
  }
  async function listAll(isAdmin){
    const out=[];let offset=0;
    const t=isAdmin?await token():undefined;
    while(true){
      const rows=await request(`/rest/v1/portfolio_brands?select=*&order=position.asc,name.asc&limit=500&offset=${offset}${isAdmin?'':'&is_visible=eq.true'}`,{token:t});
      out.push(...rows);if(rows.length<500)break;offset+=500;
    }
    return out;
  }
  return {
    kind:'supabase',
    publicBrands:async()=> (await listAll(false)).map(toPublicBrand),
    session,
    login:async(email,password)=>{
      let data;
      try{data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});}
      catch(e){if(e.status===400||e.status===401){e.message='البريد أو كلمة المرور غير صحيحة.';}throw e;}
      keep({...data,expires_at:Math.floor(Date.now()/1000)+data.expires_in});return session();
    },
    logout:async()=>{try{if(auth)await request('/auth/v1/logout?scope=local',{method:'POST',token:await token()});}finally{keep(null);}},
    list:()=>listAll(true),
    save:async(input,id,version)=>{
      const b=validateBrand(input),t=await token();
      const path=id?`/rest/v1/portfolio_brands?id=eq.${encodeURIComponent(id)}&version=eq.${Number(version)}`:'/rest/v1/portfolio_brands';
      const rows=await request(path,{method:id?'PATCH':'POST',token:t,body:id?b:{...b,id:crypto.randomUUID()},headers:{Prefer:'return=representation'}});
      if(!rows?.length)throw new Error('تم تعديل هذا البراند من جلسة أخرى. حدّث القائمة ثم حاول مرة أخرى.');
      return rows[0];
    },
    remove:async(id,version)=>{
      const rows=await request(`/rest/v1/portfolio_brands?id=eq.${encodeURIComponent(id)}&version=eq.${Number(version)}`,{method:'DELETE',token:await token(),headers:{Prefer:'return=representation'}});
      if(!rows?.length)throw new Error('تغيّر البراند بالفعل. حدّث القائمة ثم حاول مرة أخرى.');
      return {ok:true};
    },
    upload:async(blob)=>{
      if(blob.type!=='image/webp'||blob.size>3145728)throw new Error('صيغة أو حجم الصورة غير مناسب.');
      const filename=`logos/${crypto.randomUUID()}.webp`;
      await request(`/storage/v1/object/portfolio-assets/${filename}`,{method:'POST',token:await token(),body:blob,binary:true,headers:{'Content-Type':'image/webp','Cache-Control':'3600','x-upsert':'false'}});
      return {logo:`${base}/storage/v1/object/public/portfolio-assets/${filename}`};
    },
    changePassword:async(current,password)=>{
      if(password.length<16||password.length>128)throw new Error('استخدم كلمة مرور من 16 إلى 128 حرفًا.');
      const verified=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email:auth.user.email,password:current}}).catch(()=>{throw new Error('كلمة المرور الحالية غير صحيحة.');});
      keep({...verified,expires_at:Math.floor(Date.now()/1000)+verified.expires_in});
      await request('/auth/v1/user',{method:'PUT',token:await token(),body:{password}});
      await request('/auth/v1/logout?scope=global',{method:'POST',token:await token()});keep(null);return {ok:true};
    },
    visitorStats:async(days=30)=>request('/rest/v1/rpc/portfolio_visit_stats',{method:'POST',body:{days},token:await token()}),
    exportData:async()=>({format:'mahmoud-mehana-brands',version:1,exported_at:new Date().toISOString(),brands:await listAll(true),note:'Cloud export includes logo URLs. Export Storage separately for a complete offline backup.'})
  };
}
