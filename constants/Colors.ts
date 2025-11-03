// Color Theme Palette
export const Colors = {
  primary: {
    green: '#5DBB63',
    orange: '#FF9F45',
    yellow: '#FFD166',
  },
  neutral: {
    backgroundLight: '#FAFAFA',
    cardSurface: '#FFFFFF',
    textDark: '#2E2E2E',
    mutedGray: '#A6A6A6',
  },
};

const tintColorLight = Colors.primary.green;
const tintColorDark = Colors.primary.green;

export default {
  light: {
    text: Colors.neutral.textDark,
    background: Colors.neutral.backgroundLight,
    card: Colors.neutral.cardSurface,
    tint: tintColorLight,
    tabIconDefault: Colors.neutral.mutedGray,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Colors.neutral.cardSurface,
    background: Colors.neutral.textDark,
    card: '#1E1E1E',
    tint: tintColorDark,
    tabIconDefault: Colors.neutral.mutedGray,
    tabIconSelected: tintColorDark,
  },
};
