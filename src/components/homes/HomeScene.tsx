import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei/core/OrbitControls';
import { useGLTF } from '@react-three/drei/core/Gltf';
import { ContactShadows } from '@react-three/drei/core/ContactShadows';
import { Mesh, OrthographicCamera, Vector3 } from 'three';
import type { OrbitControls as ControlsImpl } from 'three-stdlib';
import type { HomeKind, HomeView } from './HomeViewer';

type Props = { kind: HomeKind; modelUrl: string; view: HomeView; revision: number; onReady: () => void; label: string; descriptionId: string };
type Framing = { position: [number, number, number]; target: [number, number, number]; width: number; height: number };
const framing: Record<HomeKind, Record<HomeView, Framing>> = {
  desert: {
    home: { position: [25, 27, 37], target: [0, 2, 0], width: 30, height: 25 },
    detail: { position: [0.25, 1.85, 9.8], target: [-1.9, 0.78, 6.35], width: 2.8, height: 2.8 },
  },
  clocktower: {
    home: { position: [32, 32, 48], target: [0, 7, 0], width: 39, height: 33 },
    detail: { position: [1.5, 18.5, 11], target: [-8.25, 15.8, -2.65], width: 11, height: 12 },
  },
};
// These colors belong to the miniature's studio, independent of the page theme.
const studio = { ambient: 'floralwhite', sky: 'oldlace', ground: 'darkkhaki', sun: 'papayawhip', fill: 'aliceblue', shadow: 'darkslategray' };

function Model({ url, onReady }: { url: string; onReady: () => void }) {
  const { scene } = useGLTF(url, false, true);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(o => { if (o instanceof Mesh) { o.castShadow = true; o.receiveShadow = true; } });
    return clone;
  }, [scene]);
  useEffect(onReady, [onReady]);
  return <primitive object={model} dispose={null} />;
}

function CameraRig({ kind, view, revision }: Pick<Props, 'kind' | 'view' | 'revision'>) {
  const controls = useRef<ControlsImpl>(null);
  const { camera, size, invalidate, gl } = useThree();
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    const config = framing[kind][view];
    camera.position.set(...config.position);
    camera.zoom = Math.min(size.width / config.width, size.height / config.height);
    const target = new Vector3(...config.target);
    camera.lookAt(target); camera.updateProjectionMatrix();
    controls.current?.target.copy(target); controls.current?.update(); invalidate();
  }, [camera, size.width, size.height, kind, view, revision, invalidate]);
  useEffect(() => {
    const controller = controls.current;
    const canvas = gl.domElement;
    controller?.listenToKeyEvents(canvas);
    function zoom(event: KeyboardEvent) {
      if (!(camera instanceof OrthographicCamera) || !['+', '=', '-', '_'].includes(event.key)) return;
      event.preventDefault();
      camera.zoom = Math.max(2, Math.min(800, camera.zoom * (event.key === '+' || event.key === '=' ? 1.15 : 1 / 1.15)));
      camera.updateProjectionMatrix(); invalidate();
    }
    canvas.addEventListener('keydown', zoom);
    return () => { controller?.stopListenToKeyEvents(); canvas.removeEventListener('keydown', zoom); };
  }, [camera, gl, invalidate]);
  return <OrbitControls ref={controls} makeDefault enablePan screenSpacePanning enableDamping={!reducedMotion} dampingFactor={0.09} minPolarAngle={0.1} maxPolarAngle={Math.PI / 2.05} minZoom={2} maxZoom={800} />;
}

export default function HomeScene({ kind, modelUrl, view, revision, onReady, label, descriptionId }: Props) {
  return <Canvas orthographic shadows frameloop="demand" dpr={[1, 1.5]} camera={{ position: framing[kind].home.position, zoom: 12, near: 0.1, far: 220 }} gl={{ antialias: true, alpha: true }}
    onCreated={({ gl }) => { gl.domElement.tabIndex = 0; gl.domElement.setAttribute('aria-label', label); gl.domElement.setAttribute('aria-describedby', descriptionId); }}>
    <ambientLight intensity={1.2} color={studio.ambient} />
    <hemisphereLight args={[studio.sky, studio.ground, 1.7]} />
    <directionalLight position={[-16, 32, 18]} intensity={3} color={studio.sun} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={26} shadow-camera-bottom={-24} shadow-camera-far={110} shadow-normalBias={0.04} shadow-bias={-0.0001} />
    <directionalLight position={[18, 20, -18]} intensity={1.7} color={studio.fill} />
    <Suspense fallback={null}>
      <Model url={modelUrl} onReady={onReady} />
      <ContactShadows position={[0, kind === 'desert' ? -0.94 : -1.04, 0]} opacity={0.32} scale={48} blur={2.4} far={24} resolution={512} frames={1} color={studio.shadow} />
    </Suspense>
    <CameraRig kind={kind} view={view} revision={revision} />
  </Canvas>;
}
