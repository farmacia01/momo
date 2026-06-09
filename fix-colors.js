const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDirs = [
  path.join(__dirname, 'app', '(app)'),
  path.join(__dirname, 'components'),
];

const replacements = [
  { rx: /\bbg-white\b/g, replacement: 'bg-surface' },
  { rx: /\bbg-slate-50\b/g, replacement: 'bg-surface-mid' },
  { rx: /\bbg-slate-100\b/g, replacement: 'bg-surface-border' },
  { rx: /\btext-slate-900\b/g, replacement: 'text-text' },
  { rx: /\btext-slate-500\b/g, replacement: 'text-muted' },
  { rx: /\btext-slate-400\b/g, replacement: 'text-dim' },
  { rx: /\bborder-slate-50\b/g, replacement: 'border-surface-border' },
  { rx: /\bborder-slate-100\b/g, replacement: 'border-surface-border' },
  { rx: /\bbg-gray-50\b/g, replacement: 'bg-surface-mid' },
  { rx: /\bbg-gray-100\b/g, replacement: 'bg-surface-border' },
  { rx: /\btext-gray-900\b/g, replacement: 'text-text' },
  { rx: /\btext-gray-500\b/g, replacement: 'text-muted' },
  { rx: /\btext-gray-400\b/g, replacement: 'text-dim' },
  { rx: /\bborder-gray-50\b/g, replacement: 'border-surface-border' },
  { rx: /\btext-forest\b/g, replacement: 'text-ember' },
  { rx: /\bbg-forest\b/g, replacement: 'bg-ember' },
  { rx: /\bbg-\[\#1c4d2e\]\b/g, replacement: 'bg-ember' },
];

targetDirs.forEach(dir => {
  walkDir(dir, (filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      replacements.forEach(({ rx, replacement }) => {
        content = content.replace(rx, replacement);
      });

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  });
});
