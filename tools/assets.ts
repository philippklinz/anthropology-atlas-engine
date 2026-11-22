export function validateGLB(bytes:Uint8Array):void {
  const d=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(bytes.length<20||d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2||d.getUint32(8,true)!==bytes.length) throw new Error('ASSET_GLB: invalid GLB 2 header');
  let offset=12, json:Record<string,unknown>|undefined, binaryBytes=0;
  while(offset<bytes.length) {
    if(offset+8>bytes.length) throw new Error('ASSET_GLB: truncated chunk');
    const size=d.getUint32(offset,true),type=d.getUint32(offset+4,true);
    if(size%4!==0||offset+8+size>bytes.length) throw new Error('ASSET_GLB: invalid chunk length');
    if(type===0x4e4f534a) { if(offset!==12||json) throw new Error('ASSET_GLB: JSON must be first'); json=JSON.parse(new TextDecoder().decode(bytes.subarray(offset+8,offset+8+size))); }
    else if(type===0x004e4942) binaryBytes+=size;
    else throw new Error('ASSET_GLB: unsupported chunk');
    offset+=8+size;
  }
  if(!json||(json.asset as {version?:string})?.version!=='2.0') throw new Error('ASSET_GLB: missing glTF 2 metadata');
  const buffers=(json.buffers??[]) as {uri?:string;byteLength:number}[],images=(json.images??[]) as {uri?:string;bufferView?:number}[];
  if(buffers.length>1||buffers.some(b=>b.uri!==undefined||b.byteLength>binaryBytes)||images.some(i=>i.uri!==undefined||!Number.isInteger(i.bufferView))) throw new Error('ASSET_EXTERNAL: only embedded buffers and images are supported');
  const supported=new Set(['KHR_materials_unlit','KHR_mesh_quantization']);
  if(((json.extensionsUsed??[]) as string[]).some(e=>!supported.has(e))) throw new Error('ASSET_EXTENSION: decoder or extension is not registered');
}
