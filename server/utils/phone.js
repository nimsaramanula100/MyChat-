export function normalizePhoneNumber(phoneInput, defaultCountryCode = '+94') {
  if (!phoneInput) return '';

  // Clean string: remove spaces, dashes, parens
  let cleaned = phoneInput.toString().trim().replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }

  if (cleaned.startsWith('0')) {
    return defaultCountryCode + cleaned.slice(1);
  }

  if (!cleaned.startsWith('+')) {
    return defaultCountryCode + cleaned;
  }

  return cleaned;
}
