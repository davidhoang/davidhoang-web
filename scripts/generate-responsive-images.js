#!/usr/bin/env node

/**
 * Generate Responsive Image Variants
 * 
 * Creates multiple sizes of hero images for responsive srcset optimization.
 * Uses sharp for high-quality image processing.
 */

import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Image sizes to generate
const HERO_SIZES = [768, 1280, 1920, 2560];
const CONTENT_SIZES = [400, 800, 1200];

// Directories to process
const DIRECTORIES = [
  {
    input: './public/images/header-images',
    output: './public/images/header-images', 
    sizes: HERO_SIZES,
    type: 'hero'
  },
  {
    input: './public/images/highlights',
    output: './public/images/highlights',
    sizes: CONTENT_SIZES,
    type: 'content'
  }
];

/**
 * Generate responsive variants for a single image
 */
async function generateVariants(inputPath, outputDir, sizes, filename) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`Processing: ${filename} (${metadata.width}x${metadata.height})`);
    
    // Generate each size
    const promises = sizes.map(async (width) => {
      // Skip if original is smaller than target width
      if (metadata.width && metadata.width < width) {
        console.log(`  Skipping ${width}w (original is smaller)`);
        return;
      }
      
      const basename = path.parse(filename).name;
      const outputFilename = `${basename}-${width}w.webp`;
      const outputPath = path.join(outputDir, outputFilename);
      
      // Check if file already exists and is newer
      try {
        const outputStat = await fs.stat(outputPath);
        const inputStat = await fs.stat(inputPath);
        if (outputStat.mtime > inputStat.mtime) {
          console.log(`  ${width}w: ✅ Up to date`);
          return;
        }
      } catch (e) {
        // File doesn't exist, will create
      }
      
      await image
        .clone()
        .resize(width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ 
          quality: 85,
          effort: 6
        })
        .toFile(outputPath);
        
      const newMetadata = await sharp(outputPath).metadata();
      console.log(`  ${width}w: ✅ Generated (${newMetadata.width}x${newMetadata.height})`);
    });
    
    await Promise.all(promises);
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  }
}

/**
 * Process all images in a directory
 */
async function processDirectory(config) {
  try {
    const files = await fs.readdir(config.input);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|webp)$/i.test(file) && 
      !/-\d+w\.webp$/.test(file) // Skip already generated variants
    );
    
    console.log(`\n📁 Processing ${config.type} images in ${config.input}`);
    console.log(`Found ${imageFiles.length} images`);
    
    for (const file of imageFiles) {
      const inputPath = path.join(config.input, file);
      await generateVariants(inputPath, config.output, config.sizes, file);
    }
    
  } catch (error) {
    console.error(`Error processing directory ${config.input}:`, error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Generating responsive image variants...\n');
  
  // Check if sharp is installed
  try {
    await import('sharp');
  } catch (e) {
    console.error('❌ Sharp is not installed. Run: npm install sharp');
    process.exit(1);
  }
  
  // Process all configured directories
  for (const config of DIRECTORIES) {
    await processDirectory(config);
  }
  
  console.log('\n✅ Responsive image generation complete!');
  console.log('\nNext steps:');
  console.log('1. Update components to use the new responsive image utilities');
  console.log('2. Test loading performance across different screen sizes');
  console.log('3. Add preload hints for critical hero images');
}

// Run if called directly  
main().catch(console.error);

export { generateVariants, processDirectory };