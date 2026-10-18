import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  colors,
  radii,
  spacing,
  mobileTypeScale,
  webTypeScale,
  generateWebTokenCss,
} from '../packages/shared/src/tokens';

describe('Shared Design Tokens', () => {
  it('defines the required color palette matching the website', () => {
    expect(colors.primary).toBe('#3B82F6');
    expect(colors['primary-hover']).toBe('#2563EB');
    expect(colors['primary-soft']).toBe('#EFF6FF');
    expect(colors.accent).toBe('#F59E0B');
    expect(colors.ink).toBe('#1F2937');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.border).toBe('#E5E7EB');
    expect(colors.success).toBe('#15803D');
    expect(colors.warning).toBe('#B45309');
    expect(colors.danger).toBe('#B91C1C');
  });

  it('defines the required mobile type scale in sp (display 28/34, h1 24/30, h2 20/26, h3 17/24, body 15/22, small 13/18, caption 12/16)', () => {
    expect(mobileTypeScale.display.fontSize).toBe(28);
    expect(mobileTypeScale.display.lineHeight).toBe(34);

    expect(mobileTypeScale.h1.fontSize).toBe(24);
    expect(mobileTypeScale.h1.lineHeight).toBe(30);

    expect(mobileTypeScale.h2.fontSize).toBe(20);
    expect(mobileTypeScale.h2.lineHeight).toBe(26);

    expect(mobileTypeScale.h3.fontSize).toBe(17);
    expect(mobileTypeScale.h3.lineHeight).toBe(24);

    expect(mobileTypeScale.body.fontSize).toBe(15);
    expect(mobileTypeScale.body.lineHeight).toBe(22);

    expect(mobileTypeScale.small.fontSize).toBe(13);
    expect(mobileTypeScale.small.lineHeight).toBe(18);

    expect(mobileTypeScale.caption.fontSize).toBe(12);
    expect(mobileTypeScale.caption.lineHeight).toBe(16);
  });

  it('generates website tokens CSS that matches tokens.css on disk', () => {
    const generated = generateWebTokenCss();
    const tokenCssPath = path.resolve(__dirname, '../apps/web/src/styles/tokens.css');
    expect(fs.existsSync(tokenCssPath)).toBe(true);

    const onDisk = fs.readFileSync(tokenCssPath, 'utf-8');
    const normalize = (s: string) => s.replace(/\r\n/g, '\n').trim();
    expect(normalize(onDisk)).toBe(normalize(generated));
  });

  it('mobile tailwind configuration loads tokens directly and matches tokens.ts', () => {
    const tailwindConfig = require('../apps/mobile/tailwind.config.js');
    expect(tailwindConfig.theme.extend.colors.primary.DEFAULT).toBe(colors.primary);
    expect(tailwindConfig.theme.extend.colors.accent.DEFAULT).toBe(colors.accent);
    expect(tailwindConfig.theme.extend.colors.ink.DEFAULT).toBe(colors.ink);
    expect(tailwindConfig.theme.extend.fontSize.h1[0]).toBe('24px');
    expect(tailwindConfig.theme.extend.fontSize.h1[1].lineHeight).toBe('30px');
  });
});
