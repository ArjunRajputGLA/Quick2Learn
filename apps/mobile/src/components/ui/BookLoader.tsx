import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export interface BookLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

function getLoaderHtml(text: string, scale: number = 0.85): string {
  const safeText = text ? text.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Loading';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-user-select: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    .wrapper {
      transform: scale(${scale});
      transform-origin: center center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .loader {
      --background: linear-gradient(135deg, #23C4F8, #275EFE);
      --shadow: rgba(39, 94, 254, 0.28);
      --text: #64748B;
      --page: rgba(255, 255, 255, 0.36);
      --page-fold: rgba(255, 255, 255, 0.52);
      --duration: 3s;
      width: 200px;
      height: 140px;
      position: relative;
    }

    .loader:before, .loader:after {
      --r: -6deg;
      content: "";
      position: absolute;
      bottom: 8px;
      width: 120px;
      top: 80%;
      box-shadow: 0 16px 12px var(--shadow);
      transform: rotate(var(--r));
    }

    .loader:before {
      left: 4px;
    }

    .loader:after {
      --r: 6deg;
      right: 4px;
    }

    .loader div {
      width: 100%;
      height: 100%;
      border-radius: 13px;
      position: relative;
      z-index: 1;
      perspective: 600px;
      box-shadow: 0 4px 6px var(--shadow);
      background-image: var(--background);
    }

    .loader div ul {
      margin: 0;
      padding: 0;
      list-style: none;
      position: relative;
    }

    .loader div ul li {
      --r: 180deg;
      --o: 0;
      --c: var(--page);
      position: absolute;
      top: 10px;
      left: 10px;
      transform-origin: 100% 50%;
      color: var(--c);
      opacity: var(--o);
      transform: rotateY(var(--r));
      -webkit-animation: var(--duration) ease infinite;
      animation: var(--duration) ease infinite;
    }

    .loader div ul li:nth-child(2) {
      --c: var(--page-fold);
      -webkit-animation-name: page-2;
      animation-name: page-2;
    }

    .loader div ul li:nth-child(3) {
      --c: var(--page-fold);
      -webkit-animation-name: page-3;
      animation-name: page-3;
    }

    .loader div ul li:nth-child(4) {
      --c: var(--page-fold);
      -webkit-animation-name: page-4;
      animation-name: page-4;
    }

    .loader div ul li:nth-child(5) {
      --c: var(--page-fold);
      -webkit-animation-name: page-5;
      animation-name: page-5;
    }

    .loader div ul li svg {
      width: 90px;
      height: 120px;
      display: block;
    }

    .loader div ul li:first-child {
      --r: 0deg;
      --o: 1;
    }

    .loader div ul li:last-child {
      --o: 1;
    }

    .loader span {
      display: block;
      left: 0;
      right: 0;
      top: 100%;
      margin-top: 20px;
      text-align: center;
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.4px;
    }

    @keyframes page-2 {
      0% {
        transform: rotateY(180deg);
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      35%, 100% {
        opacity: 0;
      }
      50%, 100% {
        transform: rotateY(0deg);
      }
    }

    @keyframes page-3 {
      15% {
        transform: rotateY(180deg);
        opacity: 0;
      }
      35% {
        opacity: 1;
      }
      50%, 100% {
        opacity: 0;
      }
      65%, 100% {
        transform: rotateY(0deg);
      }
    }

    @keyframes page-4 {
      30% {
        transform: rotateY(180deg);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      65%, 100% {
        opacity: 0;
      }
      80%, 100% {
        transform: rotateY(0deg);
      }
    }

    @keyframes page-5 {
      45% {
        transform: rotateY(180deg);
        opacity: 0;
      }
      65% {
        opacity: 1;
      }
      80%, 100% {
        opacity: 0;
      }
      95%, 100% {
        transform: rotateY(0deg);
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="loader">
      <div>
        <ul>
          <li>
            <svg fill="currentColor" viewBox="0 0 90 120">
              <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
            </svg>
          </li>
          <li>
            <svg fill="currentColor" viewBox="0 0 90 120">
              <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
            </svg>
          </li>
          <li>
            <svg fill="currentColor" viewBox="0 0 90 120">
              <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
            </svg>
          </li>
          <li>
            <svg fill="currentColor" viewBox="0 0 90 120">
              <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
            </svg>
          </li>
          <li>
            <svg fill="currentColor" viewBox="0 0 90 120">
              <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
            </svg>
          </li>
          <li>
            <svg fill="currentColor" viewBox="0 0 90 120">
              <path d="M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z" />
            </svg>
          </li>
        </ul>
      </div>
      <span>${safeText}</span>
    </div>
  </div>
</body>
</html>`;
}

export function BookLoader({
  text = 'Loading',
  size = 'md',
  fullScreen = false,
  style,
}: BookLoaderProps) {
  const { scale, width, height } = useMemo(() => {
    switch (size) {
      case 'sm':
        return { scale: 0.65, width: 170, height: 140 };
      case 'lg':
        return { scale: 1.0, width: 240, height: 200 };
      case 'md':
      default:
        return { scale: 0.82, width: 205, height: 170 };
    }
  }, [size]);

  const html = useMemo(() => getLoaderHtml(text, scale), [text, scale]);

  const content = (
    <View
      style={[
        styles.loaderContainer,
        { width, height },
        fullScreen && styles.fullScreenContainer,
        style,
      ]}
      pointerEvents="none"
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={[styles.webView, { width, height }]}
        containerStyle={[styles.webViewContainer, { width, height }]}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit={false}
        androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
      />
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenWrapper}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  fullScreenWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  fullScreenContainer: {
    alignSelf: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  webViewContainer: {
    backgroundColor: 'transparent',
  },
});

export { BookLoader as Loader };
export default BookLoader;
