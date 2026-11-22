import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const schema = JSON.parse(readFileSync('schemas/0.1.0/record.schema.json', 'utf8'));
const name = x => x[0].toUpperCase() + x.slice(1);
function type(s) {
  if (s.$ref) return name(s.$ref.split('/').pop());
  if ('const' in s) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map(JSON.stringify).join(' | ');
  if (s.oneOf && !s.properties) return s.oneOf.map(type).join(' | ');
  if (s.anyOf && !s.properties) return s.anyOf.map(type).join(' | ');
  if (Array.isArray(s.type)) return s.type.map(t => type({...s,type:t})).join(' | ');
  if (s.type === 'array') return `Array<${type(s.items)}>`;
  if (s.type === 'object') {
    if (!s.properties) return `Record<string, ${typeof s.additionalProperties === 'object' ? type(s.additionalProperties) : 'unknown'}>`;
    return `{ ${Object.entries(s.properties).map(([k,v])=>`${JSON.stringify(k)}${s.required?.includes(k)?'':'?'}: ${type(v)}`).join('; ')} }`;
  }
  return ({integer:'number',number:'number',string:'string',boolean:'boolean',null:'null'})[s.type] ?? 'unknown';
}
mkdirSync('src/domain',{recursive:true});
writeFileSync('src/domain/records.ts', '// Generated from schemas/0.1.0/record.schema.json; regenerate with node tools/generate-types.mjs.\n'+Object.entries(schema.$defs).map(([k,v])=>`export type ${name(k)} = ${type(v)};`).join('\n')+'\nexport type AtlasRecord = Entity | Assertion | Event | Geometry | Source | Interpretation | Asset | Chapter | Package;\n');
