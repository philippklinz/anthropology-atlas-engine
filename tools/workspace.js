import {resolve} from './paths.js';
import {unzipSync,zipSync} from '../vendor/fflate/fflate.js';
export class Workspace {
  files = new Map();
  set(path, value) {
    if(path.split('/').includes('..'))throw new Error('PATH_ESCAPE: '+path);
    this.files.set(resolve(path), typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value));
  }
  async readFile(path, encoding) {
    const data=this.files.get(resolve(path)); if(!data)throw new Error('FILE_MISSING: '+path);
    return encoding?new TextDecoder().decode(data):data;
  }
  async realpath(path) { const p=resolve(path); if(p!=='/'&&!this.files.has(p))throw new Error('FILE_MISSING: '+p); return p; }
  async readdir(path) {
    const prefix=resolve(path).replace(/\/$/,'')+'/', entries=new Map();
    for(const file of this.files.keys()) if(file.startsWith(prefix)) {
      const rest=file.slice(prefix.length), name=rest.split('/')[0];
      entries.set(name,{name,isDirectory:()=>rest.includes('/'),isSymbolicLink:()=>false});
    }
    return [...entries.values()].sort((a,b)=>a.name.localeCompare(b.name));
  }
  clone() { const copy=new Workspace(); for(const [p,b] of this.files)copy.set(p,b); return copy; }
  zip() { return zipSync(Object.fromEntries([...this.files].map(([p,b])=>[p.slice(1),b])),{level:6}); }
  static async fromFiles(files) {
    const result=new Workspace();
    for(const file of files) {
      const path=file.webkitRelativePath ? file.webkitRelativePath.split('/').slice(1).join('/') : file.name;
      if(path.split('/').some(p=>['.git','tooling','published'].includes(p)))continue;
      if(result.files.has(resolve(path)))throw new Error('PATH_DUPLICATE: '+path);
      result.set(path,new Uint8Array(await file.arrayBuffer()));
    }
    return result;
  }
  static fromZip(bytes) {
    const result=new Workspace(), entries=Object.entries(unzipSync(bytes));
    const datasets=entries.filter(([p])=>p==='dataset.json'||p.endsWith('/dataset.json'));
    if(datasets.length!==1)throw new Error('ZIP_DATASET: select an archive with one dataset.json');
    const prefix=datasets[0][0].slice(0,-'dataset.json'.length);
    for(const [path,bytes] of entries)if(path.startsWith(prefix)&&!path.endsWith('/')){const local=path.slice(prefix.length);if(!local.split('/').some(p=>['.git','tooling','published'].includes(p)))result.set(local,bytes);}
    return result;
  }
}
export async function loadFixture() {
  const base=new URL('../fixtures/reference-package/',import.meta.url), response=await fetch(new URL('files.json',base));
  if(!response.ok)throw new Error('Fixture inventory unavailable');
  const result=new Workspace();
  for(const path of await response.json()) { const r=await fetch(new URL(path,base)); if(!r.ok)throw new Error('Fixture missing: '+path); result.set(path,new Uint8Array(await r.arrayBuffer())); }
  return result;
}
