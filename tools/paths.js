// Virtual POSIX paths; never touch the host filesystem.
export const sep = '/';
export function resolve(...parts) {
  const stack = [];
  for (const part of parts) {
    if (part.includes('\\') || part.includes('\0')) throw new Error('PATH_UNSAFE: '+part);
    if (part.startsWith('/')) stack.length = 0;
    for (const segment of part.split('/')) {
      if (!segment || segment === '.') continue;
      if (segment === '..') { if (!stack.length) throw new Error('PATH_ESCAPE: '+part); stack.pop(); }
      else stack.push(segment);
    }
  }
  return '/' + stack.join('/');
}
export function join(...parts) { const path=resolve(...parts); return parts[0]?.startsWith('/') ? path : path.slice(1); }
export function dirname(path) { const parts=path.split('/'); parts.pop(); return parts.join('/') || (path.startsWith('/')?'/':'.'); }
export function relative(root, path) { const a=resolve(root),b=resolve(path); if(a==='/')return b.slice(1); if(!b.startsWith(a+'/'))throw new Error('PATH_ESCAPE: '+path); return b.slice(a.length+1); }
export function extname(path) { const name=path.split('/').at(-1); return name.includes('.')?'.'+name.split('.').at(-1):''; }
export const posix={join,dirname};
