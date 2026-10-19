import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const RNWebView = WebView as any;

export interface MathViewProps {
  content: string;
  fontSize?: number;
  color?: string;
  className?: string;
  minHeight?: number;
}

/**
 * Checks if a string contains LaTeX math delimiters ($...$, $$...$$, \(...\), \[...\], \frac, etc.)
 */
function containsMath(text: string): boolean {
  if (!text) return false;
  return (
    text.includes('$') ||
    text.includes('\\(') ||
    text.includes('\\[') ||
    text.includes('\\frac') ||
    text.includes('\\sqrt') ||
    text.includes('\\int') ||
    text.includes('\\alpha') ||
    text.includes('\\beta') ||
    text.includes('\\theta')
  );
}

/**
 * Escapes characters for HTML insertion
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates the HTML template containing KaTeX auto-render.
 */
function buildKaTeXHtml(initialContent: string, fontSize: number, color: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: ${fontSize}px;
      line-height: 1.5;
      color: ${color};
      overflow: hidden;
      word-break: break-word;
    }
    #math-wrapper {
      padding: 2px 0;
      display: inline-block;
      width: 100%;
    }
    .katex {
      font-size: 1.05em;
    }
    .katex-display {
      margin: 0.5em 0;
      overflow-x: auto;
      overflow-y: hidden;
    }
    p {
      margin: 0 0 0.5em 0;
    }
    p:last-child {
      margin-bottom: 0;
    }
  </style>
</head>
<body>
  <div id="math-wrapper">${escapeHtml(initialContent)}</div>

  <script>
    function renderMath() {
      if (typeof renderMathInElement !== 'function') {
        setTimeout(renderMath, 20);
        return;
      }
      var wrapper = document.getElementById('math-wrapper');
      renderMathInElement(wrapper, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\\\[', right: '\\\\]', display: true },
          { left: '\\\\(', right: '\\\\)', display: false }
        ],
        throwOnError: false
      });
      notifyHeight();
    }

    function notifyHeight() {
      var wrapper = document.getElementById('math-wrapper');
      var height = wrapper ? wrapper.offsetHeight : document.body.scrollHeight;
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HEIGHT', height: Math.max(height, 24) }));
      }
    }

    window.updateMath = function(rawText) {
      var wrapper = document.getElementById('math-wrapper');
      if (wrapper) {
        wrapper.textContent = rawText;
        renderMath();
      }
    };

    document.addEventListener("DOMContentLoaded", function() {
      renderMath();
      if (window.ResizeObserver) {
        new ResizeObserver(notifyHeight).observe(document.body);
      }
    });
  </script>
</body>
</html>
  `;
}

/**
 * Shared MathView component that renders Markdown & LaTeX via KaTeX in a measured WebView.
 * When switching questions, injectJavaScript updates content in-place without remounting the WebView,
 * eliminating visible lag on budget phones.
 */
export function MathView({
  content,
  fontSize = 15,
  color = '#1F2937',
  className = '',
  minHeight = 28,
}: MathViewProps) {
  const [measuredHeight, setMeasuredHeight] = useState<number>(minHeight);
  const webViewRef = useRef<WebView>(null);
  const isMath = useMemo(() => containsMath(content), [content]);

  // Update content dynamically via JavaScript bridge if WebView is already alive
  useEffect(() => {
    if (isMath && webViewRef.current) {
      const escaped = JSON.stringify(content);
      webViewRef.current.injectJavaScript(`
        if (window.updateMath) {
          window.updateMath(${escaped});
        }
        true;
      `);
    }
  }, [content, isMath]);

  // Fast path: If there is no math and content is simple plain text with line breaks
  if (!isMath) {
    return (
      <View className={className}>
        <Text
          style={{
            fontSize,
            color,
            lineHeight: fontSize * 1.45,
          }}
          className="font-normal"
        >
          {content}
        </Text>
      </View>
    );
  }

  const initialHtml = useMemo(
    () => buildKaTeXHtml(content, fontSize, color),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'HEIGHT' && typeof data.height === 'number') {
        const nextH = Math.ceil(data.height);
        if (Math.abs(nextH - measuredHeight) > 2) {
          setMeasuredHeight(nextH);
        }
      }
    } catch {
      // non-JSON message
    }
  };

  return (
    <View
      className={className}
      style={{
        height: measuredHeight,
        minHeight,
        overflow: 'hidden',
      }}
    >
      <RNWebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: initialHtml }}
        onMessage={handleMessage}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{
          backgroundColor: 'transparent',
          height: measuredHeight,
        }}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType={Platform.OS === 'android' ? 'software' : 'none'}
      />
    </View>
  );
}
