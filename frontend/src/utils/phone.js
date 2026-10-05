/**
 * Utility functions for Ethiopian phone number formatting and validation.
 * Standardizes inputs to 9 digits (excluding the country code +251 and leading zero).
 */

/**
 * Strips non-digits, country code 251, and leading zeros.
 * Returns at most 9 digits (e.g. "905338431" or "712345678").
 */
export function cleanPhoneDigits(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('251')) {
    digits = digits.slice(3);
  }
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

/**
 * Prepends +251 to 9-digit cleaned phone number to produce standardized E.164 format.
 * (e.g. "905338431" -> "+251905338431")
 */
export function formatE164Phone(val) {
  const digits = cleanPhoneDigits(val);
  return digits ? `+251${digits}` : '';
}

/**
 * Checks if the phone number has exactly 9 valid digits.
 */
export function isValidEthiopianDigits(val) {
  const digits = cleanPhoneDigits(val);
  return digits.length === 9;
}

/**
 * Formats a phone number cleanly for UI presentation.
 * (e.g. "+251905338431" -> "+251 90 533 8431")
 */
export function formatDisplayPhone(val) {
  if (!val) return '—';
  const digits = cleanPhoneDigits(val);
  if (digits.length === 9) {
    return `+251 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  return String(val);
}
