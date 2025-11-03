const PRIMARY_GREEN = '#5DBB63';
const ACCENT_ORANGE = '#FF9F45';
const SECONDARY_YELLOW = '#FFD166';
const BG_LIGHT = '#FAFAFA';
const SURFACE = '#FFFFFF';
const TEXT_DARK = '#2E2E2E';
const MUTED_GRAY = '#A6A6A6';

export default {
  light: {
    text: TEXT_DARK,
    background: BG_LIGHT,
    tint: PRIMARY_GREEN,
    tabIconDefault: MUTED_GRAY,
    tabIconSelected: PRIMARY_GREEN,
    surface: SURFACE,
    muted: MUTED_GRAY,
    accent: ACCENT_ORANGE,
    secondary: SECONDARY_YELLOW,
  },
  dark: {
    text: '#ffffff',
    background: '#0b0b0b',
    tint: PRIMARY_GREEN,
    tabIconDefault: '#7a7a7a',
    tabIconSelected: PRIMARY_GREEN,
    surface: '#1a1a1a',
    muted: '#8a8a8a',
    accent: ACCENT_ORANGE,
    secondary: SECONDARY_YELLOW,
  },
};
