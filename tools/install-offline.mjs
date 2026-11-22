import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const manifest=JSON.parse(readFileSync(new URL('../vendor/manifest.json',import.meta.url),'utf8'));
if(process.platform!=='linux'||process.arch!=='x64')throw new Error('This vendor profile requires Linux x86_64. Other profiles need a separate vendor refresh.');
mkdirSync('.cache/archives',{recursive:true});
for(const p of manifest.packages){
  const bytes=p.archiveParts?Buffer.concat(p.archiveParts.map(path=>readFileSync(path))):readFileSync(p.archive);
  if(createHash('sha256').update(bytes).digest('hex')!==p.sha256)throw new Error('Vendor hash mismatch: '+p.archive);
  const archive=p.archiveParts?'.cache/archives/'+basename(p.archive):p.archive;
  if(p.archiveParts)writeFileSync(archive,bytes);
  execFileSync('npm',['cache','add',archive,'--offline','--cache','.cache/npm'],{stdio:'pipe'});
}
execFileSync('npm',['ci','--offline','--ignore-scripts','--no-audit','--no-fund','--cache','.cache/npm'],{stdio:'inherit'});
