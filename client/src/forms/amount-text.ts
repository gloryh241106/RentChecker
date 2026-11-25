import { formatRupees } from '../shared.js';

/**
 * Whole units and hundredths as editable text, like `1,30,000` or `120.50`. The parsers accept
 * it back (D-3, D-22), so showing a stored value needs no rule of its own. Empty when absent.
 */
export function numberText(hundredths: number | undefined): string {
  return hundredths === undefined ? '' : formatRupees(hundredths).slice(1);
}
