import { visit } from 'unist-util-visit';
import path from 'path';

export function remarkImagePath() {
  return function (tree, file) {
    visit(tree, 'image', (node) => {
      // Convert relative paths to absolute
      if (node.url.startsWith('../../assets/blog/')) {
        const imageName = path.basename(node.url);
        node.url = `/assets/blog/${imageName}`;
      }
    });
  };
} 