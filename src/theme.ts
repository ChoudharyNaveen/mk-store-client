import { createTheme, type PaletteMode } from '@mui/material/styles';

const getTheme = (mode: PaletteMode) =>
  createTheme({
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    palette: {
      mode,
      primary: {
        main: '#204564',
      },
      secondary: {
        main: '#FF4081',
      },
      ...(mode === 'dark'
        ? {
            background: {
              default: '#0d1117',
              paper: '#161b22',
            },
          }
        : {}),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 4,
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f7fa',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

const theme = getTheme('light');
export default theme;
export { getTheme };
