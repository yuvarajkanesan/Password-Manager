// Deep navy + electric teal — a vault-like, security-product palette.
// Gold is reserved for premium/highlight touches only (never status meaning).

export const LIGHT = {
  primary: '#0B3D5C',
  primaryLight: '#12617F',
  accent: '#17D9C4',
  accentSoft: '#D6FBF6',
  headerGradient: ['#0A2A45', '#0E4B66', '#12617F'],
  gold: '#C9A24B',
  goldSoft: '#F6ECD4',
  background: '#F3F6F8',
  card: '#FFFFFF',
  cardAlt: '#F7FAFB',
  text: '#101820',
  textSecondary: '#5C6B77',
  border: '#E1E8ED',
  tabBg: '#FFFFFF',
  tabActive: '#12617F',
  tabInactive: '#A4B2BC',
  white: '#FFFFFF',
  shadow: '#08202F',
  danger: '#E5484D',
  dangerSoft: '#FDE7E8',
  success: '#1FA971',
  warning: '#E2A03F',
  overlay: 'rgba(8,16,24,0.55)',
  inputBg: '#F3F6F8',
  personal: '#17D9C4',
  official: '#8B6BD8',
};

export const DARK = {
  primary: '#12617F',
  primaryLight: '#17869E',
  accent: '#22E8D1',
  accentSoft: '#12332F',
  headerGradient: ['#040E17', '#0A2338', '#0E3A4E'],
  gold: '#E3BE73',
  goldSoft: '#332B18',
  background: '#070C11',
  card: '#111A22',
  cardAlt: '#16212B',
  text: '#EAF2F6',
  textSecondary: '#8CA0AC',
  border: '#1E2C37',
  tabBg: '#0B141B',
  tabActive: '#22E8D1',
  tabInactive: '#4E606B',
  white: '#FFFFFF',
  shadow: '#000000',
  danger: '#F16569',
  dangerSoft: '#3A1618',
  success: '#3FCB8E',
  warning: '#E8B563',
  overlay: 'rgba(0,0,0,0.65)',
  inputBg: '#0E1922',
  personal: '#22E8D1',
  official: '#A78BFA',
};

export const COLORS = LIGHT;

// Shared elevation presets so every card/sheet/button uses consistent shadow depth
// instead of hand-rolled shadowRadius/opacity per screen. `color` should be
// colors.shadow from the active theme.
export function elevation(color: string, level: 'sm' | 'md' | 'lg' = 'md') {
  const presets = {
    sm: { shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    md: { shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7 },
    lg: { shadowOpacity: 0.24, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  };
  return { shadowColor: color, ...presets[level] };
}

export const RADIUS = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
