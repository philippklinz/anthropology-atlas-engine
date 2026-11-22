const tests=[];
export default function test(name,fn){tests.push({name,fn});}
function fail(message){throw new Error(message);}
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
export const assert={
  ok(v,message='Expected truthy value'){if(!v)fail(message)},
  equal(a,b,message=''){if(a!==b)fail(message+` Expected ${JSON.stringify(b)}, received ${JSON.stringify(a)}`)},
  deepEqual(a,b,message=''){if(canonical(a)!==canonical(b))fail(message+` Expected ${canonical(b)}, received ${canonical(a)}`)},
  throws(fn,match){try{fn()}catch(e){if(match instanceof RegExp&&!match.test(String(e)))throw e;return}fail('Expected an exception')},
  async rejects(fn,match){try{await fn()}catch(e){if(match instanceof RegExp&&!match.test(String(e)))throw e;return}fail('Expected rejection')}
};
export async function run(){let passed=0;for(const {name,fn} of tests){const li=document.createElement('li');li.textContent='RUNNING · '+name;document.getElementById('results').append(li);try{await fn();passed++;li.className='pass';li.textContent='PASS · '+name}catch(e){li.className='fail';li.textContent='FAIL · '+name+'\n'+(e.stack??e)}}document.getElementById('summary').textContent=`${passed}/${tests.length} passed`;document.title=`${passed===tests.length?'PASS':'FAIL'} · Atlas browser checks`;}
