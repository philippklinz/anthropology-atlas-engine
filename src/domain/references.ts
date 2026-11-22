export type Reference = { id:string; path:string };
const singles = new Set(['sourceId','subjectId','objectId','entityId','geometryId','placeId','parentEventId','scriptId','fontAssetId','assetId','anchorGeometryId','interpretationId','assertionId']);
const lists = new Set(['assetIds','entityIds','scopeIds','placeIds','focusIds','memberIds','recordIds','entryChapterIds','selectedIds','dependencies']);
export function references(value:unknown,path=''): Reference[] {
  if(Array.isArray(value)) return value.flatMap((v,i)=>references(v,`${path}/${i}`));
  if(!value || typeof value!=='object') return [];
  return Object.entries(value).flatMap(([k,v])=>singles.has(k)?[{id:String(v),path:`${path}/${k}`}]:lists.has(k)&&Array.isArray(v)?v.map((id,i)=>({id:String(id),path:`${path}/${k}/${i}`})):references(v,`${path}/${k}`));
}
export function walk(value:unknown,visit:(value:Record<string,unknown>,path:string)=>void,path=''):void {
  if(Array.isArray(value)) value.forEach((v,i)=>walk(v,visit,`${path}/${i}`));
  else if(value && typeof value==='object') { visit(value as Record<string,unknown>,path); for(const [k,v] of Object.entries(value)) walk(v,visit,`${path}/${k}`); }
}
export function resolvePointer(value:unknown,pointer:string):boolean {
  if(pointer==='') return true;
  if(!pointer.startsWith('/') || /~(?![01])/u.test(pointer)) return false;
  let current=value;
  for(const part of pointer.slice(1).split('/').map(p=>p.replace(/~1/g,'/').replace(/~0/g,'~'))) {
    if(!current || typeof current!=='object' || !Object.hasOwn(current,part)) return false;
    current=(current as Record<string,unknown>)[part];
  }
  return true;
}
