import { Canvas } from '@react-three/fiber';
import DioramaScene from './DioramaScene';

export default function GrecoDiorama() {
  return (
    <div
      className="diorama-canvas"
      role="img"
      aria-label="Interactive clay diorama of a single-story desert house with palms, xeriscape, and mountains on a rounded base"
    >
      <Canvas
        camera={{ position: [13, 8.5, 15.5], fov: 32, near: 0.1, far: 120 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        shadows="percentage"
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <DioramaScene />
      </Canvas>
      <p className="diorama-canvas__hint">Drag to orbit</p>
    </div>
  );
}
