/**
 * WCAG 2.5.3 (Label in Name): when aria-label overrides visible text,
 * the accessible name must include that visible label.
 */
export function accessibleNameWithVisibleLabel(
  visibleLabel: string,
  descriptiveName?: string,
): string | undefined {
  const visible = visibleLabel.trim();
  if (!visible) return descriptiveName?.trim() || undefined;
  if (!descriptiveName) return undefined;

  const desc = descriptiveName.trim();
  if (!desc || desc === visible) return undefined;
  if (desc.toLowerCase().includes(visible.toLowerCase())) return desc;

  return `${visible}, ${desc}`;
}
