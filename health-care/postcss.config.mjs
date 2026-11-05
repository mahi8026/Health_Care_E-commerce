// Tailwind CSS v4 PostCSS plugin.
//
// v4 moved the PostCSS integration out of the `tailwindcss` package into
// `@tailwindcss/postcss`. The old `tailwindcss: {}` plugin entry no longer
// exists in v4 and makes PostCSS fail with:
//   "Cannot find module 'tailwindcss' ..." / "tailwindcss is not a PostCSS plugin".
//
// Autoprefixer is intentionally NOT listed: since v4, the Tailwind PostCSS
// plugin runs its output through Lightning CSS, which already applies the
// vendor prefixes the project needs. Running Autoprefixer as well would
// prefix the stylesheet twice.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
