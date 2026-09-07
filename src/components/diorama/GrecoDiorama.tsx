import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  Center,
  ContactShadows,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import type { Mesh } from 'three';

const palette = {
  sky: 0xf3eadc,
  ground: 0xd8b987,
  clayGreen: 0x72846c,
  clayDark: 0x65594d,
  stone: 0xb58b67,
};

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="diorama-loader" role="status" aria-live="polite">
        <span className="diorama-loader__dot" aria-hidden="true" />
        Loading clay house {Math.round(progress)}%
      </div>
    </Html>
  );
}

function HouseModel() {
  const { scene } = useGLTF('/models/house.glb');
  const house = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    house.traverse((object) => {
      if ('isMesh' in object && object.isMesh) {
        const mesh = object as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [house]);

  return <primitive object={house} />;
}

function DesertProps() {
  return (
    <group>
      <group position={[-4.8, 0, 2.35]} rotation={[0, 0.12, 0]}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.17, 1.1, 5, 8]} />
          <meshStandardMaterial color={palette.clayGreen} roughness={0.95} />
        </mesh>
        <mesh position={[0.28, 0.78, 0]} rotation={[0, 0, -0.65]} castShadow>
          <capsuleGeometry args={[0.11, 0.46, 5, 8]} />
          <meshStandardMaterial color={palette.clayGreen} roughness={0.95} />
        </mesh>
        <mesh position={[-0.24, 1.02, 0]} rotation={[0, 0, 0.72]} castShadow>
          <capsuleGeometry args={[0.1, 0.35, 5, 8]} />
          <meshStandardMaterial color={palette.clayGreen} roughness={0.95} />
        </mesh>
      </group>

      <mesh position={[4.7, 0.2, 2.15]} scale={[0.72, 0.35, 0.52]} castShadow>
        <dodecahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color={palette.stone} roughness={1} />
      </mesh>
      <mesh position={[4.05, 0.14, 2.55]} scale={[0.42, 0.24, 0.36]} castShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={palette.clayDark} roughness={1} />
      </mesh>
    </group>
  );
}

function Scene() {
  const invalidate = useThree((state) => state.invalidate);

  return (
    <>
      <color attach="background" args={[palette.sky]} />
      <ambientLight intensity={1.45} />
      <hemisphereLight args={[palette.sky, palette.ground, 1.1]} />
      <directionalLight
        castShadow
        position={[-5, 8, 7]}
        intensity={2.6}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />

      <Suspense fallback={<Loader />}>
        <Center position={[0, 0.02, 0]} bottom>
          <HouseModel />
        </Center>
        <DesertProps />
        <ContactShadows
          position={[0, 0.015, 0]}
          opacity={0.3}
          scale={19}
          blur={2.8}
          far={7}
          frames={1}
        />
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color={palette.ground} roughness={1} />
      </mesh>

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={7}
        maxDistance={15}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1, 0]}
        onChange={() => invalidate()}
      />
    </>
  );
}

export default function GrecoDiorama() {
  return (
    <div
      className="diorama-canvas"
      role="img"
      aria-label="Interactive clay diorama placeholder of a single-story desert house"
    >
      <Canvas
        camera={{ position: [8.4, 5.6, 9.5], fov: 36, near: 0.1, far: 60 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        shadows
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Scene />
      </Canvas>
      <p className="diorama-canvas__hint">Drag to orbit · scroll to zoom</p>
    </div>
  );
}

useGLTF.preload('/models/house.glb');
