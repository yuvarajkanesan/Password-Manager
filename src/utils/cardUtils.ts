export function formatCardNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return (digits.match(/.{1,4}/g) || []).join(' ');
}

export function maskCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 4) return digits.padStart(4, '•');
  const last4 = digits.slice(-4);
  const groups = Math.ceil((digits.length - 4) / 4) + 1;
  const masked = '•'.repeat(digits.length - 4);
  const combined = masked + last4;
  return (combined.match(/.{1,4}/g) || []).join(' ');
}

export function formatCardNumberDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return (digits.match(/.{1,4}/g) || []).join(' ');
}

export function last4(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.slice(-4);
}
