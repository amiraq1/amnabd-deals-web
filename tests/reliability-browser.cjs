// Optional local Playwright smoke test: synthetic API and clock, no live writes.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.AMN_PREVIEW_URL || 'http://127.0.0.1:4173';
const rows = [
  { id:'a', slug:'alpha', name_en:'Alpha', name_ar:'ألفا', category:{value:'coding'}, use_cases:['coding'], status:'active', ends_at:'2026-11-15T12:00:30Z', eligibility:{card_required:'not_required'}, review:{reviewed_on:'2026-10-17'} },
  { id:'b', slug:'beta', name_en:'Beta', name_ar:'بيتا', category:{value:'coding'}, use_cases:['writing'], status:'active', eligibility:{card_required:'required'}, review:{reviewed_on:'2026-10-16'} },
];
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args:['--no-sandbox'] });
 const logs=[];
 async function setup(width=1200) {
  const c=await browser.newContext({viewport:{width,height:900},timezoneId:'UTC'});
  await c.addInitScript(() => {window.__copied=[]; Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.__copied.push(text)},configurable:true})});
  await c.route('**/*', async r=>{const u=new URL(r.request().url()); if(u.hostname==='audit-fixture.supabase.co') {const v=u.pathname.endsWith('/deals')?rows:u.pathname.endsWith('/usage_guides')?[]:{id:'main',overview:{ar:{},en:{}},section_labels:{},last_reviewed:'2026-10-17'};return r.fulfill({contentType:'application/json',body:JSON.stringify(v)})}return u.hostname==='127.0.0.1'?r.continue():r.abort()});
  const p=await c.newPage(); p.setDefaultTimeout(6000); const errors=[]; p.on('pageerror',e=>errors.push(e.message)); return {c,p,errors};
 }
 async function run(name, fn, width) {const x=await setup(width); try {await fn(x.p); assert.deepEqual(x.errors,[]); logs.push('PASS '+name)} finally {await x.c.close()}}
 try {
  await run('share query and filters; skip anchor retains pending input',async p=>{
   await p.goto(base+'/?lang=en&use_case=coding'); await p.getByRole('searchbox',{name:'Search deals'}).waitFor();
   await p.getByRole('searchbox',{name:'Search deals'}).fill('Alpha');
   await p.evaluate(()=>location.hash='#main-content');
   await p.waitForTimeout(400);
   assert.equal(await p.getByRole('searchbox',{name:'Search deals'}).inputValue(),'Alpha');
   assert.equal(new URL(p.url()).searchParams.get('q'),'Alpha');
   assert.equal(new URL(p.url()).searchParams.get('use_case'),'coding');
   assert.equal(new URL(p.url()).hash, '#main-content');
   await p.getByRole('button',{name:'Share search'}).click();
   await p.waitForFunction(()=>window.__copied.length>0);
   const url=await p.evaluate(()=>window.__copied[0]); const u=new URL(url);
   assert.equal(u.searchParams.get('q'),'Alpha'); assert.equal(u.searchParams.get('use_case'),'coding');
   assert.equal(new URL(p.url()).hash, '#main-content'); assert.equal(u.hash, '');
   await p.goto(url); await p.getByRole('searchbox',{name:'Search deals'}).waitFor();
   await p.getByText('Alpha',{exact:true}).first().waitFor(); assert.equal(await p.getByText('Beta',{exact:true}).count(),0);
  });
  await run('saved filter disclosure and import preserves unavailable entries',async p=>{
   await p.goto(base+'/?lang=en'); await p.getByRole('searchbox',{name:'Search deals'}).waitFor();
   await p.getByRole('button',{name:/^Saved/}).click(); assert.equal(new URL(p.url()).searchParams.get('saved'),'1');
   await p.getByText(/Saved deals belong to this browser/i).first().waitFor();
   await p.goto(base+'/favorites?lang=en'); await p.getByText('Import and merge favorites').waitFor();
   await p.locator('input[type=file]').setInputFiles({name:'favorites.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,slugs:['alpha','missing-item']}))});
   await p.getByText('Saved items missing from the loaded catalog').waitFor();
   await p.getByText('missing-item',{exact:true}).waitFor();
   await p.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});
   await p.getByText(/Import failed/).waitFor(); await p.getByText('missing-item',{exact:true}).waitFor();
  });
  await run('favorites export is importable and rejects oversized legacy lists',async p=>{
   await p.goto(base+'/favorites?lang=en'); await p.getByText('Import and merge favorites').waitFor();
   await p.locator('input[type=file]').setInputFiles({name:'favorites.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,slugs:['alpha']}))});
   await p.getByText(/Added 1/).waitFor();
   const [download] = await Promise.all([p.waitForEvent('download'), p.getByRole('button',{name:'Export favorites'}).click()]);
   const content = JSON.parse(require('node:fs').readFileSync(await download.path(),'utf8'));
   assert.deepEqual(content, {version:1,slugs:['alpha']});
   await p.evaluate(() => localStorage.setItem('amnabd-favorites',JSON.stringify(Array.from({length:501},(_,i)=>`old-${i}`))));
   await p.reload(); await p.getByRole('button',{name:'Export favorites'}).click();
   await p.getByText(/Export failed/).waitFor();
   assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('amnabd-favorites')).length),501);
  });
  await run('focus follows a slowly loaded detail heading',async p=>{
   await p.goto(base+'/?lang=en'); await p.getByRole('searchbox',{name:'Search deals'}).waitFor();
   await p.route('**/assets/DealDetailPage-*.js',async r=>{await new Promise(resolve=>setTimeout(resolve,900)); await r.continue()});
   await p.getByRole('link',{name:'View details'}).first().click();
   const heading=p.locator('#main-content h1'); await heading.waitFor();
   await p.waitForFunction(()=>document.activeElement === document.querySelector('#main-content h1')); 
  });
  await run('late heading does not steal focus from the user',async p=>{
   await p.goto(base+'/?lang=en'); await p.getByRole('searchbox',{name:'Search deals'}).waitFor();
   await p.route('**/assets/DealDetailPage-*.js',async r=>{await new Promise(resolve=>setTimeout(resolve,1500)); await r.continue()});
   await p.getByRole('link',{name:'View details'}).first().evaluate(el => el.click());
   await p.waitForFunction(()=>document.activeElement?.id==='main-content');
   await p.locator('a[href="#main-content"]').focus();
   await p.locator('#main-content h1').waitFor(); await p.waitForTimeout(100);
   assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('href')),'#main-content');
  });
  await run('model filter persists and excludes partially verified entries',async p=>{
   await p.goto(base+'/free-ai-models-directory?lang=en&verified=1');
   await p.locator('details summary').first().click();
   await p.getByRole('checkbox',{name:'Officially verified information'}).waitFor();
   assert.equal(await p.getByRole('checkbox',{name:'Officially verified information'}).isChecked(),true);
   assert.equal(await p.locator('section[aria-labelledby=ai-model-results] article').count(),0);
   await p.reload(); await p.locator('details summary').first().click();
   await p.getByRole('checkbox',{name:'Officially verified information'}).waitFor();
   assert.equal(await p.getByRole('checkbox',{name:'Officially verified information'}).isChecked(),true);
  });
  await run('collection expires while left open',async p=>{
   await p.clock.install({time:new Date('2026-11-15T12:00:00Z')});
   await p.goto(base+'/coding?lang=en'); await p.getByText('Alpha',{exact:true}).first().waitFor();
   await p.clock.fastForward(61000); await p.getByText('Alpha',{exact:true}).first().waitFor({state:'hidden'});
   await p.getByText('Beta',{exact:true}).first().waitFor();
  });
  for (const lang of ['ar','en']) await run('mobile reflow '+lang,async p=>{
   await p.goto(base+'/?lang='+lang); await p.getByRole('searchbox').waitFor();
   await p.waitForTimeout(150);
   const perf=await p.evaluate(()=>({dcl:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd), fcp:Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0)}));
   logs.push('MEASURE local synthetic '+lang+' DCL='+perf.dcl+'ms FCP='+perf.fcp+'ms');
   const widths=await p.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]); assert.ok(widths[0]<=widths[1]+1,JSON.stringify(widths));
  },375);
  console.log(logs.join('\n'));
 } catch(e){console.error(logs.join('\n')); console.error(e); process.exitCode=1} finally {await browser.close()}
})();
