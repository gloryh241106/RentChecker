/** The date on the clock of this browser, as `YYYY-MM-DD`. */
export function todayText(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${String(now.getFullYear())}-${month}-${String(now.getDate()).padStart(2, '0')}`;
}
