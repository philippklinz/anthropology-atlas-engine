#!/usr/bin/env node
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { validate } from './validate.ts';
import { buildContent, report } from './build.ts';
import type { Profile } from './validate.ts';
const args=process.argv.slice(2),command=args[0],root=resolve(args[1]??'.');
const option=(key:string,fallback:string)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1]??fallback;};
try {
  const profile=option('--profile','draft') as Profile;
  if(!['draft','fixture','release'].includes(profile))throw new Error('Unknown profile');
  if(command==='validate'){
    const result=report(await validate(root,profile));console.log(JSON.stringify(result,null,2));if(result.errors)process.exitCode=1;
  }else if(command==='build'){
    const revision=option('--source-revision','')||execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    const catalog=await buildContent(root,resolve(option('--out','build/content')),profile,revision);
    console.log(JSON.stringify({dataReleaseId:catalog.dataReleaseId,files:catalog.files.length,sourceRevision:catalog.sourceRevision},null,2));
  }else{console.log('atlas validate <content-root> --profile draft|fixture|release\natlas build <content-root> --out <directory> --profile draft|fixture|release [--source-revision <full-commit>]');if(command)process.exitCode=1;}
}catch(e){console.error(e instanceof Error?e.message:String(e));process.exitCode=1;}
