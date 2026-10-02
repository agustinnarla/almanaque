// While a refetch is in flight the previous render stays on screen, dimmed:
// no skeleton, no layout jump.
export function dimWhile(active: boolean): string {
  return active ? 'opacity-50 transition-opacity' : 'transition-opacity'
}
