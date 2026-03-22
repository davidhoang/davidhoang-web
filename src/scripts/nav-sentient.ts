export function initSentientNav(): (() => void) | undefined {
  const nav = document.querySelector('nav') as HTMLElement | null;
  if (!nav) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  if (window.innerWidth <= 768) return;

  let animationFrame: number | null = null;
  let isHovering = false;
  let mouseX = window.innerWidth / 2;
  let mouseY = 0;

  let currentX = 0;
  let currentY = 0;
  let currentTilt = 0;
  let currentGlow = 0;

  let targetX = 0;
  let targetY = 0;
  let targetTilt = 0;
  let targetGlow = 0;

  /** Pointer position inside nav (0–1), updated on nav mousemove / enter */
  let navLocalX = 0.5;
  let navLocalY = 0.5;
  /** Smoothed spotlight center for gradients */
  let glowPosX = 0.5;
  let glowPosY = 0.5;

  let breathePhase = 0;
  let lastTime = performance.now();

  const MAGNETIC_RANGE = 380;
  const MAX_OFFSET = 4.5;
  const MAX_TILT = 0.65;
  const IDLE_LERP = 0.068;
  const HOVER_LERP = 0.11;
  const GLOW_POS_LERP = 0.09;
  const GLOW_POS_RETURN = 0.048;
  const BREATHE_SPEED = 0.00072;
  const BREATHE_AMOUNT = 1.5;

  const HOVER_MAX_X = 6.5;
  const HOVER_MAX_Y = 5;
  const HOVER_MAX_TILT = 1.85;
  const HOVER_GLOW_BASE = 0.18;
  const HOVER_GLOW_EDGE = 0.1;

  function lerp(current: number, target: number, speed: number): number {
    return current + (target - current) * speed;
  }

  function updateNavLocalFromEvent(e: MouseEvent) {
    if (!nav) return;
    const r = nav.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    navLocalX = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    navLocalY = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
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

    const lerpSpeed = isHovering ? HOVER_LERP : IDLE_LERP;

    if (isHovering) {
      const nx = navLocalX - 0.5;
      const ny = navLocalY - 0.5;
      targetX = nx * HOVER_MAX_X;
      targetY = ny * HOVER_MAX_Y;
      targetTilt = nx * HOVER_MAX_TILT;
      const edge = Math.min(1, Math.hypot(nx * 2, ny * 2));
      targetGlow = HOVER_GLOW_BASE + edge * HOVER_GLOW_EDGE;
      glowPosX = lerp(glowPosX, navLocalX, GLOW_POS_LERP);
      glowPosY = lerp(glowPosY, navLocalY, GLOW_POS_LERP);
    } else if (distance < MAGNETIC_RANGE) {
      const pull = 1 - distance / MAGNETIC_RANGE;
      const easeOut = pull * pull * pull;

      targetX = (deltaX / MAGNETIC_RANGE) * MAX_OFFSET * easeOut;
      targetY = (deltaY / MAGNETIC_RANGE) * MAX_OFFSET * easeOut;
      targetTilt = (deltaX / MAGNETIC_RANGE) * MAX_TILT * easeOut;
      targetGlow = easeOut * 0.14;
      glowPosX = lerp(glowPosX, 0.5, GLOW_POS_RETURN * (1 + easeOut));
      glowPosY = lerp(glowPosY, 0.5, GLOW_POS_RETURN * (1 + easeOut));
    } else {
      breathePhase += BREATHE_SPEED * deltaTime;
      const breatheOffset = Math.sin(breathePhase) * BREATHE_AMOUNT;

      targetX = 0;
      targetY = breatheOffset;
      targetTilt = 0;
      targetGlow = 0;
      glowPosX = lerp(glowPosX, 0.5, GLOW_POS_RETURN * 0.75);
      glowPosY = lerp(glowPosY, 0.5, GLOW_POS_RETURN * 0.75);
    }

    currentX = lerp(currentX, targetX, lerpSpeed);
    currentY = lerp(currentY, targetY, lerpSpeed);
    currentTilt = lerp(currentTilt, targetTilt, lerpSpeed);
    currentGlow = lerp(currentGlow, targetGlow, lerpSpeed);

    nav.style.setProperty('--nav-float-x', `${currentX}px`);
    nav.style.setProperty('--nav-float-y', `${currentY}px`);
    nav.style.setProperty('--nav-tilt', `${currentTilt}deg`);
    nav.style.setProperty('--nav-glow-opacity', `${currentGlow}`);
    nav.style.setProperty('--nav-glow-x', `${glowPosX * 100}%`);
    nav.style.setProperty('--nav-glow-y', `${glowPosY * 100}%`);

    animationFrame = requestAnimationFrame(animate);
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function handleNavPointerEnter(e: MouseEvent) {
    isHovering = true;
    updateNavLocalFromEvent(e);
  }

  function handleNavPointerLeave() {
    isHovering = false;
  }

  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  nav.addEventListener('mouseenter', handleNavPointerEnter);
  nav.addEventListener('mousemove', updateNavLocalFromEvent, { passive: true });
  nav.addEventListener('mouseleave', handleNavPointerLeave);

  function handleVisibilityChange() {
    if (document.hidden) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    } else if (!animationFrame) {
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(animate);
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  nav.style.setProperty('--nav-glow-x', '50%');
  nav.style.setProperty('--nav-glow-y', '50%');

  animationFrame = requestAnimationFrame(animate);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    nav.removeEventListener('mouseenter', handleNavPointerEnter);
    nav.removeEventListener('mousemove', updateNavLocalFromEvent);
    nav.removeEventListener('mouseleave', handleNavPointerLeave);
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };
}
