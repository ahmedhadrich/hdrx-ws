import nextConfig from 'eslint-config-next';
import { fixupConfigRules } from '@eslint/compat';

export default [
  ...fixupConfigRules(nextConfig),
  {
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Initialization effects (localStorage, matchMedia, WebGL detection) are
      // valid synchronous setState patterns — not cascading renders.
      'react-hooks/set-state-in-effect': 'off',
      // Three.js objects returned from useLoader must be mutated (colorSpace,
      // anisotropy, etc.) — R3F depends on this pattern.
      'react-hooks/immutability': 'off',
    },
  },
];
