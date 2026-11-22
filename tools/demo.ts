import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { buildContent, sha256 } from './build.ts';
// All-zero revision is explicitly reserved for uncommitted local fixture previews.
let revision='0'.repeat(40);
try{revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
const catalog=await buildContent('fixtures/reference-package','public/content','fixture',revision);
await mkdir('public',{recursive:true});
await writeFile('public/atlas.config.json',JSON.stringify({configVersion:'1',instanceId:'atlas-development',defaultLanguage:'de',content:{mode:'bundled',catalogUrl:'./content/catalog.json',expectedCatalogSha256:sha256(await readFile('public/content/catalog.json')),updatePolicy:'pinned'}},null,2)+'\n');
console.log('Synthetic demo built: '+catalog.dataReleaseId);
