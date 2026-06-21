/**
 * Coupled cross-section physics for the obduction prototype.
 * Stage I thrust lifts the override plate (Stage II); Stage III rides that stack.
 * Stage II thrust adds delta motion on Stage III — cause and effect down the stack.
 */

type StageId = '1' | '2' | '3';

type Pose2D = {
  rotate: number;
  tx: number;
  ty: number;
};

type StackPose = {
  subducting: Pose2D;
  plate: Pose2D;
  anchorDelta: Pose2D;
};

const COLLISION_PIVOT = { x: 525, y: 448 };
const PLATE_PIVOT = { x: COLLISION_PIVOT.x, y: COLLISION_PIVOT.y - 48 };
const ANCHOR_PIVOT = { x: 580, y: 282 };

const REST: StackPose = {
  subducting: { rotate: -1.2, tx: 8, ty: -2 },
  plate: { rotate: 0, tx: -5, ty: -8 },
  anchorDelta: { rotate: 0, tx: 0, ty: -6 },
};

/** Target poses when each friction zone is fully engaged. */
const STAGE_TARGETS: Record<StageId, StackPose> = {
  '1': {
    subducting: { rotate: -2.35, tx: 16, ty: -1 },
    plate: { rotate: 0, tx: -5, ty: -30 },
    anchorDelta: { rotate: 0, tx: 0, ty: -6 },
  },
  '2': {
    subducting: { rotate: -1.35, tx: 10, ty: -3 },
    plate: { rotate: -0.48, tx: -20, ty: -16 },
    anchorDelta: { rotate: 0, tx: -10, ty: -26 },
  },
  '3': {
    subducting: { rotate: -1.2, tx: 8, ty: -2 },
    plate: { rotate: 0, tx: -5, ty: -10 },
    anchorDelta: { rotate: 0, tx: 0, ty: -14 },
  },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpPose = (a: Pose2D, b: Pose2D, t: number): Pose2D => ({
  rotate: lerp(a.rotate ?? 0, b.rotate ?? 0, t),
  tx: lerp(a.tx, b.tx, t),
  ty: lerp(a.ty, b.ty, t),
});

const lerpStack = (a: StackPose, b: StackPose, t: number): StackPose => ({
  subducting: lerpPose(a.subducting, b.subducting, t),
  plate: lerpPose(a.plate, b.plate, t),
  anchorDelta: lerpPose(a.anchorDelta, b.anchorDelta, t),
});

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const subductingThrust = (rotate: number) =>
  clamp01(
    (rotate - REST.subducting.rotate) /
      (STAGE_TARGETS['1'].subducting.rotate - REST.subducting.rotate),
  );

const plateThrust = (pose: Pose2D) => {
  const txSpan = REST.plate.tx - STAGE_TARGETS['2'].plate.tx;
  const rotSpan = STAGE_TARGETS['2'].plate.rotate - REST.plate.rotate;
  const txDrive = txSpan === 0 ? 0 : clamp01((REST.plate.tx - pose.tx) / txSpan);
  const rotDrive =
    rotSpan === 0 ? 0 : clamp01((pose.rotate - REST.plate.rotate) / rotSpan);
  return clamp01(txDrive * 0.65 + rotDrive * 0.35);
};

/** Stage I: plate lift is mechanically coupled to subducting thrust at the pivot. */
const coupleStageOne = (pose: StackPose): StackPose => {
  const thrust = subductingThrust(pose.subducting.rotate);
  const plateLift = thrust * (STAGE_TARGETS['1'].plate.ty - REST.plate.ty);

  return {
    subducting: pose.subducting,
    plate: {
      ...pose.plate,
      ty: REST.plate.ty + plateLift,
    },
    anchorDelta: { ...REST.anchorDelta },
  };
};

/** Stage II: override thrust drives extra uplift on Stage III. */
const coupleStageTwo = (pose: StackPose): StackPose => {
  const thrust = plateThrust(pose.plate);
  const lift = thrust * (STAGE_TARGETS['2'].anchorDelta.ty - REST.anchorDelta.ty);
  const push = thrust * (STAGE_TARGETS['2'].anchorDelta.tx - REST.anchorDelta.tx);

  return {
    ...pose,
    anchorDelta: {
      ...pose.anchorDelta,
      ty: REST.anchorDelta.ty + lift,
      tx: REST.anchorDelta.tx + push,
    },
  };
};

const poseToTransform = ({ rotate = 0, tx, ty }: Pose2D) =>
  `rotate(${rotate}deg) translate(${tx}px, ${ty}px)`;

export type ObductionPhysicsOptions = {
  wrap: HTMLElement;
  svg: SVGSVGElement;
  onStageChange?: (stage: StageId | null) => void;
};

export function initObductionPhysics({
  wrap,
  svg,
  onStageChange,
}: ObductionPhysicsOptions) {
  const subducting = svg.querySelector<SVGGElement>('.subducting-body');
  const overridePlate = svg.querySelector<SVGGElement>('.stage-two-plate');
  const overrideArrow = svg.querySelector<SVGGElement>('.stage-two-arrow');
  const anchor = svg.querySelector<SVGGElement>('.stage-three-anchor');

  if (!subducting || !overridePlate || !overrideArrow || !anchor) return null;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const spring = reduced ? 1 : 0.16;

  let activeStage: StageId | null = null;
  let blend = 0;
  let targetBlend = 0;
  let rafId = 0;

  const applyPose = (pose: StackPose) => {
    subducting.style.transform = poseToTransform(pose.subducting);
    const plateTransform = poseToTransform(pose.plate);
    overridePlate.style.transform = plateTransform;
    overrideArrow.style.transform = plateTransform;
    anchor.style.transform = poseToTransform(pose.anchorDelta);
  };

  const resolvePose = (): StackPose => {
    if (!activeStage) return REST;
    const target = STAGE_TARGETS[activeStage];
    const blended = lerpStack(REST, target, blend);
    if (activeStage === '1') return coupleStageOne(blended);
    if (activeStage === '2') return coupleStageTwo(blended);
    return blended;
  };

  const getRangeGrow = (pose: StackPose): number => {
    if (!activeStage) return 0;
    if (activeStage === '1') return 0;
    if (activeStage === '2') return plateThrust(pose.plate) * 0.62;
    return blend;
  };

  const getCollisionThrust = (pose: StackPose): number => {
    if (!activeStage) return 0;
    if (activeStage === '1') return subductingThrust(pose.subducting.rotate);
    if (activeStage === '2') return plateThrust(pose.plate);
    return blend * 0.35;
  };

  const tick = () => {
    blend += (targetBlend - blend) * spring;
    if (Math.abs(targetBlend - blend) < 0.001) blend = targetBlend;

    const pose = resolvePose();
    applyPose(pose);
    wrap.style.setProperty('--collision-thrust', String(getCollisionThrust(pose)));
    wrap.style.setProperty('--range-grow', String(getRangeGrow(pose)));
    rafId = requestAnimationFrame(tick);
  };

  const setStage = (stage: StageId | null) => {
    activeStage = stage;
    targetBlend = stage ? 1 : 0;
    onStageChange?.(stage);
  };

  const enable = () => {
    wrap.classList.add('diagram-physics');
    subducting.style.transformOrigin = `${COLLISION_PIVOT.x}px ${COLLISION_PIVOT.y}px`;
    overridePlate.style.transformOrigin = `${PLATE_PIVOT.x}px ${PLATE_PIVOT.y}px`;
    overrideArrow.style.transformOrigin = `${PLATE_PIVOT.x}px ${PLATE_PIVOT.y}px`;
    anchor.style.transformOrigin = `${ANCHOR_PIVOT.x}px ${ANCHOR_PIVOT.y}px`;
    blend = 0;
    targetBlend = 0;
    applyPose(REST);
    wrap.style.setProperty('--range-grow', '0');
    wrap.style.setProperty('--collision-thrust', '0');
    if (!rafId) rafId = requestAnimationFrame(tick);
  };

  const disable = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    wrap.classList.remove('diagram-physics');
    wrap.style.removeProperty('--collision-thrust');
    wrap.style.removeProperty('--range-grow');
    for (const el of [subducting, overridePlate, overrideArrow, anchor]) {
      el.style.transform = '';
      el.style.transformOrigin = '';
    }
  };

  return { enable, disable, setStage, getBlend: () => blend };
}
