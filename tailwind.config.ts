import type { Config } from 'tailwindcss';

import { tailwindTheme } from './src/theme/tailwind-theme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: tailwindTheme as unknown as Config['theme'],
  },
  plugins: [],
};

export default config;
