import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  StyleSheet,
  Platform,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

export interface BookLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const PAGE_PATH =
  'M90,0 L90,120 L11,120 C4.92486775,120 0,115.075132 0,109 L0,11 C0,4.92486775 4.92486775,0 11,0 L90,0 Z M71.5,81 L18.5,81 C17.1192881,81 16,82.1192881 16,83.5 C16,84.8254834 17.0315359,85.9100387 18.3356243,85.9946823 L18.5,86 L71.5,86 C72.8807119,86 74,84.8807119 74,83.5 C74,82.1745166 72.9684641,81.0899613 71.6643757,81.0053177 L71.5,81 Z M71.5,57 L18.5,57 C17.1192881,57 16,58.1192881 16,59.5 C16,60.8254834 17.0315359,61.9100387 18.3356243,61.9946823 L18.5,62 L71.5,62 C72.8807119,62 74,60.8807119 74,59.5 C74,58.1192881 72.8807119,57 71.5,57 Z M71.5,33 L18.5,33 C17.1192881,33 16,34.1192881 16,35.5 C16,36.8254834 17.0315359,37.9100387 18.3356243,37.9946823 L18.5,38 L71.5,38 C72.8807119,38 74,36.8807119 74,35.5 C74,34.1192881 72.8807119,33 71.5,33 Z';

const PageSvg = ({ fill }: { fill: string }) => (
  <Svg width={90} height={120} viewBox="0 0 90 120">
    <Path d={PAGE_PATH} fill={fill} />
  </Svg>
);

export function BookLoader({
  text = 'Loading',
  size = 'md',
  fullScreen = false,
  style,
  className = '',
}: BookLoaderProps) {
  const scale = size === 'lg' ? 1.0 : size === 'sm' ? 0.65 : 0.82;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    anim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // Web Render: Native CSS Keyframes for 100% reliable hardware-accelerated 3D flip animation
  if (Platform.OS === 'web') {
    const webContent = (
      <div className={`book-loader-wrapper ${className}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`
          .book-loader-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loader {
            --background: linear-gradient(135deg, #23C4F8, #275EFE);
            --shadow: rgba(39, 94, 254, 0.28);
            --text: #6C7486;
            --page: rgba(255, 255, 255, 0.36);
            --page-fold: rgba(255, 255, 255, 0.52);
            --duration: 3s;
            width: 200px;
            height: 140px;
            position: relative;
            transform: scale(${scale});
            transform-origin: center center;
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
            font-family: inherit;
            font-size: 13.5px;
            font-weight: 600;
            letter-spacing: 0.3px;
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
        `}</style>
        <div className="loader">
          <div>
            <ul>
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <li key={idx}>
                  <svg fill="currentColor" viewBox="0 0 90 120">
                    <path d={PAGE_PATH} />
                  </svg>
                </li>
              ))}
            </ul>
          </div>
          {Boolean(text) && <span>{text}</span>}
        </div>
      </div>
    );

    if (fullScreen) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          {webContent}
        </div>
      );
    }

    return webContent;
  }

  // Native Render (Android & iOS): Direct spine-pivot 3D rotation with native driver
  // Page 2: flips 0% -> 50%
  const rot2 = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '0deg', '0deg'],
  });
  const op2 = anim.interpolate({
    inputRange: [0, 0.2, 0.35, 0.5, 1],
    outputRange: [0, 1, 0, 0, 0],
  });

  // Page 3: flips 15% -> 65%
  const rot3 = anim.interpolate({
    inputRange: [0, 0.15, 0.65, 1],
    outputRange: ['180deg', '180deg', '0deg', '0deg'],
  });
  const op3 = anim.interpolate({
    inputRange: [0, 0.15, 0.35, 0.5, 1],
    outputRange: [0, 0, 1, 0, 0],
  });

  // Page 4: flips 30% -> 80%
  const rot4 = anim.interpolate({
    inputRange: [0, 0.3, 0.8, 1],
    outputRange: ['180deg', '180deg', '0deg', '0deg'],
  });
  const op4 = anim.interpolate({
    inputRange: [0, 0.3, 0.5, 0.65, 1],
    outputRange: [0, 0, 1, 0, 0],
  });

  // Page 5: flips 45% -> 95%
  const rot5 = anim.interpolate({
    inputRange: [0, 0.45, 0.95, 1],
    outputRange: ['180deg', '180deg', '0deg', '0deg'],
  });
  const op5 = anim.interpolate({
    inputRange: [0, 0.45, 0.65, 0.8, 1],
    outputRange: [0, 0, 1, 0, 0],
  });

  const content = (
    <View style={[styles.centerWrapper, style]}>
      {/* Sized container to account for scaling */}
      <View style={{ width: 200 * scale, height: 140 * scale, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: 200,
            height: 140,
            transform: [{ scale }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Angled 3D shadows under book */}
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              left: 10,
              width: 100,
              height: 20,
              borderRadius: 10,
              backgroundColor: 'rgba(39, 94, 254, 0.28)',
              transform: [{ rotate: '-6deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 10,
              width: 100,
              height: 20,
              borderRadius: 10,
              backgroundColor: 'rgba(39, 94, 254, 0.28)',
              transform: [{ rotate: '6deg' }],
            }}
          />

          {/* Book Cover with 135deg gradient and rounded corners */}
          <View
            style={{
              width: 200,
              height: 140,
              borderRadius: 13,
              overflow: 'hidden',
              position: 'relative',
              shadowColor: '#275EFE',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Svg width={200} height={140} style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="bookCoverGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#23C4F8" />
                  <Stop offset="100%" stopColor="#275EFE" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={200} height={140} rx={13} ry={13} fill="url(#bookCoverGrad)" />
            </Svg>

            {/* Center spine division line */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 99.5,
                width: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
              }}
            />

            {/* Page 1: Base Left Page (fixed at 0deg) */}
            <View style={{ position: 'absolute', top: 10, left: 10, width: 90, height: 120 }}>
              <PageSvg fill="rgba(255, 255, 255, 0.36)" />
            </View>

            {/* Page 6: Base Right Page (fixed open at 180deg) */}
            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 100,
                width: 0,
                height: 120,
                transform: [{ perspective: 600 }, { rotateY: '180deg' }],
              }}
            >
              <View style={{ position: 'absolute', left: -90, top: 0, width: 90, height: 120 }}>
                <PageSvg fill="rgba(255, 255, 255, 0.36)" />
              </View>
            </View>

            {/* Page 2: Flipping Page 1 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 10,
                left: 100,
                width: 0,
                height: 120,
                opacity: op2,
                transform: [{ perspective: 600 }, { rotateY: rot2 }],
              }}
            >
              <View style={{ position: 'absolute', left: -90, top: 0, width: 90, height: 120 }}>
                <PageSvg fill="rgba(255, 255, 255, 0.52)" />
              </View>
            </Animated.View>

            {/* Page 3: Flipping Page 2 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 10,
                left: 100,
                width: 0,
                height: 120,
                opacity: op3,
                transform: [{ perspective: 600 }, { rotateY: rot3 }],
              }}
            >
              <View style={{ position: 'absolute', left: -90, top: 0, width: 90, height: 120 }}>
                <PageSvg fill="rgba(255, 255, 255, 0.52)" />
              </View>
            </Animated.View>

            {/* Page 4: Flipping Page 3 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 10,
                left: 100,
                width: 0,
                height: 120,
                opacity: op4,
                transform: [{ perspective: 600 }, { rotateY: rot4 }],
              }}
            >
              <View style={{ position: 'absolute', left: -90, top: 0, width: 90, height: 120 }}>
                <PageSvg fill="rgba(255, 255, 255, 0.52)" />
              </View>
            </Animated.View>

            {/* Page 5: Flipping Page 4 */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 10,
                left: 100,
                width: 0,
                height: 120,
                opacity: op5,
                transform: [{ perspective: 600 }, { rotateY: rot5 }],
              }}
            >
              <View style={{ position: 'absolute', left: -90, top: 0, width: 90, height: 120 }}>
                <PageSvg fill="rgba(255, 255, 255, 0.52)" />
              </View>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Minimal Caption text */}
      {Boolean(text) && (
        <Text
          style={[
            styles.captionText,
            {
              fontSize: size === 'sm' ? 12 : 13.5,
              marginTop: size === 'sm' ? 14 : 20,
            },
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreenWrapper}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  centerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  fullScreenWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  captionText: {
    fontWeight: '600',
    color: '#6C7486',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

export { BookLoader as Loader };
export default BookLoader;
