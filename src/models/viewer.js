import * as THREE from '../../vendor/three/three.module.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from '../../vendor/three/addons/controls/OrbitControls.js';
import { SVGRenderer } from '../../vendor/three/addons/renderers/SVGRenderer.js';
export async function showModel(container, bytes) {
    const manager = new THREE.LoadingManager();
    manager.setURLModifier(url => { if (!url.startsWith('blob:') && !url.startsWith('data:'))
        throw new Error('MODEL_EXTERNAL: undeclared resource'); return url; });
    const gltf = await new GLTFLoader(manager).parseAsync(new Uint8Array(bytes).buffer, '');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e5ebe7');
    scene.add(new THREE.HemisphereLight(0xffffff, 0x4b6258, 3));
    const light = new THREE.DirectionalLight(0xffffff, 4);
    light.position.set(3, 5, 4);
    scene.add(light);
    const model = gltf.scene, box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length() || 1;
    model.position.sub(center);
    scene.add(model);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, size * 100);
    camera.position.set(size * 1.4, size * 0.8, size * 1.8);
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    }
    catch {
        renderer = new SVGRenderer();
    }
    container.append(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', '3D object viewer');
    renderer.domElement.setAttribute('tabindex', '0');
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.minDistance = size * 0.5;
    controls.maxDistance = size * 8;
    const render = () => renderer.render(scene, camera);
    const resize = () => { const w = container.clientWidth, h = container.clientHeight; if (!w || !h)
        return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); render(); };
    controls.addEventListener('change', render);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => { observer.disconnect(); controls.dispose(); scene.traverse(o => { if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            for (const value of Object.values(m))
                if (value instanceof THREE.Texture) {
                    const image = value.image;
                    if (image instanceof ImageBitmap)
                        image.close();
                    value.dispose();
                }
            m.dispose();
        }
    } }); if (renderer instanceof THREE.WebGLRenderer)
        renderer.dispose(); renderer.domElement.remove(); };
}
