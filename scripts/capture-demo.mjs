import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const out=resolve(process.env.DEMO_OUTPUT || 'artifacts/animaciones') + sep;
await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const metrics=[];
for(const [name,width,height] of [['escritorio',1440,1000],['movil',390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',recordVideo:{dir:out,size:{width,height}}});
 const page=await context.newPage();const errors=[];const failed=[];
 page.on('response',r=>{if(r.status()>=400)failed.push(r.url())});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:4173/nuestro-primer-mes/');await page.getByRole("button",{name:"Saltar introducción"}).click();await page.evaluate(()=>document.fonts.ready);
 await page.locator('.gift-art').scrollIntoViewIfNeeded();
 await page.screenshot({path:out+name+'-regalo-0-inicio.png'});
 await page.getByRole('button',{name:'Abrir la caja de regalo',exact:true}).click();
 const start=Date.now();
 for(const [label,ms] of [['1-tapa',850],['2-capullos',1800],['3-floracion',2850],['4-final',5000]]){
  await page.waitForTimeout(Math.max(0,ms-(Date.now()-start)));
  await page.screenshot({path:out+name+'-regalo-'+label+'.png'});
 }
 await page.getByRole('button',{name:'Abrir mi carta de amor'}).scrollIntoViewIfNeeded();
 await page.waitForTimeout(950);await page.screenshot({path:out+name+'-carta-0-inicio.png'});
 await page.getByRole('button',{name:'Abrir mi carta de amor'}).click();const letterStart=Date.now();
 for(const [label,ms] of [['1-solapa',700],['2-hoja',1400],['3-despliegue',2050],['4-texto',3000],['5-final',4200]]){
  await page.waitForTimeout(Math.max(0,ms-(Date.now()-letterStart)));
  if(ms===2050) await page.locator('.letter-paper').evaluate(e=>window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY-150,behavior:'instant'}));
  await page.screenshot({path:out+name+'-carta-'+label+'.png'});
 }
 metrics.push({device:name,errors,failed,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 const video=page.video();await context.close();await video.saveAs(out+name+'-demostracion.webm');await video.delete();
}
await writeFile(out+'verificacion.json',JSON.stringify(metrics,null,2));console.log(metrics);await browser.close();

const sequences=[['regalo',['0-inicio','1-tapa','2-capullos','3-floracion','4-final']],['carta',['0-inicio','1-solapa','2-hoja','3-despliegue','4-texto','5-final']]];
const gallery=['escritorio','movil'].map(device=>`<section><h2>${device === 'movil' ? 'Celular · 390 × 844' : 'Escritorio · 1440 × 1000'}</h2><video controls preload="metadata" src="${device}-demostracion.webm"></video>${sequences.map(([kind,frames])=>`<h3>${kind}</h3><div class="frames">${frames.map(frame=>`<figure><a href="${device}-${kind}-${frame}.png"><img loading="lazy" src="${device}-${kind}-${frame}.png" alt="${kind}: ${frame}" /></a><figcaption>${frame.replace(/-/g,' ')}</figcaption></figure>`).join('')}</div>`).join('')}</section>`).join('');
await writeFile(out+'index.html',`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuestro primer mes · revisión de animaciones</title><style>body{margin:0;padding:32px;background:#fff9f6;color:#543a65;font:16px/1.6 system-ui}main{max-width:1400px;margin:auto}h1,h2{font-family:Georgia}video{max-width:100%;max-height:650px;background:#e9d5f5;border-radius:12px}.frames{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}figure{margin:0}img{width:100%;border:1px solid #e9d5f5}figcaption{font-size:14px}section{margin:50px 0}</style><main><h1>Nuestro primer mes</h1><p>Revisión de movimiento normal, con prefers-reduced-motion: no-preference. Capturas y grabaciones de la compilación local. Pulsa cada imagen para ampliarla.</p><p>Regalo: inicio, tapa 0,85 s, capullos 1,8 s, floración 2,85 s, final 5 s. Carta: inicio, solapa 0,7 s, hoja 1,4 s, despliegue 2,05 s, texto 3 s, final 4,2 s. Tiempos aproximados; la grabación incluye el desplazamiento para revisar la carta.</p>${gallery}</main></html>`);
