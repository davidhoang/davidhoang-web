const vertexShader = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  uniform float time;
  uniform vec2 resolution;

  // Improved noise function for more organic patterns
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 st = gl_FragCoord.xy/resolution.xy;

    // Create multiple layers of noise
    float n1 = noise(st * 12.0 + time * 0.05);
    float n2 = noise(st * 24.0 - time * 0.08);

    // Combine noise layers with different intensities
    float finalNoise = mix(n1, n2, 0.5);

    // Create more contrast
    finalNoise = pow(finalNoise, 1.5);

    // Theme-aware colors (assuming we're in light mode)
    vec3 baseColor = vec3(0.98, 0.98, 0.98);
    vec3 noiseColor = vec3(0.92, 0.92, 0.92);

    // Add slight color variation
    vec3 tint = vec3(0.99, 0.98, 1.0);

    vec3 finalColor = mix(noiseColor, baseColor, finalNoise) * tint;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function initShader(): void {
  const canvas = document.getElementById('noiseCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const gl = canvas.getContext('webgl');
  if (!gl) return;

  // Create shader program
  const program = gl.createProgram();
  const vShader = gl.createShader(gl.VERTEX_SHADER);
  const fShader = gl.createShader(gl.FRAGMENT_SHADER);

  if (!program || !vShader || !fShader) {
    return;
  }

  gl.shaderSource(vShader, vertexShader);
  gl.shaderSource(fShader, fragmentShader);
  gl.compileShader(vShader);
  gl.compileShader(fShader);

  // Check for compilation errors
  if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
    return;
  }
  if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
    return;
  }

  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);

  // Check for linking errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return;
  }

  gl.useProgram(program);

  // Set up vertices
  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Set up attributes and uniforms
  const positionLocation = gl.getAttribLocation(program, 'position');
  if (positionLocation === -1) {
    return;
  }
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const timeLocation = gl.getUniformLocation(program, 'time');
  const resolutionLocation = gl.getUniformLocation(program, 'resolution');

  if (timeLocation === null || resolutionLocation === null) {
    return;
  }

  function resize() {
    if (!canvas || !gl) return;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);
  resize();

  // Animation loop (respect reduced motion)
  let startTime = Date.now();
  let shaderAnimationFrame: number | null = null;

  function animate() {
    if (!gl) return;
    const time = (Date.now() - startTime) * 0.001;
    gl.uniform1f(timeLocation, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    shaderAnimationFrame = requestAnimationFrame(animate);
  }

  // Pause shader animation when tab is not visible
  function handleShaderVisibility() {
    if (document.hidden) {
      if (shaderAnimationFrame) {
        cancelAnimationFrame(shaderAnimationFrame);
        shaderAnimationFrame = null;
      }
    } else {
      if (!shaderAnimationFrame) {
        shaderAnimationFrame = requestAnimationFrame(animate);
      }
    }
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    document.addEventListener('visibilitychange', handleShaderVisibility);
    animate();
  }
}
