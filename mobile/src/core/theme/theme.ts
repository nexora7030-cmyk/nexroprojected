import Colors from './colors';

const Theme = {
  colors: Colors,

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },  radius: {
    sm: 8,
    md: 14,
    lg: 20,
  },

  shadows: {
    card: {
      shadowColor: Colors.glassShadow,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 5,
    },

    button: {
      shadowColor: Colors.accentShadow,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },
  },
};

export default Theme;
