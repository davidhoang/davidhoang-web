export function initSentientNav(): (() => void) | undefined {
  const nav = document.querySelector('nav') as HTMLElement | null;
  if (!nav) return;

  // Check for reduced motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Skip on mobile
  if (window.innerWidth <= 768) return;

  let animationFrame: number | null = null;
  let isHovering = false;
  let mouseX = window.innerWidth / 2;
  let mouseY = 0;

  // Current values (for smooth interpolation)
  let currentX = 0;
  let currentY = 0;
  let currentTilt = 0;
  let currentGlow = 0;

  // Target values
  let targetX = 0;
  let targetY = 0;
  let targetTilt = 0;
  let targetGlow = 0;

  // Breathing animation state
  let breathePhase = 0;
  let lastTime = performance.now();

  const MAGNETIC_RANGE = 350;
  const MAX_OFFSET = 6;
  const MAX_TILT = 1;
  const LERP_SPEED = 0.08;
  const BREATHE_SPEED = 0.0008;
  const BREATHE_AMOUNT = 2;

  function lerp(current: number, target: number, speed: number): number {
    return current + (target - current) * speed;
  }

  function animate(time: number) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!nav) return;

    const navRect = nav.getBoundingClientRect();
    const navCenterX = navRect.left + navRect.width / 2;
    const navCenterY = navRect.top + navRect.height / 2;

    const deltaX = mouseX - navCenterX;
    const deltaY = mouseY - navCenterY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!isHovering && distance < MAGNETIC_RANGE) {
      const pull = 1 - (distance / MAGNETIC_RANGE);
      const easeOut = pull * pull * pull;

      targetX = (deltaX / MAGNETIC_RANGE) * MAX_OFFSET * easeOut;
      targetY = (deltaY / MAGNETIC_RANGE) * MAX_OFFSET * easeOut;
      targetTilt = (deltaX / MAGNETIC_RANGE) * MAX_TILT * easeOut;
      targetGlow = easeOut * 0.12;
    } else if (!isHovering) {
      breathePhase += BREATHE_SPEED * deltaTime;
      const breatheOffset = Math.sin(breathePhase) * BREATHE_AMOUNT;

      targetX = 0;
      targetY = breatheOffset;
      targetTilt = 0;
      targetGlow = 0;
    } else {
      targetX = 0;
      targetY = 0;
      targetTilt = 0;
      targetGlow = 0.15;
    }

    currentX = lerp(currentX, targetX, LERP_SPEED);
    currentY = lerp(currentY, targetY, LERP_SPEED);
    currentTilt = lerp(currentTilt, targetTilt, LERP_SPEED);
    currentGlow = lerp(currentGlow, targetGlow, LERP_SPEED);

    nav.style.setProperty('--nav-float-x', `${currentX}px`);
    nav.style.setProperty('--nav-float-y', `${currentY}px`);
    nav.style.setProperty('--nav-tilt', `${currentTilt}deg`);
    nav.style.setProperty('--nav-glow-opacity', `${currentGlow}`);

    animationFrame = requestAnimationFrame(animate);
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function handleMouseEnter() {
    isHovering = true;
  }

  function handleMouseLeave() {
    isHovering = false;
  }

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  nav.addEventListener('mouseenter', handleMouseEnter);
  nav.addEventListener('mouseleave', handleMouseLeave);

  // Pause animation when tab is not visible
  function handleVisibilityChange() {
    if (document.hidden) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    } else {
      if (!animationFrame) {
        lastTime = performance.now();
        animationFrame = requestAnimationFrame(animate);
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Start animation loop
  animationFrame = requestAnimationFrame(animate);

  // Cleanup function for page transitions
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    nav.removeEventListener('mouseenter', handleMouseEnter);
    nav.removeEventListener('mouseleave', handleMouseLeave);
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };
}
