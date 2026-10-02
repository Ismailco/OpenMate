/**
 * Simple, zero-dependency class name joiner for strict conditional class lists.
 */
export function cn(
  ...classes: Array<string | boolean | undefined | null>
): string {
  return classes.filter(Boolean).join(' ');
}
