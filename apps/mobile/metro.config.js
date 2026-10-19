const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in monorepo
config.watchFolders = [monorepoRoot];

// 2. Resolve packages from both project and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const inputPath = path.resolve(projectRoot, 'src/global.css');
const configPath = path.resolve(projectRoot, 'tailwind.config.js');

const nwConfig = withNativeWind(config, {
  input: inputPath,
  configPath: configPath,
  projectRoot: projectRoot,
  forceWriteFileSystem: true,
});

// Use robust Windows-safe transformer for react-native-css-interop
nwConfig.transformerPath = path.resolve(projectRoot, 'metro-transformer.js');

// Windows path normalization guard for react-native-css-interop:
// Ensures resolved.filePath strictly equals options.input regardless of drive-letter casing or slashes
const nwResolveRequest = nwConfig.resolver?.resolveRequest;
if (nwResolveRequest) {
  nwConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    const originalCtxResolve = context.resolveRequest;
    const wrappedContext = {
      ...context,
      resolveRequest: (ctx, mod, plat) => {
        const resolved = (originalCtxResolve || ctx.resolveRequest)(ctx, mod, plat);
        if (
          resolved &&
          resolved.filePath &&
          typeof resolved.filePath === 'string' &&
          resolved.filePath.toLowerCase().replace(/\\/g, '/') === inputPath.toLowerCase().replace(/\\/g, '/')
        ) {
          return { ...resolved, filePath: inputPath };
        }
        return resolved;
      },
    };
    return nwResolveRequest(wrappedContext, moduleName, platform);
  };
}

module.exports = nwConfig;

