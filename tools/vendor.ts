// Explicit maintenance command. Normal installs and builds consume this local store offline.
import { readFile,mkdir,writeFile,readdir,cp,unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const inventory=[];
await mkdir('vendor/npm',{recursive:true});await mkdir('public/licenses/npm',{recursive:true});
for(const [path,item] of Object.entries(lock.packages) as [string,{version:string;resolved?:string;integrity:string}][]){
  if(!path||!item.resolved||!existsSync(path+'/package.json'))continue;
  const pkg=JSON.parse(await readFile(path+'/package.json','utf8'));
  const name=pkg.name as string,file='vendor/npm/'+name.replaceAll('/','-').replace('@','')+'-'+item.version+'.tgz';
  if(!existsSync(file))execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','60',item.resolved,'-o',file]);
  const bytes=await readFile(file),[algorithm,want]=item.integrity.split('-');
  if(createHash(algorithm).update(bytes).digest('base64')!==want)throw new Error('Integrity mismatch: '+name);
  const licenseFiles=[];
  for(const entry of await readdir(path)){if(/^(licen[sc]e|copying|notice)([.-]|$)/i.test(entry)){const target='public/licenses/npm/'+name.replaceAll('/','-').replace('@','')+'-'+entry;try{await cp(path+'/'+entry,target);licenseFiles.push(target.replace('public/',''));}catch{}}}
  const archiveParts:string[]=[];
  if(bytes.length>8*1024*1024){for(let at=0;at<bytes.length;at+=8*1024*1024){const part=file+'.part'+String(archiveParts.length+1).padStart(2,'0');await writeFile(part,bytes.subarray(at,at+8*1024*1024));archiveParts.push(part);}await unlink(file);}
  inventory.push({...(archiveParts.length?{archiveParts}:{}),bytes:bytes.length,name,version:item.version,source:item.resolved,license:pkg.license??'SEE LOCAL LICENSE',archive:file,integrity:item.integrity,sha256:createHash('sha256').update(bytes).digest('hex'),licenseFiles});
  console.log(name+' '+item.version);
}
const manifest={profile:'linux-x64-glibc',node:process.version,npm:execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),packages:inventory.sort((a,b)=>a.name.localeCompare(b.name))};
await writeFile('vendor/manifest.json',JSON.stringify(manifest,null,2)+'\n');
let notices='# Open Source & Lizenzen / Licenses\n\nEngine: GNU GPL v2. Die unveränderte Projektlizenz steht in project.txt. / See project.txt for the unchanged project license.\n\n';
notices+='## Darstellung / Rendering\n\nMapLibre GL JS: globe and map. vis-network / vis-timeline: relationships and time. Three.js: model viewer. d3-geo: SVG globe fallback when WebGL2 is unavailable. Runtime dependencies are bundled locally.\n\n';
notices+='## Fonts und Grundkarte / Fonts and basemap\n\nLiberation Fonts: SIL Open Font License 1.1; see liberation.txt. Natural Earth 5.1.2, 1:110 million land: public domain; https://www.naturalearthdata.com/about/terms-of-use/. Source and checksum: basemap/provenance.json. Modern physical orientation, not historical borders.\n\n';
notices+='## Paketbestand / Package inventory\n\n';
for(const p of manifest.packages)notices+=`${p.name} ${p.version} — ${p.license}\n${p.source}\nLocal license: ${p.licenseFiles.join(', ')||'package archive'}\n\n`;
await writeFile('THIRD_PARTY_NOTICES.md',notices);await writeFile('public/licenses/THIRD_PARTY_NOTICES.md',notices);await cp('LICENSE','public/licenses/project.txt');
console.log(JSON.stringify({packages:inventory.length,bytes:inventory.reduce((sum,p)=>sum+p.bytes,0)}));
