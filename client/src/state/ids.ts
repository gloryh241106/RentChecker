/** DATA_MODEL.md: 1 to 40 characters of letters, digits, `-` or `_`. A UUID fits. */
export function newId(): string {
  return crypto.randomUUID();
}
