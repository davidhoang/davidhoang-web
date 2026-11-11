/** Daily-theme hero image overlays (waves / paper / grain), not site-wide backgrounds. */
export function heroShaderTypeNeedsOverlay(shaderType: string | null | undefined): boolean {
  return shaderType === 'waves' || shaderType === 'paper' || shaderType === 'grain';
}
