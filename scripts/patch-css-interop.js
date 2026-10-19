const fs = require('fs');
const path = require('path');

const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm');
if (!fs.existsSync(pnpmDir)) {
  console.log('No .pnpm dir found');
  process.exit(0);
}

const entries = fs.readdirSync(pnpmDir);
let patchedCount = 0;

for (const entry of entries) {
  if (entry.startsWith('react-native-css-interop')) {
    const targetFile = path.join(
      pnpmDir,
      entry,
      'node_modules',
      'react-native-css-interop',
      'dist',
      'runtime',
      'native',
      'render-component.js'
    );

    if (fs.existsSync(targetFile)) {
      let content = fs.readFileSync(targetFile, 'utf8');
      if (content.includes('seen.delete(value);')) {
        content = content.replace(
          /function printUpgradeWarning\([\s\S]*?function getDebugReplacer\(\)/,
          `function printUpgradeWarning(warning, originalProps) {
    try {
        console.warn("CssInterop upgrade warning: " + warning);
    } catch {}
}
function stringify(object) {
    try {
        const seen = new WeakSet();
        return JSON.stringify(object, function replace(key, value) {
            if (key === "children") return "[Children]";
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return "[Circular]";
                seen.add(value);
            }
            return value;
        }, 2);
    } catch {
        return "[Object]";
    }
}
function getDebugReplacer()`
        );
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log('Successfully patched:', targetFile);
        patchedCount++;
      }
    }
  }
}

console.log('Patched ' + patchedCount + ' css-interop render-component.js files.');
