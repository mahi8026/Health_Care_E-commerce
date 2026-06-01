module.exports = {
  // Frontend files (Next.js)
  'health-care/src/**/*.{js,jsx,ts,tsx}': [
    'cd health-care && npm run lint:fix',
  ],
  
  // Backend files
  'health-care/backend/src/**/*.{js,jsx,ts,tsx}': [
    'cd health-care/backend && npm run lint:fix',
  ],
};
