import { Suspense, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Html,
  Instance,
  Instances,
  OrbitControls,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import { Vector3 } from 'three';
import type { Mesh, PerspectiveCamera } from 'three';
import { palette } from './palette';

const MODEL_URL = '/models/house.glb';

/**
 * Framing is fitted per axis. A single bounding sphere would be dominated by the
 * base's width and push the camera far enough back to shrink the whole diorama.
 */
const FRAME_HALF_WIDTH = 12;
const FRAME_HALF_HEIGHT = 6.6;
const FRAME_TARGET = new Vector3(0, 1.3, 0);
const FRAME_DIRECTION = new Vector3(0.6, 0.44, 0.78).normalize();

type OrbitLike = {
  target: Vector3;
  minDistance: number;
  maxDistance: number;
  update: () => void;
};

/**
 * Fits the diorama to the canvas on mount and on resize. Without this, a tall
 * phone viewport crops the base and a wide desktop viewport leaves it tiny.
 */
function ResponsiveFraming() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const controls = useThree((state) => state.controls) as OrbitLike | null;
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    // Aspect is derived from the canvas size rather than read off the camera:
    // R3F syncs camera.aspect from a parent effect, which runs after this one,
    // so reading it here would fit the previous viewport on every resize.
    const aspect = width / height;
    camera.aspect = aspect;

    const verticalFov = (camera.fov * Math.PI) / 180;
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
    const distance =
      Math.max(
        FRAME_HALF_WIDTH / Math.sin(horizontalFov / 2),
        FRAME_HALF_HEIGHT / Math.sin(verticalFov / 2),
      ) * 1.06;

    camera.position.copy(FRAME_DIRECTION).multiplyScalar(distance).add(FRAME_TARGET);
    camera.updateProjectionMatrix();

    if (controls) {
      controls.target.copy(FRAME_TARGET);
      controls.minDistance = distance * 0.45;
      controls.maxDistance = distance * 1.6;
      controls.update();
    }

    invalidate();
  }, [camera, controls, width, height, invalidate]);

  return null;
}

/** Deterministic scatter so the diorama renders identically on every visit. */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

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
  const { scene } = useGLTF(MODEL_URL);
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

  // The export rests on Y = 0 and carries its own ground-plan position, so the
  // model is placed directly rather than re-centered.
  return (
    <group position={[0, 0.02, -0.6]}>
      <primitive object={house} />
    </group>
  );
}

function DioramaBase() {
  return (
    <group>
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[11, 11, 1.2, 72]} />
        <meshStandardMaterial color={palette.baseRim} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10.5, 72]} />
        <meshStandardMaterial color={palette.baseTop} roughness={1} />
      </mesh>

      {/* Raked gravel and planting beds read as tonal patches, as in the concept. */}
      <mesh position={[-5.2, 0.03, 5.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 40]} />
        <meshStandardMaterial color={palette.gravelPale} roughness={1} />
      </mesh>
      <mesh position={[7.0, 0.03, 4.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.1, 40]} />
        <meshStandardMaterial color={palette.gravel} roughness={1} />
      </mesh>
      <mesh position={[-8.2, 0.04, 1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.1, 32]} />
        <meshStandardMaterial color={palette.moss} roughness={1} />
      </mesh>
      <mesh position={[8.0, 0.04, -1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.9, 32]} />
        <meshStandardMaterial color={palette.moss} roughness={1} />
      </mesh>
    </group>
  );
}

const RIDGES: {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: number;
  color: string;
}[] = [
  // Kept clear of the house: the rear wall sits at z = -4, and each ellipsoid's
  // cross-section at ground level must stay behind it to avoid interpenetration.
  { position: [-8.6, -2.2, -6.5], scale: [2.7, 5.4, 2.4], rotation: 1.7, color: palette.ridgeFar },
  { position: [-5.6, -2.6, -6.8], scale: [3.8, 7.6, 2.8], rotation: 0.5, color: palette.ridgeNear },
  { position: [-1.2, -3.0, -7.8], scale: [4.4, 9.4, 3.0], rotation: 1.1, color: palette.ridgeFar },
  { position: [3.2, -2.8, -7.4], scale: [4.0, 8.6, 2.8], rotation: 2.2, color: palette.ridgeNear },
  { position: [7.8, -2.4, -6.4], scale: [3.2, 6.2, 2.4], rotation: 0.8, color: palette.ridgeFar },
  { position: [9.0, -2.0, -5.0], scale: [2.4, 4.4, 2.0], rotation: 2.6, color: palette.ridgeNear },
];

function MountainBackdrop() {
  return (
    <group>
      {RIDGES.map((ridge) => (
        <mesh
          key={`${ridge.position[0]}-${ridge.position[2]}`}
          position={ridge.position}
          scale={ridge.scale}
          rotation={[0.12, ridge.rotation, 0.08]}
          castShadow
          receiveShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={ridge.color} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Palm({
  position,
  height = 5.2,
  tilt = 0.05,
  spin = 0,
}: {
  position: [number, number, number];
  height?: number;
  tilt?: number;
  spin?: number;
}) {
  const fronds = Array.from({ length: 7 }, (_, index) => index);

  return (
    <group position={position} rotation={[0, spin, tilt]}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.3, height, 9]} />
        <meshStandardMaterial color={palette.trunk} roughness={1} />
      </mesh>
      <mesh position={[0, height + 0.06, 0]} castShadow>
        <sphereGeometry args={[0.27, 10, 8]} />
        <meshStandardMaterial color={palette.frondDeep} roughness={1} flatShading />
      </mesh>
      {fronds.map((index) => {
        const angle = (index / fronds.length) * Math.PI * 2;
        const droop = index % 2 === 0 ? 0.34 : 0.2;

        return (
          <group key={index} position={[0, height, 0]} rotation={[0, angle, 0]}>
            <mesh
              position={[0.78, -0.16, 0]}
              rotation={[0, 0, -Math.PI / 2 - droop]}
              scale={[0.28, 1, 1]}
              castShadow
            >
              <coneGeometry args={[0.4, 1.75, 5]} />
              <meshStandardMaterial
                color={index % 2 === 0 ? palette.frond : palette.frondDeep}
                roughness={1}
                flatShading
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

const PALMS: { position: [number, number, number]; height: number; tilt: number; spin: number }[] = [
  { position: [-6.6, 0, 3.6], height: 6.4, tilt: 0.05, spin: 0.3 },
  { position: [-8.0, 0, 5.4], height: 5.1, tilt: -0.07, spin: 1.2 },
  { position: [7.4, 0, 3.8], height: 5.8, tilt: 0.06, spin: 2.1 },
  { position: [9.4, 0, 2.2], height: 4.6, tilt: -0.04, spin: 0.8 },
];

function Palms() {
  return (
    <group>
      {PALMS.map((palm) => (
        <Palm
          key={`${palm.position[0]}-${palm.position[2]}`}
          position={palm.position}
          height={palm.height}
          tilt={palm.tilt}
          spin={palm.spin}
        />
      ))}
    </group>
  );
}

function Agave({
  position,
  scale = 1,
  color = palette.succulent,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const blades = Array.from({ length: 8 }, (_, index) => index);

  return (
    <group position={position} scale={scale}>
      {blades.map((index) => {
        const angle = (index / blades.length) * Math.PI * 2;
        const lean = index % 2 === 0 ? 0.62 : 0.42;

        return (
          <group key={index} rotation={[0, angle, 0]}>
            <mesh
              position={[Math.sin(lean) * 0.34, Math.cos(lean) * 0.36, 0]}
              rotation={[0, 0, -lean]}
              scale={[0.42, 1, 1]}
              castShadow
            >
              <coneGeometry args={[0.17, 0.84, 5]} />
              <meshStandardMaterial color={color} roughness={1} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function BarrelCactus({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <mesh position={position} scale={[scale, scale * 0.82, scale]} castShadow>
      <sphereGeometry args={[0.36, 9, 7]} />
      <meshStandardMaterial color={palette.succulentDeep} roughness={1} flatShading />
    </mesh>
  );
}

const ROCKS: { position: [number, number, number]; scale: [number, number, number]; pale: boolean }[] = [
  { position: [-7.4, 0.16, 5.6], scale: [0.9, 0.5, 0.7], pale: true },
  { position: [-6.2, 0.12, 6.8], scale: [0.55, 0.34, 0.45], pale: false },
  { position: [6.6, 0.18, 6.0], scale: [1.0, 0.55, 0.8], pale: false },
  { position: [8.0, 0.13, 4.6], scale: [0.6, 0.36, 0.5], pale: true },
  { position: [-8.8, 0.15, -1.4], scale: [0.85, 0.48, 0.66], pale: false },
  { position: [9.0, 0.14, 1.6], scale: [0.7, 0.4, 0.58], pale: true },
];

const AGAVES: { position: [number, number, number]; scale: number; deep: boolean }[] = [
  { position: [-7.8, 0.1, 4.0], scale: 1.15, deep: false },
  { position: [-5.6, 0.1, 7.2], scale: 0.9, deep: true },
  { position: [-3.2, 0.1, 6.2], scale: 1.0, deep: false },
  { position: [6.0, 0.1, 6.8], scale: 1.05, deep: true },
  { position: [8.2, 0.1, 2.8], scale: 0.95, deep: false },
  { position: [8.8, 0.1, -2.4], scale: 1.1, deep: true },
  { position: [-8.8, 0.1, 0.6], scale: 0.85, deep: false },
];

const CACTI: { position: [number, number, number]; scale: number }[] = [
  { position: [-6.6, 0.3, 4.8], scale: 1 },
  { position: [-4.4, 0.26, 7.0], scale: 0.82 },
  { position: [7.3, 0.3, 5.4], scale: 0.95 },
  { position: [9.2, 0.26, 0.4], scale: 0.8 },
  { position: [-9.2, 0.24, 2.6], scale: 0.75 },
];

function Xeriscape() {
  const pebbles = useMemo(() => {
    const random = createRandom(20260907);
    const placed: [number, number, number][] = [];

    while (placed.length < 90) {
      const angle = random() * Math.PI * 2;
      const radius = 4.6 + random() * 5.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const onHouse = x > -8.2 && x < 7.1 && z > -4.4 && z < 3.6;
      const onDriveway = x > 0.9 && x < 6.1 && z > 3.2;
      if (onHouse || onDriveway) continue;

      placed.push([x, 0.06 + random() * 0.04, z]);
    }

    return placed;
  }, []);

  return (
    <group>
      <Instances limit={pebbles.length} castShadow>
        <icosahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial color={palette.rockPale} roughness={1} flatShading />
        {pebbles.map((position, index) => (
          <Instance key={index} position={position} />
        ))}
      </Instances>

      {ROCKS.map((rock) => (
        <mesh
          key={`${rock.position[0]}-${rock.position[2]}`}
          position={rock.position}
          scale={rock.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.62, 0]} />
          <meshStandardMaterial
            color={rock.pale ? palette.rockPale : palette.rock}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}

      {AGAVES.map((agave) => (
        <Agave
          key={`${agave.position[0]}-${agave.position[2]}`}
          position={agave.position}
          scale={agave.scale}
          color={agave.deep ? palette.succulentDeep : palette.succulent}
        />
      ))}

      {CACTI.map((cactus) => (
        <BarrelCactus
          key={`${cactus.position[0]}-${cactus.position[2]}`}
          position={cactus.position}
          scale={cactus.scale}
        />
      ))}
    </group>
  );
}

/** Driveway and entry walk, laid out as the concept's pale paver checkerboard. */
function Hardscape() {
  const drivewayColumns = [1.7, 3.5, 5.3];
  const drivewayRows = [4.3, 6.1, 7.9];
  const walk: [number, number][] = [
    [-0.7, 3.7],
    [-0.7, 5.4],
    [-0.2, 7.0],
  ];

  return (
    <group>
      {drivewayColumns.map((x) =>
        drivewayRows.map((z) => (
          <mesh
            key={`drive-${x}-${z}`}
            position={[x, 0.06, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[1.66, 1.66]} />
            <meshStandardMaterial color={palette.paver} roughness={1} />
          </mesh>
        )),
      )}

      {walk.map(([x, z], index) => (
        <mesh
          key={`walk-${x}-${z}`}
          position={[x, 0.06, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[1.4, 1.4]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? palette.paver : palette.gravelPale}
            roughness={1}
          />
        </mesh>
      ))}

      {/* Turf ribbons between the pavers, matching the concept's green inlays. */}
      <mesh position={[3.5, 0.05, 9.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5.4, 1.5]} />
        <meshStandardMaterial color={palette.moss} roughness={1} />
      </mesh>
      <mesh position={[-2.4, 0.05, 4.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.0, 2.6]} />
        <meshStandardMaterial color={palette.moss} roughness={1} />
      </mesh>
    </group>
  );
}

export default function DioramaScene() {
  const invalidate = useThree((state) => state.invalidate);

  return (
    <>
      <color attach="background" args={[palette.backdrop]} />

      {/* Broad, low-contrast light keeps the clay reading matte rather than glossy.
          Intensities stay modest so the sand stucco does not blow out to white. */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={[palette.backdrop, palette.baseTop, 0.5]} />
      <directionalLight
        castShadow
        position={[-14, 18, 16]}
        intensity={1.7}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={60}
      />
      <directionalLight position={[12, 7, -10]} intensity={0.32} />

      <DioramaBase />
      <MountainBackdrop />
      <Hardscape />
      <Xeriscape />
      <Palms />

      <Suspense fallback={<Loader />}>
        <HouseModel />
        <ContactShadows
          position={[0, 0.05, 0]}
          opacity={0.32}
          scale={26}
          blur={2.6}
          far={9}
          frames={1}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.3}
        target={[FRAME_TARGET.x, FRAME_TARGET.y, FRAME_TARGET.z]}
        onChange={() => invalidate()}
      />
      <ResponsiveFraming />
    </>
  );
}

useGLTF.preload(MODEL_URL);
