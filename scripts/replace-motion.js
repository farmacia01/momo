const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Update import { motion ... }
      if (content.match(/import\s*\{\s*([^}]*)motion([^}]*)\s*\}\s*from\s*['"]framer-motion['"]/)) {
        content = content.replace(/import\s*\{\s*([^}]*)motion([^}]*)\s*\}\s*from\s*['"]framer-motion['"]/g, "import { $1m$2 } from 'framer-motion'");
        changed = true;
      }
      
      // Update <motion.div to <m.div
      if (content.includes('<motion.')) {
        content = content.replace(/<motion\./g, '<m.');
        changed = true;
      }
      if (content.includes('</motion.')) {
        content = content.replace(/<\/motion\./g, '</m.');
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

walk('./components');
walk('./app');
