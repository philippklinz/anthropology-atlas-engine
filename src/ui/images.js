import {validateImage} from '../../tools/assets.js';
const caches = new WeakMap();
// One provider represents one immutable content release. Images are fetched only
// when opened, through its normal byte/hash verification and configured origin.
export async function imageURL(provider, asset) {
    if (asset.kind !== 'asset' || asset.assetType !== 'image') throw new Error('IMAGE_TYPE: raster image expected');
    let cache = caches.get(provider);
    if (!cache) { cache=new Map(); caches.set(provider,cache); }
    if (!cache.has(asset.id)) {
        const pending = provider.bytes(asset.file).then(bytes=>{
            validateImage(bytes,asset.mediaType);
            return URL.createObjectURL(new Blob([bytes],{type:asset.mediaType}));
        }).catch(error=>{cache.delete(asset.id);throw error;});
        cache.set(asset.id,pending);
    }
    return cache.get(asset.id);
}
