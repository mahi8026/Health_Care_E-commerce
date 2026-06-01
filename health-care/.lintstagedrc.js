module.exports = {
  // Frontend files (Next.js)
  'src/**/*.{js,jsx,ts,tsx}': [
    'eslint --fix --max-warnings 0',
  ],
  
  // Backend files
  'backend/src/**/*.{js,jsx,ts,tsx}': [
    'cd backend && eslint --fix --max-warnings 0',
  ],
};
