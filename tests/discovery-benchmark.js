import {ChapterSearch} from '../src/query/chapters.js';
import {renderExplorer} from '../src/ui/explorer.js';
import {defaultState} from '../src/state/state.js';
import {emptyContext} from '../src/state/empty.js';
const button=document.getElementById('run'),status=document.getElementById('status');
const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
button.onclick=async()=>{
 button.disabled=true;const report=[];document.getElementById('results').replaceChildren();
 try {for(const count of [10000,100000]){
  status.textContent='Preparing '+count+' synthetic chapter cards…';await frame();
  const rows=Array.from({length:count},(_,i)=>{
   const at=y=>({earliest:{year:y,month:1,day:1},latest:{year:y,month:12,day:31},precision:'year',qualifier:'exact'}),year=1000+i%900;
   return {id:'chapter:benchmark-'+i,kind:'chapter',labels:{de:'Synthetisches Kapitel '+i,en:'Synthetic chapter '+i},initialState:{camera:emptyContext.initialState.camera,time:{kind:'interval',start:at(year),end:at(year+1),endMeaning:'ended'},layers:['events']},discovery:{summary:{de:'Nur Belastungsprüfung',en:'Load test only'},periods:[{id:'test-period',labels:{de:'Testzeit',en:'Test period'}}],regions:[{id:'region-'+i%10,labels:{de:'Testregion '+i%10,en:'Test region '+i%10}}],topics:[]},searchTerms:['Person Álvarez '+i,'Port '+i%100]};
  });
  const bytes=new TextEncoder().encode(JSON.stringify(rows)).byteLength;
  let start=performance.now();const search=new ChapterSearch(rows),prepare=performance.now()-start;
  const timings=[];let result;
  for(const query of ['','alvarez','port 42','synthetic chapter 100','missingword','alvarez region','port']){start=performance.now();result=search.query({query,region:'region-2',page:2});timings.push(performance.now()-start);}
  const sample=document.getElementById('sample'),state={...defaultState(rows[0],'benchmark','synthetic'),view:'explore',id:undefined,chapters:[],browse:{query:'alvarez',region:'region-2'}};
  start=performance.now();renderExplorer(sample,state,search,()=>{});sample.offsetHeight;const render=performance.now()-start;
  const cards=sample.querySelectorAll('.discovery-card').length;
  // The benchmark uses the production rendering path; remove its global tray afterward.
  sample.querySelector('.selection-tray')?.remove();
  const row={count,jsonMiB:+(bytes/1048576).toFixed(2),prepareMs:+prepare.toFixed(1),searchMedianMs:+timings.sort((a,b)=>a-b)[3].toFixed(1),searchMaxMs:+Math.max(...timings).toFixed(1),pageMs:+render.toFixed(1),domCards:cards};report.push(row);
  document.getElementById('results').insertAdjacentHTML('beforeend',`<tr><td>${count}</td><td>${row.jsonMiB}</td><td>${row.prepareMs}</td><td>${row.searchMedianMs} / ${row.searchMaxMs}</td><td>${row.pageMs}</td><td>${cards}</td></tr>`);
  if(cards>24)throw Error('Unbounded DOM');await frame();
 }
 document.getElementById('report').textContent=JSON.stringify({userAgent:navigator.userAgent,results:report,limits:'Generated metadata in memory. Transfer, decompression, full atlas indices and WebGL rendering are not measured.'},null,2);status.textContent='Complete';
 }catch(error){status.textContent=String(error)}finally{button.disabled=false}
};
