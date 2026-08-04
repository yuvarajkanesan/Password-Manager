export type GeneratorOptions = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

const SETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijkmnpqrstuvwxyz',
  numbers: '23456789',
  symbols: '!@#$%^&*()-_=+[]{}?',
};

// Crypto-grade randomness isn't necessary here — generated passwords are shown to the
// user to copy/edit, not derived into key material, so Math.random-based sampling is
// an acceptable tradeoff to avoid pulling in a native RNG polyfill for this one path.
export function generatePassword(options: GeneratorOptions): string {
  const pools = Object.entries(options)
    .filter(([key, on]) => key !== 'length' && on)
    .map(([key]) => SETS[key as keyof typeof SETS]);

  if (pools.length === 0) return '';

  const allChars = pools.join('');
  const chars: string[] = [];

  // Guarantee at least one char from each selected pool, then fill the rest randomly.
  for (const pool of pools) {
    chars.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  while (chars.length < options.length) {
    chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Fisher-Yates shuffle so the guaranteed chars aren't always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.slice(0, options.length).join('');
}

export type StrengthResult = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';
};

export function calculateStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: 'Very weak' };

  let variety = 0;
  if (/[a-z]/.test(password)) variety++;
  if (/[A-Z]/.test(password)) variety++;
  if (/[0-9]/.test(password)) variety++;
  if (/[^a-zA-Z0-9]/.test(password)) variety++;

  const lengthScore = password.length >= 16 ? 2 : password.length >= 10 ? 1.5 : password.length >= 6 ? 1 : 0;
  const raw = lengthScore + variety * 0.7;

  const score = Math.max(0, Math.min(4, Math.round(raw))) as StrengthResult['score'];
  const labels: StrengthResult['label'][] = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  return { score, label: labels[score] };
}
