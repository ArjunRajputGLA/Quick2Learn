import * as fs from 'fs';
import * as path from 'path';
import { generateWebTokenCss } from '../packages/shared/src/tokens.ts';

const TARGET_FILE = path.resolve(__dirname, '../apps/web/src/styles/tokens.css');
const isCheckOnly = process.argv.includes('--check');

const newContent = generateWebTokenCss();

if (isCheckOnly) {
  if (!fs.existsSync(TARGET_FILE)) {
    console.error(`❌ Token check failed: ${TARGET_FILE} does not exist. Run "pnpm tokens:build" to generate it.`);
    process.exit(1);
  }
  const existingContent = fs.readFileSync(TARGET_FILE, 'utf-8');
  // Normalize line endings for cross-platform comparison
  const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
  if (normalize(existingContent) !== normalize(newContent)) {
    console.error(`❌ Token check failed: ${TARGET_FILE} is out of date. Run "pnpm tokens:build" to regenerate it.`);
    process.exit(1);
  }
  console.log(`✅ Token check passed: ${TARGET_FILE} is up to date.`);
  process.exit(0);
}

fs.writeFileSync(TARGET_FILE, newContent, 'utf-8');
console.log(`✅ Tokens built successfully -> ${TARGET_FILE}`);
