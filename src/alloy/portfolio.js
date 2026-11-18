/** ALLOY v4.1 — real DOM, database-driven brand rails, accessible native dialogs.
 * No invented clients, testimonials, dates of experience, or performance figures.
 * Three.js is loaded by the React adapter. The zero-install edition includes a
 * dependency-free WebGL globe, with a baked decorative fallback for older GPUs.
 */
export function mountPortfolio(root, brands, options = {}) {
  if (!root) return () => {};
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const cleanups = [], timers = new Set();
  const on = (el, type, fn, opts) => { if (!el) return; el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); };
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const safeURL = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  const asset = value => {
    if (!value) return '';
    if (options.assets && options.assets[value]) return options.assets[value];
    if (/^data:image\/(webp|png|jpeg);base64,/.test(value)) return value;
    if (/^https:\/\//.test(value)) return safeURL(value) || '';
    if (/^\/uploads\/[a-f0-9-]+\.webp$/.test(value)) return value;
    if (!/^(images|logos)\/[a-zA-Z0-9._/-]+$/.test(value) || value.includes('..')) return '';
    return (options.assetBase || './') + value;
  };
  const storage = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k,v) { try { localStorage.setItem(k,v); } catch { /* optional preference only */ } } };
  let lang = storage.get('mm-language') === 'ar' ? 'ar' : 'en';
  const media = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
  let motionOff = media.matches || storage.get('mm-motion') === 'off', railsPaused = false, disposed = false;
  let scene = null, sceneReady = false, sceneStarting = false, heroVisible = true, railsVisible = true, frame = 0, last = 0;
  let x = 0, y = 0, tx = 0, ty = 0, time = 0, navDirty = true, activeDialog = '', beforeFocus = null, previousOverflow = '';
  let category = 'All', query = '', liveOnly = false, limit = 24, toastTimer = null, closeSuppressUntil = 0;
  let rails = [];
  const contacts = { email: 'arch.ma7mud@gmail.com', saudi: '966509435879', egypt: '201020600306' };
  const words = (en, ar) => lang === 'ar' ? ar : en;
  const thmanyahStylesheet='https://cdn.jsdelivr.net/npm/@dawod/thmanyah-font-web@1.2.0/index.css';
  function ensureThmanyahFont(){
    if(document.querySelector('link[data-thmanyah-font]'))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=thmanyahStylesheet;link.dataset.thmanyahFont='';document.head.append(link);
  }
  const publicBrands = (Array.isArray(brands) ? brands : []).filter(b => b && b.is_visible !== false && typeof b.name === 'string').map((b, i) => ({ ...b, id:String(b.id || `brand-${i}`), url: b.link_enabled === false ? null : safeURL(b.url), originalLogo: b.originalLogo === true || /^logos\//.test(b.logo || '') || /^data:image\//.test(b.logo || '') }));
  const categoriesAr = { All:'الكل', Fashion:'الأزياء', Beauty:'الجمال والعطور', Food:'الأغذية', Books:'الكتب', Technology:'التقنية', Lifestyle:'لايف ستايل', Other:'أخرى' };
  const categoryName = c => lang === 'ar' ? categoriesAr[c] || c : c;
  const icons = {
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>', 'arrow-up':'<path d="m6 18 12-12M6 6h12v12"/>', menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>', pause:'<path d="M8 5v14M16 5v14"/>', play:'<path d="m8 5 11 7-11 7V5Z"/>', globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/>', code:'<path d="m7 7-5 5 5 5m10-10 5 5-5 5m-4-13-2 16"/>', puzzle:'<path d="M4 4h5a3 3 0 1 1 6 0h5v6a3 3 0 1 0 0 6v4h-6a3 3 0 1 0-6 0H4v-6a3 3 0 1 0 0-6V4Z"/>', growth:'<path d="M5 19v-5M10 19V9M15 19V5M20 19V2"/>', bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>', search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>', phone:'<path d="m7 3 3 4-2 3c1 3 3 5 6 6l3-2 4 3c0 3-2 5-5 4C9 19 5 15 3 8 2 5 4 3 7 3Z"/>', whatsapp:'<path d="M5 18 3 22l5-2a10 10 0 1 0-3-2Z"/><path d="m8 7 2 3-1 1 4 4 1-1 3 1c-1 5-11-2-10-6Z"/>', linkedin:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.1M11 17v-7m0 3c0-4 6-4 6 0v4"/>', facebook:'<path d="M14 21v-9h3l1-4h-4V6c0-1 1-2 2-2h2V1h-3c-4 0-6 2-6 5v2H6v4h3v9"/>', lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>', check:'<path d="m5 12 4 4L19 6"/>', bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>', copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
  function hydrateIcons(scope = root) { scope.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  function hydrateAssets(scope = root) { scope.querySelectorAll('[data-asset]').forEach(el => { el.src = asset(el.dataset.asset); }); }
  const logo = (b, className = '') => b.logo && asset(b.logo) ? `<img src="${esc(asset(b.logo))}" alt="${esc(b.name)}" class="${className}" decoding="async" loading="lazy" draggable="false"/>` : `<span class="logo-name">${esc(b.name)}</span>`;
  const services = [
    { id:'themes', icon:'code', title:['Custom Shopify\nthemes','تطوير قوالب\nShopify'], short:['Unique, scalable and made for your brand.','قوالب مخصصة تناسب هوية البراند.'], lead:['A storefront that feels like your brand, not a template with a different logo. I turn your design direction into a considered Shopify experience.','متجر يعكس هوية البراند، مش قالب بنغيّر فيه اللوجو. بحوّل التصميم لتجربة Shopify مدروسة ومتكاملة.'], inclusions:[['Figma-to-Shopify implementation','تنفيذ تصميم Figma على Shopify'],['Custom Liquid templates','قوالب Liquid مخصصة'],['Mobile-first layouts','تصميم مناسب للموبايل'],['Editable theme settings','إعدادات سهلة لتعديل القالب']] },
    { id:'sections', icon:'puzzle', title:['Shopify sections\n& features','أقسام Shopify\nومميزات مخصصة'], short:['The right functionality. Without the clutter.','الوظائف اللي متجرك محتاجها فعلًا.'], lead:['Flexible, reusable sections that make your store work better — from a distinctive landing page to dynamic content powered by metafields.','أقسام مرنة وقابلة لإعادة الاستخدام — من صفحات الهبوط المخصصة للمحتوى الديناميكي باستخدام Metafields.'], inclusions:[['Custom storefront sections','أقسام مخصصة للمتجر'],['Metafields & dynamic content','Metafields ومحتوى ديناميكي'],['Product and collection layouts','صفحات منتجات ومجموعات'],['Practical merchant controls','تحكم سهل لصاحب المتجر']] },
    { id:'ux', icon:'growth', title:['Conversion-focused\nUX','تجربة مستخدم\nتسهّل الشراء'], short:['Clearer journeys. More considered details.','رحلة شراء أوضح وتفاصيل مدروسة.'], lead:['Every click should have a purpose. I focus on clear product discovery, readable content, accessible controls and a more coherent path through the store.','كل خطوة ليها هدف. بركّز على سهولة الوصول للمنتجات، ووضوح المحتوى، وتنقّل مترابط يخلي التسوّق أبسط.'], inclusions:[['Navigation & collection structure','تنظيم القوائم والمجموعات'],['Product-page clarity','وضوح صفحات المنتجات'],['Accessible interactions','تفاعل سهل الوصول'],['Consistent mobile experience','تجربة موبايل متناسقة']] },
    { id:'speed', icon:'bolt', title:['Speed\noptimization','تحسين سرعة\nالمتجر'], short:['Lighter pages. Smoother experiences.','صفحات أخف وتجربة أسرع.'], lead:['Performance starts with the details: image delivery, unnecessary scripts, loading behavior and the way a theme is built. Improvements are measured, not promised as made-up scores.','السرعة بتبدأ بالتفاصيل: أحجام الصور، والسكربتات الزائدة، وطريقة التحميل، وبناء القالب. التحسين بيتقاس، مش أرقام بنوعد بيها من غير اختبار.'], inclusions:[['Theme performance review','مراجعة أداء القالب'],['Responsive image delivery','صور مناسبة لحجم الشاشة'],['Script & asset cleanup','تنظيم السكربتات والملفات'],['Loading and layout stability','تحسين التحميل وثبات الصفحة']] },
    { id:'rtl', icon:'globe', title:['RTL / Arabic\nsupport','دعم العربية\nواتجاه RTL'], short:['Beautiful experiences in both directions.','تجربة متكاملة باللغتين والاتجاهين.'], lead:['Arabic is more than a flipped layout. I consider reading direction, typography, navigation, mixed-language content and the details that make a bilingual storefront feel natural.','العربية مش مجرد قلب اتجاه الصفحة. باهتم بالخطوط، والتنقّل، والمحتوى المختلط، والتفاصيل اللي تخلي المتجر طبيعي في اللغتين.'], inclusions:[['Arabic storefront layouts','تصميم واجهات عربية'],['RTL-aware components','مكونات تدعم RTL'],['Mixed-language content','محتوى عربي وإنجليزي'],['Desktop & mobile testing','اختبار الكمبيوتر والموبايل']] }
  ];
  const selectedIDs = ['scents-boutique','mema-outlet','tashkeel'];
  const projectData = {
    'scents-boutique': { theme:'scents', label:['BEAUTY & FRAGRANCE','الجمال والعطور'], brief:['Custom Liquid, landing pages and responsive storefront details.','أقسام Liquid وصفحات هبوط وتجربة متناسقة على الموبايل.'], tags:['Custom Liquid','Landing pages','Responsive UI'] },
    'mema-outlet': { theme:'mema', label:['FASHION & RETAIL','الأزياء والتجزئة'], brief:['Design-led Shopify customization, from Figma to the storefront.','تخصيص Shopify وتنفيذ التصميم من Figma للمتجر.'], tags:['Figma to Shopify','Theme customization','Storefront UI'] },
    'tashkeel': { theme:'tashkeel', label:['BOOKS & PUBLISHING','الكتب والنشر'], brief:['Custom templates, dynamic metafields and an Arabic experience.','قوالب مخصصة وMetafields ديناميكية وتجربة عربية.'], tags:['Custom templates','Metafields','Arabic / RTL'] }
  };
  function brandArt(b) {
    const lg = logo(b), theme = projectData[b.id]?.theme || 'general';
    const art = {
      scents:`<div class="scents-window"></div><div class="scent-leaf"></div><div class="scents-plinth"></div><div class="scents-bottle">${lg}</div>`,
      mema:`<div class="mema-drape"></div><div class="mema-bag">${lg}</div>`,
      tashkeel:`<div class="book-surface"></div><div class="brand-book book-back"></div><div class="brand-book">${lg}<span>One more<br>chapter.</span></div>`,
      general:lg
    };
    return `<div class="project-art art-${theme}" aria-hidden="true">${art[theme]}</div>`;
  }
  function renderProjects() {
    const rank=b=>{const i=selectedIDs.indexOf(b.id);return i<0?99:i;};
    const chosen=[...publicBrands].sort((a,b)=>(Date.parse(b.created_at||0)||0)-(Date.parse(a.created_at||0)||0)||rank(a)-rank(b)||(a.position??0)-(b.position??0)).slice(0,10);
    const L=lang==='ar'?1:0;
    const cards=chosen.map((b,i)=>{
      const p=projectData[b.id];
      const label=p?p.label[L]:(b.meta||b.category||'Shopify');
      const brief=p?p.brief[L]:(b.headline||b.description||'');
      return `<button class="project-card" type="button" data-project="${esc(b.id)}" aria-label="${esc(words('View project: ','استعرض: ') + b.name)}">${brandArt(b)}<span class="art-counter">${String(i+1).padStart(2,'0')}</span><span class="art-note">BRAND PRESENTATION</span><span class="project-card-content"><small>${esc(label)}</small><strong>${esc(b.name)}</strong><p>${esc(brief)}</p><span class="project-card-bottom"><i>${icon('arrow')}</i><span>${words('Explore the project','استعرض المشروع')}</span></span></span></button>`;
    }).join('');
    const more=`<button class="project-card project-more" type="button" data-open="directory"><span class="project-more-inner"><small>${words('Browse by industry','تصفح حسب المجال')}</small><strong>${words('See more work','شاهد المزيد من الأعمال')}</strong><p>${words(publicBrands.length+' brands in the full archive','‏'+publicBrands.length+' براند في الأرشيف الكامل')}</p><i class="round-outline">${icon('arrow')}</i></span></button>`;
    $('#selected-work').innerHTML = chosen.length ? cards+more : `<p class="dialog-lead">${words('Featured projects are not available right now. Browse the brand archive.','الأعمال المختارة غير متاحة حاليًا. استعرض أرشيف البراندات.')}</p>`;
  }
  function renderIndustries() {
    const el=$('#industry-strip');if(!el)return;
    const cats=['Fashion','Beauty','Food','Books','Technology','Lifestyle','Other'].map(c=>[c,publicBrands.filter(b=>b.category===c).length]).filter(([,n])=>n>0);
    const ni={Fashion:'<path d="M9 3 4 6l2 4 2-1v12h8V9l2 1 2-4-5-3a3 3 0 0 1-6 0Z"/>',Beauty:'<path d="M10 2h4v4h-4zM8 6h8l1 3v12H7V9z"/><path d="M7 13h10"/>',Food:'<path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',Books:'<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',Technology:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',Lifestyle:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11Z"/>',Other:'<path d="M12 3 3 8l9 5 9-5zM3 13l9 5 9-5"/>'};
    const nicon=c=>`<svg class="industry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ni[c]||ni.Other}</svg>`;
    el.innerHTML=cats.length?`<p class="industry-label">${words('Browse by industry','تصفّح حسب المجال')}</p><div class="industry-chips">${cats.map(([c,n])=>`<button type="button" class="industry-chip" data-open="directory" data-filter="${c}">${nicon(c)}<span>${esc(categoryName(c))}</span><b>${String(n).padStart(2,'0')}</b></button>`).join('')}</div>`:'';
  }
  function renderServices() {
    $('#expertise-cards').innerHTML = services.map(s => `<article class="expertise-card"><span class="service-icon">${icon(s.icon)}</span><strong>${esc(s.title[lang==='ar'?1:0])}</strong><p>${esc(s.short[lang==='ar'?1:0])}</p></article>`).join('');
  }
  function renderRails() {
    const priority = ['deja','kayan-international-plus','scents-boutique','mema-outlet','tashkeel','nawah','ctrl-cairo','avens-cosmetics','elle-perfume','aghsan','dawen','qayro'];
    const ordered = [...priority.map(id => publicBrands.find(b => b.id === id)).filter(Boolean), ...publicBrands.filter(b => !priority.includes(b.id))];
    const groups = [[],[],[]]; ordered.forEach((b,i) => groups[i%3].push(b));
    const labels = ['BUILT WITH\nINTENTION','CRAFTED FOR\nCOMMERCE','EVERY BRAND.\nITS OWN STORY.'];
    $('#brand-rails').innerHTML = groups.map((items,i) => {
      if (!items.length) return `<div class="brand-rail"><div class="rail-label"><span>${esc(labels[i])}</span></div><div class="rail-viewport"><span class="rail-logo">${words('Your next chapter','خطوتك الجاية')}</span></div></div>`;
      // Fill enough width for a continuous loop even with a small newly created catalog.
      const repeat = Math.max(1, Math.ceil(10/items.length));
      const group = Array.from({length:repeat},()=>items).flat();
      const html = duplicate => `<div class="rail-group" ${duplicate?'aria-hidden="true"':''}>${group.map((b,n) => `<button class="rail-logo ${b.url?'has-link':''} ${!b.originalLogo?'new-logo':''}" type="button" data-project="${esc(b.id)}" data-brand-id="${esc(b.id)}" ${duplicate || n>=items.length?'tabindex="-1"':''} aria-label="${esc(words('Explore ','استعرض ') + b.name)}">${logo(b)}</button>`).join('')}</div>`;
      return `<div class="brand-rail"><div class="rail-label"><span>${esc(labels[i])}</span>${icon('arrow')}</div><div class="rail-viewport" data-rail="${i}" aria-label="${esc(words('Brand collection row ','صف البراندات ')+(i+1))}">${html(false)}${html(true)}</div></div>`;
    }).join('');
    rails = $$('.rail-viewport[data-rail]').map((el,i) => {
      const state = {el,dir:i===1?-1:1,speed:[25,31,22][i],hover:false,focus:false,hold:0,drag:false,moved:false,start:0,scroll:0,cycle:0,phase:0};
      on(el,'pointerenter',e=>{ if (e.pointerType === 'mouse') state.hover=true; });
      on(el,'pointerleave',()=>{state.hover=false;});
      on(el,'focusin',e=>{state.focus=true;state.hold=performance.now()+500;e.target.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});});
      on(el,'focusout',()=>{later(()=>{state.focus=el.contains(document.activeElement);},0);});
      on(el,'pointerdown',e=>{state.hold=performance.now()+8000;state.drag=true;state.moved=false;state.start=e.clientX;state.scroll=el.scrollLeft;});
      on(el,'pointermove',e=>{if(!state.drag||e.pointerType!=='mouse')return;const delta=e.clientX-state.start;if(Math.abs(delta)>6){state.moved=true;el.scrollLeft=state.scroll-delta;closeSuppressUntil=performance.now()+500;e.preventDefault();}});
      on(window,'pointerup',()=>{if(state.drag){state.drag=false;state.hold=performance.now()+1800;}});
      on(el,'wheel',()=>{state.hold=performance.now()+2800;},{passive:true});
      return state;
    });
    updateCycles();
  }
  function updateCycles() { rails.forEach(r => { r.cycle=r.el.querySelector('.rail-group')?.scrollWidth || 0; if(r.dir<0 && r.el.scrollLeft<2) r.el.scrollLeft=r.cycle; r.phase=r.el.scrollLeft; }); }
  function showToast(text) { const el=$('#toast'); el.textContent=text;el.classList.add('visible');if(toastTimer)clearTimeout(toastTimer);toastTimer=later(()=>el.classList.remove('visible'),3400); }
  function translate() {
    document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';if(lang==='ar')ensureThmanyahFont();
    $$('[data-en]').forEach(el=>{el.textContent=String(el.dataset[lang]||el.dataset.en).replace(/\\n/g,'\n');});
    $$('[data-placeholder-en]').forEach(el=>{el.setAttribute('placeholder',String(el.dataset[lang==='ar'?'placeholderAr':'placeholderEn']||''));});
    const switcher=$('#language-switch');switcher.textContent=lang==='ar'?'EN':'عربي';switcher.setAttribute('aria-label',words('Switch to Arabic','Switch to English'));
    $('#hero-brand-count').textContent=String(publicBrands.length);$('#ribbon-count').textContent=String(publicBrands.length);
    document.title=words('Mahmoud Mehana — Shopify Developer','محمود مهنا — مطوّر Shopify');
    renderServices();renderProjects();renderIndustries();renderRails();hydrateIcons();updateMotionUI();
    if(activeDialog){renderDialog(activeDialog);}
  }
  function updateMotionUI() {
    const off=motionOff||media.matches;root.classList.toggle('motion-off',off);
    const label=words(off?'Resume animation':'Pause animation',off?'تشغيل الحركة':'إيقاف الحركة');
    const button=$('#motion-switch');button.innerHTML=icon(off?'play':'pause');button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(off));button.title=label;
    const paused=railsPaused||off;$('#marquee-pause').innerHTML=`<span>${icon(paused?'play':'pause')}</span><span>${words(paused?'Resume motion':'Pause motion',paused?'تشغيل الحركة':'إيقاف الحركة')}</span>`;
    $('#marquee-pause').setAttribute('aria-label',words(paused?'Resume logo marquees':'Pause logo marquees',paused?'تشغيل شرائط اللوجوهات':'إيقاف شرائط اللوجوهات'));$('#marquee-pause').setAttribute('aria-pressed',String(paused));
    if(off && sceneReady)scene?.render(time,0,0);
  }
  function toggleMotion() { if(media.matches){showToast(words('Reduced motion is enabled in your device settings.','تقليل الحركة مفعّل في إعدادات جهازك.'));return;}motionOff=!motionOff;storage.set('mm-motion',motionOff?'off':'on');updateMotionUI(); }
  function closeMenu() { $('#mobile-navigation').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').innerHTML=icon('menu'); }
  const normalized = v => String(v).normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي');
  function renderDirectory() {
    const cats=['All','Fashion','Beauty','Food','Books','Technology','Lifestyle','Other'].filter(c=>c==='All'||publicBrands.some(b=>b.category===c));
    $('#dialog-content').innerHTML=`<section class="dialog-body"><p class="dialog-eyebrow">THE BRAND ARCHIVE / ${String(publicBrands.length).padStart(2,'0')}</p><h2 id="dialog-title">${words('Different brands.\nOne attention to detail.','براندات مختلفة.\nنفس الاهتمام بالتفاصيل.')}</h2><p class="dialog-lead">${words('Explore the brands in my Shopify work archive. Store links appear only where they have been enabled.','استعرض البراندات اللي اشتغلت على متاجرها. روابط الزيارة بتظهر للمتاجر المفعّلة فقط.')}</p><div class="directory-toolbar"><label class="directory-search">${icon('search')}<input id="directory-query" type="search" maxlength="100" placeholder="${words('Search a brand…','ابحث عن براند…')}" aria-label="${words('Search brands','البحث في البراندات')}" value="${esc(query)}"/></label><label class="live-filter"><input id="directory-live" type="checkbox" ${liveOnly?'checked':''}/>${words('Enabled store links only','روابط المتاجر المفعّلة فقط')}</label></div><div class="directory-categories" role="group" aria-label="${words('Filter by sector','فلترة حسب القطاع')}">${cats.map(c=>`<button type="button" data-filter="${c}" class="${category===c?'active':''}" aria-pressed="${category===c}">${esc(categoryName(c))}</button>`).join('')}</div><div class="directory-meta"><span id="directory-count" role="status" aria-live="polite"></span><span>${words('Logos without links remain in the archive.','البراندات بدون روابط بتفضل موجودة في الأرشيف.')}</span></div><div class="directory-grid" id="directory-grid"></div><p class="directory-empty" id="directory-empty" hidden>${words('No matching brands. Try another name or filter.','مفيش نتائج مطابقة. جرّب اسم أو فلتر تاني.')}</p><button class="directory-load-more" id="directory-more" type="button">${words('Show more brands','اعرض براندات أكتر')}</button></section>`;
    renderDirectoryCards();
    on($('#directory-query'),'input',e=>{query=e.target.value;limit=24;renderDirectoryCards();});
    on($('#directory-live'),'change',e=>{liveOnly=e.target.checked;limit=24;renderDirectoryCards();});
    on($('#directory-more'),'click',()=>{limit+=24;renderDirectoryCards();});
  }
  function renderDirectoryCards() {
    const filtered=publicBrands.filter(b=>(category==='All'||b.category===category)&&(!liveOnly||b.url)&&normalized(b.name).includes(normalized(query.trim())));
    $('#directory-grid').innerHTML=filtered.slice(0,limit).map(b=>`<button class="directory-card ${!b.originalLogo?'new-logo':''}" type="button" data-project="${esc(b.id)}" aria-label="${esc(words('Explore ','استعرض ')+b.name)}"><div>${logo(b)}</div><footer><span>${esc(b.name)}</span>${b.url?icon('arrow-up'):`<small>${words('Archive','أرشيف')}</small>`}</footer></button>`).join('');
    $('#directory-count').textContent=words(`${filtered.length} brands · ${Math.min(limit,filtered.length)} shown`,`${filtered.length} براند · المعروض ${Math.min(limit,filtered.length)}`);
    $('#directory-empty').hidden=filtered.length!==0;$('#directory-more').hidden=filtered.length<=limit;
    $$('#dialog-content [data-filter]').forEach(el=>{el.classList.toggle('active',el.dataset.filter===category);el.setAttribute('aria-pressed',String(el.dataset.filter===category));});
  }
  function renderProject(id) {
    const b=publicBrands.find(b=>b.id===id);if(!b){renderDirectory();return;}
    const p=projectData[id];const tags=p?.tags||['Shopify',b.category||'Storefront'];
    const description=p?p.brief[lang==='ar'?1:0]:words('A brand in my Shopify work archive. Explore the current store using the enabled link below.','براند من أرشيف شغلي على Shopify. تقدر تستكشف المتجر الحالي من رابط الزيارة لما يكون مفعّل.');
    $('#dialog-content').innerHTML=`<section class="dialog-body"><div class="project-dialog-hero">${brandArt(b)}<div class="project-dialog-heading"><span>${esc(categoryName(b.category||'Other').toUpperCase())} / SHOPIFY</span><h2 id="dialog-title">${esc(b.name)}</h2><small>${words('A brand in my work archive.','براند من أرشيف أعمالي.')}</small></div></div><p class="dialog-lead">${esc(description)}</p><div class="tag-list">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="project-details-actions">${b.url?`<a class="pill pill-dark" href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${words('Visit the store','زيارة المتجر')}${icon('arrow-up')}</a>`:`<span class="pill pill-outline">${words('No enabled store link','مفيش رابط متجر مفعّل')}</span>`}<button class="pill pill-outline" type="button" data-open="contact">${words('Have a similar project?','عندك مشروع مشابه؟')}${icon('arrow')}</button><button class="pill pill-outline" type="button" data-open="directory">${words('All brands','كل البراندات')}</button></div><p class="source-note">${words('The visual is a brand presentation, not a screenshot of the live website. Project scope varies and some work was collaborative. Current storefront content may have changed since delivery.','الغلاف عرض بصري للبراند، مش لقطة فعلية للموقع. نطاق العمل بيختلف من مشروع للتاني، وبعض الأعمال اتنفّذت بالتعاون مع فرق. محتوى المتجر الحالي ممكن يكون اتغير بعد التسليم.')}</p></section>`;
  }
  function renderAbout() {
    $('#dialog-content').innerHTML=`<section class="dialog-body about-grid"><div class="about-portrait"><img src="${esc(asset('images/mahmoud-mehana.webp'))}" alt="Mahmoud Mehana"/></div><div><p class="dialog-eyebrow">MAHMOUD MEHANA / SHOPIFY DEVELOPER</p><h2 id="dialog-title">${words('The person\nbehind the details.','الشخص اللي\nورا التفاصيل.')}</h2><p>${words('I work at the intersection of design and Shopify development — turning visual direction into storefronts that feel clear, considered and true to the brand.','شغلي بيجمع بين التصميم وتطوير Shopify — بحوّل الفكرة البصرية لمتجر واضح ومدروس وبيعكس هوية البراند.')}</p><p>${words('From custom Liquid and dynamic templates to Arabic layouts and mobile refinements, I care about how the whole experience comes together. Some projects were delivered collaboratively.','من أقسام Liquid والقوالب الديناميكية لواجهات عربية وتفاصيل الموبايل، بهتم بالتجربة كلها مش جزء منها. بعض المشاريع اتنفّذت بالتعاون مع فرق عمل.')}</p><div class="about-stack"><span>Shopify</span><span>Liquid</span><span>Figma → Code</span><span>JavaScript</span><span>Arabic / RTL</span><span>Responsive UI</span></div><div class="project-details-actions"><button class="pill pill-dark" type="button" data-open="contact">${words('Let’s make something good','نعمل حاجة مختلفة سوا')}${icon('arrow')}</button></div></div></section>`;
  }
  function submitProjectEnquiry(form) {
    if(!form?.reportValidity())return;
    const fields=new FormData(form);
    const message=words(`Hi Mahmoud! I’m ${fields.get('name')}.\nI’m interested in: ${fields.get('service')}.\n\n${fields.get('message')}`,`أهلًا محمود! أنا ${fields.get('name')}.\nمحتاج: ${fields.get('service')}.\n\n${fields.get('message')}`);
    const url=`https://wa.me/${contacts.saudi}?text=${encodeURIComponent(message)}`;
    const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.click();
    showToast(words('Review and send your message in WhatsApp.','راجع رسالتك وابعتها من واتساب.'));
  }
  on($('#project-enquiry'),'submit',e=>{e.preventDefault();submitProjectEnquiry(e.currentTarget);});
  function renderContact() {
    $('#dialog-content').innerHTML=`<section class="dialog-body contact-grid"><div><p class="contact-kicker">LET’S BUILD WHAT’S NEXT.</p><h2 id="dialog-title">${words('Good things\nstart with a\nconversation.','كل شغل مميز\nبيبدأ بكلام.')}</h2><p class="dialog-lead">${words('A new store, a thoughtful redesign, or a feature you can’t stop thinking about. Tell me what you have in mind.','متجر جديد، إعادة تصميم، أو ميزة بتفكّر تضيفها. احكي لي إيه اللي في بالك.')}</p><div class="contact-links"><a class="contact-link" href="mailto:${contacts.email}">${icon('mail')}<span><small>EMAIL</small><strong>${contacts.email}</strong></span>${icon('arrow-up')}</a><a class="contact-link" href="https://wa.me/${contacts.saudi}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}<span><small>${words('SAUDI ARABIA · WHATSAPP','السعودية · واتساب')}</small><strong>+966 50 943 5879</strong></span>${icon('arrow-up')}</a><a class="contact-link" href="https://wa.me/${contacts.egypt}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}<span><small>${words('EGYPT · WHATSAPP','مصر · واتساب')}</small><strong>+20 102 060 0306</strong></span>${icon('arrow-up')}</a></div><div class="project-details-actions"><a class="pill pill-outline" href="tel:+${contacts.saudi}">${icon('phone')}${words('Call Saudi number','اتصال بالرقم السعودي')}</a><a class="pill pill-outline" href="tel:+${contacts.egypt}">${icon('phone')}${words('Call Egypt number','اتصال بالرقم المصري')}</a></div></div><form class="contact-form" id="project-enquiry"><h3>${words('A little about your project.','نبذة عن مشروعك.')}</h3><label>${words('Your name','اسمك')}<input name="name" required maxlength="100" autocomplete="name" placeholder="${words('What should I call you?','أقدر أناديك بإيه؟')}"/></label><label>${words('What do you need?','محتاج إيه؟')}<select name="service"><option>${words('A new Shopify store','متجر Shopify جديد')}</option><option>${words('A store redesign','إعادة تصميم متجر')}</option><option>${words('Custom sections & features','أقسام ومميزات مخصصة')}</option><option>${words('Performance / Arabic / something else','سرعة / عربية / حاجة تانية')}</option></select></label><label>${words('Your idea','فكرتك')}<textarea name="message" required maxlength="2000" rows="4" placeholder="${words('The brand, the challenge, and what a great result looks like.','البراند، المطلوب، وإيه النتيجة اللي نفسك توصل لها.')}" spellcheck="true"></textarea></label><button class="pill pill-dark" type="submit"><span>${words('Continue in WhatsApp','نكمل على واتساب')}</span>${icon('arrow-up')}</button><p>${words('This opens a prepared WhatsApp message. You review and send it yourself. Nothing is submitted to a hidden inbox.','هيفتح لك رسالة جاهزة في واتساب. بتراجعها وتبعتها بنفسك؛ مفيش إرسال تلقائي أو فورم بيتظاهر إنه بعت رسالة.')}</p></form></section>`;
    on($('#project-enquiry'),'submit',e=>{e.preventDefault();submitProjectEnquiry(e.currentTarget);});
  }
  function renderDialog(type) {
    if(type==='directory')renderDirectory();else if(type==='contact')renderContact();else if(type==='about')renderAbout();else if(type.startsWith('project:'))renderProject(type.slice(8));
    hydrateIcons($('#site-dialog'));
  }
  function openDialog(type) {
    closeMenu();const d=$('#site-dialog');
    if(type==='contact'){
      const section=$('#contact');if(!section)return;
      const go=()=>section.scrollIntoView({behavior:(motionOff||media.matches)?'auto':'smooth',block:'start'});
      if(d.open){d.close();later(go,0);}else go();
      return;
    }
    if(!d.open){beforeFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
    activeDialog=type;renderDialog(type);if(!d.open)d.showModal();d.scrollTop=0;$('#dialog-close').focus({preventScroll:true});
  }
  on($('#dialog-close'),'click',()=>$('#site-dialog').close());
  on($('#site-dialog'),'click',e=>{if(e.target===$('#site-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  on($('#site-dialog'),'close',()=>{activeDialog='';document.body.style.overflow=previousOverflow;beforeFocus?.focus?.({preventScroll:true});});
  on(root,'click',e=>{
    const target=e.target.closest('button,a');if(!target)return;
    if(target.closest('.rail-viewport')&&performance.now()<closeSuppressUntil){e.preventDefault();return;}
    if(target.dataset.open){e.preventDefault();openDialog(target.dataset.open);}
    if(target.dataset.workNav){const w=$('#selected-work'),c=w.firstElementChild;const dir=document.documentElement.dir==='rtl'?-1:1;w.scrollBy({left:(c?c.offsetWidth+16:300)*Number(target.dataset.workNav)*dir,behavior:'smooth'});return;}
    if(target.dataset.project){e.preventDefault();openDialog('project:'+target.dataset.project);}
    if(target.dataset.filter){category=target.dataset.filter;limit=24;renderDirectoryCards();}
    if(target.matches('.mobile-navigation a'))closeMenu();
    if(target=== $('#language-switch')){lang=lang==='ar'?'en':'ar';storage.set('mm-language',lang);translate();}
  });
  on($('#menu-toggle'),'click',()=>{const open=$('#mobile-navigation').hidden;$('#mobile-navigation').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').innerHTML=icon(open?'close':'menu');});
  on(document,'keydown',e=>{if(e.key==='Escape')closeMenu();});
  on(document,'click',e=>{const path=e.composedPath();if(!path.includes($('#mobile-navigation'))&&!path.includes($('#menu-toggle')))closeMenu();});
  on($('#motion-switch'),'click',toggleMotion);
  on($('#marquee-pause'),'click',()=>{if(media.matches){showToast(words('Your device requests reduced motion.','جهازك مفعّل فيه تقليل الحركة.'));return;}if(motionOff){motionOff=false;storage.set('mm-motion','on');railsPaused=false;}else railsPaused=!railsPaused;updateMotionUI();});
  on(media,'change',()=>{motionOff=media.matches||storage.get('mm-motion')==='off';updateMotionUI();});
  on(window,'resize',()=>{updateCycles();navDirty=true;scene?.resize?.();},{passive:true});
  on(window,'scroll',()=>{navDirty=true;},{passive:true});
  on(document,'visibilitychange',()=>{last=0;});
  on($('#hero-visual'),'pointermove',e=>{if(!fine.matches||motionOff||media.matches)return;const r=e.currentTarget.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*2;ty=((e.clientY-r.top)/r.height-.5)*2;},{passive:true});
  on($('#hero-visual'),'pointerleave',()=>{tx=0;ty=0;});
  // Scene lifecycle: draw once when reduced motion is enabled, animate only in view.
  async function startScene() {
    if(sceneStarting||sceneReady||disposed)return;sceneStarting=true;
    if(options.loadThree){try {const T=await options.loadThree();if(!disposed)scene=createThreeScene(T,$('#planet-canvas'));} catch { /* Native WebGL is a production fallback, not a missing image. */ }}
    if(!scene&&!disposed){try{scene=createNativeScene($('#planet-canvas'));}catch{scene=null;}}
    sceneReady=!!scene;
    if(sceneReady&&!disposed){$('.planet-wrap').classList.add('webgl-ready');scene.render(0,0,0);}
    if(disposed)scene?.dispose();
  }
  function createThreeScene(T, canvas) {
    let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch{return null;}
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0,0);const space=new T.Scene();const camera=new T.PerspectiveCamera(32,1,.1,10);camera.position.z=3.9;
    const geometry=new T.SphereGeometry(1,64,48),pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const v=new T.Vector3().fromBufferAttribute(pos,i);const n=Math.sin(v.x*27+v.y*19)*Math.cos(v.z*24-v.x*8)*.01+Math.sin(v.y*49+v.z*31)*.006;v.multiplyScalar(1+n);pos.setXYZ(i,v.x,v.y,v.z);}geometry.computeVertexNormals();
    const material=new T.MeshStandardMaterial({color:0x525b43,metalness:.66,roughness:.48});const sphere=new T.Mesh(geometry,material);const group=new T.Group();group.add(sphere);const wireGeometry=new T.WireframeGeometry(geometry);const wireMaterial=new T.LineBasicMaterial({color:0xa2ae80,transparent:true,opacity:.10});group.add(new T.LineSegments(wireGeometry,wireMaterial));space.add(group);space.add(new T.AmbientLight(0xafb6a0,.5));const light=new T.DirectionalLight(0xf6ffdb,4);light.position.set(-2,3,3);space.add(light);
    const resize=()=>{const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);};resize();
    const lost=()=>$('.planet-wrap')?.classList.remove('webgl-ready');canvas.addEventListener('webglcontextlost',lost);
    return {kind:'three',resize,render(t,px,py){group.rotation.y=t*.065+px*.12;group.rotation.x=.15+py*.10;renderer.render(space,camera);},dispose(){canvas.removeEventListener('webglcontextlost',lost);geometry.dispose();wireGeometry.dispose();material.dispose();wireMaterial.dispose();renderer.dispose();}};
  }
  function createNativeScene(canvas) {
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power',premultipliedAlpha:false});if(!gl)return null;
    const vert=`attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}`;
    const frag=`precision highp float;varying vec2 uv;uniform float time;uniform vec2 pointer;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      void main(){vec2 q=uv*1.045;float r=dot(q,q);if(r>1.)discard;vec3 n=vec3(q,sqrt(1.-r));float a=time*.055+pointer.x*.12;mat3 rot=mat3(cos(a),0.,sin(a),0.,1.,0.,-sin(a),0.,cos(a));vec3 v=rot*n;float h=noise(v*11.)*.55+noise(v*33.)*.3+noise(v*87.)*.15;float veins=smoothstep(.485,.499,h)-smoothstep(.501,.515,h);float t=noise(v*145.);float diffuse=max(0.,dot(normalize(n+vec3(h*.05)),normalize(vec3(-.55,.8,1.))));float rim=pow(1.-n.z,3.);vec3 c=vec3(.12,.135,.095)*(diffuse*.7+.15)+vec3(.24,.27,.20)*h*diffuse; c+=veins*.20*diffuse+t*.027; c+=rim*vec3(.29,.34,.20)*diffuse;float shine=pow(max(dot(n,normalize(vec3(-.4,.55,1.))),0.),30.);c+=shine*.07;gl_FragColor=vec4(c,(1.-smoothstep(.975,1.,r)));}`;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Scene shader unavailable');}return s;}
    const vs=shader(gl.VERTEX_SHADER,vert),fs=shader(gl.FRAGMENT_SHADER,frag),program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Scene linking failed');
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const location=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);const t=gl.getUniformLocation(program,'time'),pointer=gl.getUniformLocation(program,'pointer');
    const resize=()=>{const size=Math.min(600,Math.round((canvas.clientWidth||280)*Math.min(devicePixelRatio||1,1.5)));canvas.width=size;canvas.height=size;gl.viewport(0,0,size,size);};resize();let lost=false;
    const lose=()=>{lost=true;$('.planet-wrap')?.classList.remove('webgl-ready');};canvas.addEventListener('webglcontextlost',lose);
    return {kind:'native-webgl',resize,render(tm,px,py){if(lost)return;gl.useProgram(program);gl.uniform1f(t,tm);gl.uniform2f(pointer,px,py);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);},dispose(){canvas.removeEventListener('webglcontextlost',lose);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);}};
  }
  function animate(now) {
    if(disposed)return;frame=requestAnimationFrame(animate);const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(document.hidden)return;
    const off=motionOff||media.matches;
    if(!off&&!activeDialog){
      time+=dt;
      if(railsVisible&&!railsPaused) rails.forEach(r=>{if(r.hover||r.focus||r.drag||now<r.hold||!r.cycle){r.phase=r.el.scrollLeft;return;}r.phase+=r.speed*dt*r.dir;if(r.phase>=r.cycle)r.phase-=r.cycle;if(r.phase<0)r.phase+=r.cycle;r.el.scrollLeft=r.phase;});
      if(heroVisible){x+=(tx-x)*.055;y+=(ty-y)*.055;$('#hero-visual').style.setProperty('--px',x.toFixed(3));$('#hero-visual').style.setProperty('--py',y.toFixed(3));if(sceneReady)scene.render(time,x,y);}
    }
    if(navDirty){navDirty=false;const anchors=$$('.desktop-nav a');let chosen='#top';['brands','expertise','work'].forEach(id=>{if($('#'+id).getBoundingClientRect().top<innerHeight*.4)chosen='#'+id;});anchors.forEach(a=>a.classList.toggle('active',a.getAttribute('href')===chosen));}
  }
  hydrateAssets();translate();
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.target.id==='hero-visual')heroVisible=e.isIntersecting;if(e.target.id==='brands')railsVisible=e.isIntersecting;}),{rootMargin:'80px'});observer.observe($('#hero-visual'));observer.observe($('#brands'));cleanups.push(()=>observer.disconnect());}
  // Static layout is immediately visible; no fragile opacity-0 initial page.
  startScene();frame=requestAnimationFrame(animate);
  root.dataset.portfolioVersion='alloy-v4.1';root.dataset.catalogCount=String(publicBrands.length);
  return ()=>{disposed=true;cancelAnimationFrame(frame);scene?.dispose();cleanups.forEach(fn=>fn());timers.forEach(clearTimeout);root.classList.remove('motion-off');if($('#site-dialog')?.open){$('#site-dialog').close();document.body.style.overflow=previousOverflow;}};
}
