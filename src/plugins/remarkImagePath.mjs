import { visit } from 'unist-util-visit';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));

function normalizeRelativePath(fromDir, toPath) {
  const relativePath = path.relative(fromDir, toPath).split(path.sep).join('/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

export function remarkImagePath() {
  return function (tree, file) {
    visit(tree, 'image', (node) => {
      if (!node.url || /^(https?:|data:|#)/i.test(node.url)) return;

      // Upgrade public-form Markdown image paths to the matching src/assets
      // file so Astro can infer dimensions and generate responsive variants.
      if (node.url.startsWith('/images/')) {
        const assetPath = path.join(projectRoot, 'src/assets', node.url.slice(1));
        const sourcePath = file.history?.[0] || file.path;
        if (sourcePath && existsSync(assetPath)) {
          node.url = normalizeRelativePath(path.dirname(sourcePath), assetPath);
        }
        return;
      }

      // Convert relative paths to absolute
      if (node.url.startsWith('../../assets/blog/')) {
        const imageName = path.basename(node.url);
        node.url = `/assets/blog/${imageName}`;
      }
    });
  };
} 
