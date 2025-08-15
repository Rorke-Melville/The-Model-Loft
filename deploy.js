const fs = require('fs');
const { execSync } = require('child_process');

// Build the project
console.log('Building project...');
execSync('next build', { stdio: 'inherit' });

// Create empty .nojekyll file
console.log('Creating .nojekyll file...');
fs.writeFileSync('out/.nojekyll', '');

// Deploy to gh-pages
console.log('Deploying to gh-pages...');
execSync('gh-pages -d out -b gh-pages --dotfiles', { stdio: 'inherit' });

console.log('Deployment complete!');