interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
}

export function initParticleTrail(): (() => void) | undefined {
  const canvas = document.getElementById('particleCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Check for reduced motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Skip on mobile
  if (window.innerWidth <= 768) {
    canvas.style.display = 'none';
    return;
  }

  const particles: Particle[] = [];
  let mouseX = 0;
  let mouseY = 0;
  let isNearNav = false;
  let animationFrame: number | null = null;

  const NAV_PROXIMITY = 150; // How close to nav to spawn particles
  const SPAWN_RATE = 0.3; // Probability of spawning per frame when moving
  const MAX_PARTICLES = 50;

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = 200 * window.devicePixelRatio;
    ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      return {
        baseHue: 220,
        saturation: 60,
        lightness: 70,
        alpha: 0.6
      };
    } else {
      return {
        baseHue: 220,
        saturation: 50,
        lightness: 50,
        alpha: 0.4
      };
    }
  }

  function spawnParticle(x: number, y: number, velocityX: number, velocityY: number) {
    if (particles.length >= MAX_PARTICLES) return;

    const colors = getThemeColors();
    const hueVariation = (Math.random() - 0.5) * 40;

    particles.push({
      x,
      y,
      vx: velocityX * 0.1 + (Math.random() - 0.5) * 0.5,
      vy: velocityY * 0.1 + (Math.random() - 0.5) * 0.5 - 0.3,
      life: 1,
      maxLife: 60 + Math.random() * 40,
      size: 2 + Math.random() * 3,
      hue: colors.baseHue + hueVariation,
      saturation: colors.saturation + Math.random() * 20,
      lightness: colors.lightness + Math.random() * 20,
      alpha: colors.alpha
    });
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Add subtle floating motion
      p.vx += Math.sin(p.life * 0.1) * 0.02;
      p.vy += Math.cos(p.life * 0.1) * 0.01;

      p.life -= 1 / p.maxLife;

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    for (const p of particles) {
      const alpha = p.alpha * p.life * p.life;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${alpha * 0.5})`);
      gradient.addColorStop(1, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }
  }

  let lastMouseX = 0;
  let lastMouseY = 0;

  function animate() {
    const nav = document.querySelector('nav');
    if (nav) {
      const navRect = nav.getBoundingClientRect();
      const navCenterX = navRect.left + navRect.width / 2;
      const navCenterY = navRect.top + navRect.height / 2;

      const distanceToNavY = Math.abs(mouseY - navCenterY);
      const distanceToNavX = Math.abs(mouseX - navCenterX);
      isNearNav = distanceToNavY < NAV_PROXIMITY && distanceToNavX < navRect.width / 2 + NAV_PROXIMITY;

      if (isNearNav) {
        const velocityX = mouseX - lastMouseX;
        const velocityY = mouseY - lastMouseY;
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

        if (speed > 2 && Math.random() < SPAWN_RATE) {
          const spawnX = navRect.left + Math.random() * navRect.width;
          const spawnY = navRect.top + navRect.height / 2 + (Math.random() - 0.5) * navRect.height;
          spawnParticle(spawnX, spawnY, velocityX * 0.5, velocityY * 0.5);
        }

        if (Math.random() < 0.03) {
          const angle = Math.random() * Math.PI * 2;
          const radiusX = navRect.width / 2 + 10;
          const radiusY = navRect.height / 2 + 10;
          const spawnX = navCenterX + Math.cos(angle) * radiusX * (0.8 + Math.random() * 0.4);
          const spawnY = navCenterY + Math.sin(angle) * radiusY * (0.8 + Math.random() * 0.4);
          spawnParticle(spawnX, spawnY, 0, 0);
        }
      }
    }

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    updateParticles();
    drawParticles();
    animationFrame = requestAnimationFrame(animate);
  }

  function handleMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  // Resize handler
  window.addEventListener('resize', () => {
    resize();
    if (window.innerWidth <= 768) {
      canvas.style.display = 'none';
      if (animationFrame) cancelAnimationFrame(animationFrame);
    } else {
      canvas.style.display = 'block';
      if (!animationFrame) animationFrame = requestAnimationFrame(animate);
    }
  });

  document.addEventListener('mousemove', handleMouseMove, { passive: true });

  // Pause animation when tab is not visible
  function handleVisibilityChange() {
    if (document.hidden) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    } else {
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(animate);
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Initialize
  resize();
  animationFrame = requestAnimationFrame(animate);

  // Cleanup function
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };
}
