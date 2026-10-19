const fs = require('fs');
const path = require('path');

const dirs = [
  path.resolve(__dirname, '../node_modules/react-native-css-interop/.cache'),
  path.resolve(__dirname, '../../../node_modules/.pnpm/react-native-css-interop@0._f1a0c94c5ab199a61bf0dfc2279d81d8/node_modules/react-native-css-interop/.cache'),
];

dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) return;
  ['android.js', 'ios.js', 'native.js'].forEach((file) => {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) return;
    let content = fs.readFileSync(full, 'utf8').trim();
    if (content.startsWith('(') && content.endsWith(')')) {
      content = content.slice(1, -1);
    }
    if (!content.includes('injectData')) {
      const wrapped = `const { injectData } = require("react-native-css-interop/dist/runtime/native/styles");\ninjectData(${content});\n`;
      fs.writeFileSync(full, wrapped, 'utf8');
      console.log('Successfully updated cache file:', full);
    } else {
      console.log('Already had injectData:', full);
    }
  });
});
