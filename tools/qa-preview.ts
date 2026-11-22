import type { Plugin } from 'vite';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
// Dev-only routes serve the actual production build under a nested path.
// The HTTP profile deliberately uses another origin (localhost vs 127.0.0.1).
export function qaPreview():Plugin{return {name:'atlas-qa-preview',apply:'serve',configureServer(server){server.middlewares.use(async(req,res,next)=>{
  const url=new URL(req.url??'/', 'http://local'),match=url.pathname.match(/^\/qa\/(bundled|http)\/(.*)$/);if(!match)return next();
  try{
    const file=match[2]||'index.html';if(file.includes('..')){res.statusCode=400;res.end();return;}
    if(file==='atlas.config.json'&&match[1]==='http'){
      const config=JSON.parse(await readFile('dist/atlas.config.json','utf8'));config.content={mode:'http',catalogUrl:'http://localhost:4173/content/catalog.json',updatePolicy:'on-reload'};res.setHeader('Content-Type','application/json');res.end(JSON.stringify(config));return;
    }
    const body=await readFile(resolve('dist',file));const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.ttf':'font/ttf','.md':'text/plain','.glb':'model/gltf-binary'};
    res.setHeader('Content-Type',mime[extname(file)]??'application/octet-stream');res.end(body);
  }catch{res.statusCode=404;res.end('Not found');}
});}};}
