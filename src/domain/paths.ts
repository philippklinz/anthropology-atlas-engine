export function safeRelative(path: string): boolean {
  return /^[A-Za-z0-9._/-]+$/.test(path) && !path.startsWith('/') && !path.split('/').some(p=>p==='..'||p==='') && path!=='.';
}
export function contentURL(path:string,base:URL):URL {
  if(!safeRelative(path)) throw new Error('PATH_UNSAFE: '+path);
  const url=new URL(path,base),dir=new URL('.',base);
  if(url.origin!==dir.origin || !url.pathname.startsWith(dir.pathname)) throw new Error('PATH_ESCAPE: '+path);
  return url;
}
