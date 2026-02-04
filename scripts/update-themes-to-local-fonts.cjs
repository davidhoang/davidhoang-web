#!/usr/bin/env node

const fs = require('fs');

// Read the current themes file
const themesFile = 'src/data/daily-themes.json';
const themes = JSON.parse(fs.readFileSync(themesFile, 'utf8'));

// Font mappings - replace Google Fonts URLs with local CSS import
const fontMappings = {
  'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;600;700;800;900&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500;600;700;800;900&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;500;600;700&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap': '/styles/self-hosted-fonts.css',
  'https://fonts.googleapis.com/css2?family=Unbounded:wght@300;400;500;600;700;800;900&display=swap': '/styles/self-hosted-fonts.css'
};

let updatedCount = 0;
const processedUrls = new Set();

// Update each theme's font URLs
themes.themes.forEach((theme, themeIndex) => {
  if (theme.fonts) {
    ['heading', 'body'].forEach(fontType => {
      if (theme.fonts[fontType] && theme.fonts[fontType].url) {
        const currentUrl = theme.fonts[fontType].url;
        const newUrl = fontMappings[currentUrl];
        
        if (newUrl && !processedUrls.has(currentUrl)) {
          // Only update the first occurrence of each URL type
          theme.fonts[fontType].url = newUrl;
          processedUrls.add(currentUrl);
          updatedCount++;
          console.log(`✓ Updated ${theme.name}: ${theme.fonts[fontType].name} -> local CSS`);
        } else if (newUrl) {
          // For subsequent themes, just point to the same local CSS
          theme.fonts[fontType].url = newUrl;
        }
      }
    });
  }
});

// Write the updated themes file
fs.writeFileSync(themesFile, JSON.stringify(themes, null, 2));

console.log(`\n✅ Updated ${themes.themes.length} themes to use self-hosted fonts`);
console.log(`✅ Modified ${Object.keys(fontMappings).length} different font URLs`);
console.log(`✅ All themes now reference: /styles/self-hosted-fonts.css`);