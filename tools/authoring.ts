import { build } from 'vite';
import { cp,mkdir,writeFile,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await build({configFile:false,build:{ssr:'tools/cli.ts',outDir:'build/authoring/tools',emptyOutDir:true,minify:false},ssr:{noExternal:true}});
await cp('schemas','build/authoring/schemas',{recursive:true});await cp('LICENSE','build/authoring/LICENSE');await cp('THIRD_PARTY_NOTICES.md','build/authoring/THIRD_PARTY_NOTICES.md');await cp('public/licenses','build/authoring/licenses',{recursive:true});
await writeFile('build/authoring/package.json',JSON.stringify({name:'anthropology-atlas-authoring',version:'0.1.0-dev.1',type:'module',bin:{atlas:'tools/cli.js'},engines:{node:'>=24'}},null,2)+'\n');
await writeFile('build/authoring/README.md','# Atlas authoring tools\n\nNode.js 24 or newer. No npm installation or engine checkout required.\n\n`node tooling/tools/cli.js validate . --profile draft`\n\n`node tooling/tools/cli.js build . --profile release --out published`\n\nGenerated from anthropology-atlas-engine. Do not edit this copy.\n');
console.log('Standalone authoring toolkit built.');
