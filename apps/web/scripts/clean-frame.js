const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '../public/images/phone frame.original.svg');
let s = fs.readFileSync(originalPath, 'utf8');

// 1. In defs: remove mask #2a0779166e and its filters/clipPaths
s = s.replace(/<filter[^>]*id="415875d446"[\s\S]*?<\/filter>/g, '');
s = s.replace(/<filter[^>]*id="7b7c5af090"[\s\S]*?<\/filter>/g, '');
s = s.replace(/<clipPath[^>]*id="9f2450f77f"[\s\S]*?<\/clipPath>/g, '');
s = s.replace(/<mask[^>]*id="2a0779166e"[\s\S]*?<\/mask>/g, '');

// Also remove clipPaths related only to the embedded screen image
s = s.replace(/<clipPath[^>]*id="bcd199faa8"[\s\S]*?<\/clipPath>/g, '');
s = s.replace(/<clipPath[^>]*id="a41cacea43"[\s\S]*?<\/clipPath>/g, '');
s = s.replace(/<clipPath[^>]*id="54d5185a5a"[\s\S]*?<\/clipPath>/g, '');
s = s.replace(/<clipPath[^>]*id="3bb62f15b7"[\s\S]*?<\/clipPath>/g, '');

// In body:
// 2. Remove group 1: <g clip-path="url(#9f2450f77f)"> ... </g></g></g>
const g1Start = s.indexOf('<g clip-path="url(#9f2450f77f)">');
if (g1Start !== -1) {
  const g1End = s.indexOf('<g clip-path="url(#94d78366a4)">');
  s = s.slice(0, g1Start) + s.slice(g1End);
}

// 3. Remove screen image group: <g clip-path="url(#bcd199faa8)"> ... </g> up to <g clip-path="url(#c0938064ad)">
const g2Start = s.indexOf('<g clip-path="url(#bcd199faa8)">');
if (g2Start !== -1) {
  const g2End = s.indexOf('<g clip-path="url(#c0938064ad)">');
  s = s.slice(0, g2Start) + s.slice(g2End);
}

// Write the uncropped versions (viewBox 0 0 810 810)
fs.writeFileSync(path.join(__dirname, '../public/images/phone frame.svg'), s);
fs.writeFileSync(path.join(__dirname, '../public/images/phone-frame.svg'), s);

// Create the CROPPED phone frame:
// Bounding box: x: 200 to 610 (width: 410), y: 0 to 810 (height: 810)
// Replace width="1080", height="1080", and viewBox so intrinsic aspect ratio is exactly 410:810
let cropped = s
  .replace(/width="1080"/, 'width="410"')
  .replace(/height="1080"/, 'height="810"')
  .replace(/viewBox="0 0 810 [^"]+"/, 'viewBox="200 0 410 810"');

fs.writeFileSync(path.join(__dirname, '../public/images/phone-frame-cropped.svg'), cropped);

console.log('Successfully generated clean SVGs:');
console.log('1. phone frame.svg (810x810 viewBox, transparent screen)');
console.log('2. phone-frame-cropped.svg (410x810 viewBox & width/height, perfectly fitted)');
