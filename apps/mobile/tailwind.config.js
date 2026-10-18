const path = require('path');

// Ensure TypeScript tokens can be imported in CommonJS config
try {
  // If tsx or esbuild-register/ts-node is available, use it
  if (!require.extensions['.ts']) {
    require('esbuild-register/dist/node').register();
  }
} catch {
  // Fallback: transpile or read directly if needed
}

let tokens;
try {
  tokens = require('../../packages/shared/src/tokens');
} catch (e) {
  // Try with .ts
  try {
    const fs = require('fs');
    const tsCode = fs.readFileSync(path.resolve(__dirname, '../../packages/shared/src/tokens.ts'), 'utf-8');
    // Fast regex extraction of colors, radii, spacing, mobileTypeScale
    // or compile via typescript module
    const ts = require('typescript');
    const jsCode = ts.transpileModule(tsCode, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const m = { exports: {} };
    const fn = new Function('module', 'exports', 'require', jsCode);
    fn(m, m.exports, require);
    tokens = m.exports;
  } catch (err) {
    console.error('Failed to load tokens.ts in tailwind.config.js:', err);
    throw err;
  }
}

const { colors, radii, spacing, mobileTypeScale } = tokens;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.primary,
          hover: colors['primary-hover'],
          soft: colors['primary-soft'],
        },
        accent: {
          DEFAULT: colors.accent,
          soft: colors['accent-soft'],
        },
        ink: {
          DEFAULT: colors.ink,
          muted: colors['ink-muted'],
        },
        surface: {
          DEFAULT: colors.surface,
          subtle: colors['surface-subtle'],
        },
        border: {
          DEFAULT: colors.border,
        },
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
      },
      borderRadius: {
        none: `${radii.none}px`,
        sm: `${radii.sm}px`,
        md: `${radii.md}px`,
        lg: `${radii.lg}px`,
        xl: `${radii.xl}px`,
        full: `${radii.full}px`,
      },
      spacing: {
        ...Object.fromEntries(
          Object.entries(spacing).map(([k, v]) => [k, `${v}px`])
        ),
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'NotoSansDevanagari_400Regular', 'System'],
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        devanagari: ['NotoSansDevanagari_400Regular'],
        'devanagari-medium': ['NotoSansDevanagari_500Medium'],
        'devanagari-semibold': ['NotoSansDevanagari_600SemiBold'],
        'devanagari-bold': ['NotoSansDevanagari_700Bold'],
      },
      fontSize: {
        display: [`${mobileTypeScale.display.fontSize}px`, { lineHeight: `${mobileTypeScale.display.lineHeight}px` }],
        h1: [`${mobileTypeScale.h1.fontSize}px`, { lineHeight: `${mobileTypeScale.h1.lineHeight}px` }],
        h2: [`${mobileTypeScale.h2.fontSize}px`, { lineHeight: `${mobileTypeScale.h2.lineHeight}px` }],
        h3: [`${mobileTypeScale.h3.fontSize}px`, { lineHeight: `${mobileTypeScale.h3.lineHeight}px` }],
        body: [`${mobileTypeScale.body.fontSize}px`, { lineHeight: `${mobileTypeScale.body.lineHeight}px` }],
        small: [`${mobileTypeScale.small.fontSize}px`, { lineHeight: `${mobileTypeScale.small.lineHeight}px` }],
        caption: [`${mobileTypeScale.caption.fontSize}px`, { lineHeight: `${mobileTypeScale.caption.lineHeight}px` }],
      },
    },
  },
  plugins: [],
};
