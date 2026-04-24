/**
 * Phone Number Normalization Utility
 * Standardizes all incoming numbers to E.164 format (+XXXXXXXXXXX)
 */

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters except the leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 0 and followed by digits, assume it needs a country code (+91 for India)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '+91' + cleaned.substring(1);
  }
  
  // If it's 10 digits without any code, assume +91
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    cleaned = '+91' + cleaned;
  }
  
  // If it's 12 digits starting with 91 but no +, add +
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = '+' + cleaned;
  }
  
  // Final check: ensure leading +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}
