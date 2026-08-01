const path = require('path');

module.exports = {
  // Frontend files (Next.js)
  'src/**/*.{js,jsx,ts,tsx}': [
    'eslint --fix',
  ],

  // Backend files — use a function to run eslint from the backend directory (Windows-compatible)
  'backend/src/**/*.{js,jsx,ts,tsx}': (filenames) => {
    const files = filenames
      .map((f) => path.relative(path.join(process.cwd(), 'backend'), f))
      .join(' ');
    return [`eslint --fix ${files}`];
  },
};
