import type { CardNetwork } from '../types/vault';

export type CardOcrResult = {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  network: CardNetwork;
};

const NON_NAME_WORDS = [
  'VISA', 'MASTERCARD', 'MASTER', 'CARD', 'RUPAY', 'AMEX', 'AMERICAN', 'EXPRESS',
  'DEBIT', 'CREDIT', 'BANK', 'VALID', 'FROM', 'THRU', 'UNTIL', 'EXPIRY', 'EXP',
  'MEMBER', 'SINCE', 'PLATINUM', 'GOLD', 'SIGNATURE', 'CLASSIC', 'BUSINESS',
];

function detectNetwork(digits: string): CardNetwork {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(60|65|81|82|508)/.test(digits)) return 'RuPay';
  if (/^(34|37)/.test(digits)) return 'Amex';
  return 'Other';
}

// Best-effort extraction from raw OCR text — a photographed card is never as clean as a
// scanned document (glare, tilt, embossed digits), so every field this returns is meant
// to pre-fill an editable form, never to be trusted as final without the user's eyes on it.
export function parseCardText(rawText: string): CardOcrResult {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  let cardNumber = '';
  for (const line of lines) {
    const compact = line.replace(/[^0-9]/g, '');
    if (compact.length >= 13 && compact.length <= 19 && /^\d+$/.test(compact)) {
      // Prefer the longest plausible digit run on the card (avoids matching a shorter
      // phone-number-like sequence that happens to appear on some card designs).
      if (compact.length > cardNumber.length) cardNumber = compact;
    }
  }

  let expiryMonth = '';
  let expiryYear = '';
  const expiryMatch = rawText.match(/(0[1-9]|1[0-2])\s*\/\s*(\d{2,4})/);
  if (expiryMatch) {
    expiryMonth = expiryMatch[1];
    expiryYear = expiryMatch[2].length === 2 ? `20${expiryMatch[2]}` : expiryMatch[2];
  }

  let cardholderName = '';
  for (const line of lines) {
    const cleaned = line.replace(/[^A-Za-z\s.]/g, '').trim();
    const isAllCapsName =
      cleaned.length >= 4 &&
      cleaned.length <= 30 &&
      cleaned === cleaned.toUpperCase() &&
      /^[A-Z][A-Z\s.]+$/.test(cleaned) &&
      cleaned.split(/\s+/).length <= 4 &&
      !NON_NAME_WORDS.some(w => cleaned.includes(w));
    if (isAllCapsName && cleaned.length > cardholderName.length) cardholderName = cleaned;
  }

  return {
    cardNumber,
    expiryMonth,
    expiryYear,
    cardholderName,
    network: detectNetwork(cardNumber),
  };
}
