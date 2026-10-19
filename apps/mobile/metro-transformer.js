const path = require('path');
const fs = require('fs');
const { tailwindCli } = require('nativewind/dist/metro/tailwind');
const { cssToReactNativeRuntime } = require('react-native-css-interop/dist/css-to-rn');

let cachedPlatformData = {};
let lastMtime = 0;
let cli = null;

function getCli() {
  if (!cli) {
    cli = tailwindCli(() => {});
  }
  return cli;
}

async function transform(config, projectRoot, filename, data, options) {
  const baseTransformer = config.cssInterop_transformerPath
    ? require(config.cssInterop_transformerPath).transform
    : require('metro-transform-worker').transform;

  const normalizedFilename = path.resolve(filename).toLowerCase().replace(/\\/g, '/');
  const isCssCache =
    normalizedFilename.includes('react-native-css-interop/.cache') ||
    normalizedFilename.endsWith('/android.js') ||
    normalizedFilename.endsWith('/ios.js') ||
    normalizedFilename.endsWith('/native.js');

  if (isCssCache) {
    const platform = options.platform || 'native';
    const inputPath = path.resolve(__dirname, 'src/global.css');

    let inputMtime = 0;
    try {
      inputMtime = fs.statSync(inputPath).mtimeMs;
    } catch {}

    if (inputMtime !== lastMtime) {
      cachedPlatformData = {};
      lastMtime = inputMtime;
    }

    let runtimeData = cachedPlatformData[platform];
    if (!runtimeData) {
      try {
        const css = await getCli().getCSSForPlatform({
          platform,
          input: inputPath,
          browserslist: 'last 1 version',
          browserslistEnv: 'native',
        });
        runtimeData = cssToReactNativeRuntime(css);
        cachedPlatformData[platform] = runtimeData;
      } catch (err) {
        console.error('[metro-transformer] Error compiling CSS for ' + platform, err);
        runtimeData = {};
      }
    }

    const fakeFile = `import { injectData } from "react-native-css-interop/dist/runtime/native/styles";\ninjectData(${JSON.stringify(runtimeData)});`;
    return baseTransformer(config, projectRoot, filename, Buffer.from(fakeFile), options);
  }

  return baseTransformer(config, projectRoot, filename, data, options);
}

module.exports = { transform };
