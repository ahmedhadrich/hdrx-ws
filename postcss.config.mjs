// No autoprefixer: Tailwind v4 / Lightning CSS already prefix. Running both
// produced `backdrop-filter` + `-webkit-` pairs that collapsed to the -webkit-
// form only, which Chrome ignores (every glass blur silently disappeared).
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
