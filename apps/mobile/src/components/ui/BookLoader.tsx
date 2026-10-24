import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BookOpen, Sparkles } from 'lucide-react-native';

export interface BookLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export function BookLoader({
  text = 'Loading',
  size = 'md',
  fullScreen = false,
  style,
}: BookLoaderProps) {
  // Dimensions based on size
  const config = React.useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          containerSize: 48,
          iconSize: 22,
          sparkleSize: 10,
          fontSize: 12,
          paddingY: 8,
          ringSize: 56,
        };
      case 'lg':
        return {
          containerSize: 84,
          iconSize: 40,
          sparkleSize: 18,
          fontSize: 15,
          paddingY: 18,
          ringSize: 96,
        };
      case 'md':
      default:
        return {
          containerSize: 64,
          iconSize: 30,
          sparkleSize: 14,
          fontSize: 13.5,
          paddingY: 12,
          ringSize: 76,
        };
    }
  }, [size]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Floating up and down
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Smooth continuous spin for outer indicator
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    floatLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      rotateLoop.stop();
    };
  }, [pulseAnim, floatAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <View style={[styles.centerWrapper, { paddingVertical: config.paddingY }, style]}>
      {/* Outer Glow & Ring Container */}
      <View style={{ width: config.ringSize, height: config.ringSize, alignItems: 'center', justifyContent: 'center' }}>
        {/* Subtle rotating dashed ring */}
        <Animated.View
          style={{
            position: 'absolute',
            width: config.ringSize,
            height: config.ringSize,
            borderRadius: config.ringSize / 2,
            borderWidth: 2,
            borderColor: '#93C5FD',
            borderStyle: 'dashed',
            transform: [{ rotate: spin }],
          }}
        />

        {/* Pulsing book badge */}
        <Animated.View
          style={[
            styles.iconBadge,
            {
              width: config.containerSize,
              height: config.containerSize,
              borderRadius: config.containerSize / 2,
              transform: [{ scale: pulseAnim }, { translateY: floatAnim }],
            },
          ]}
        >
          <BookOpen size={config.iconSize} color="#2563EB" strokeWidth={2.3} />
          <View style={styles.sparkleBadge}>
            <Sparkles size={config.sparkleSize} color="#3B82F6" strokeWidth={2.5} />
          </View>
        </Animated.View>
      </View>

      {/* Text caption */}
      {Boolean(text) && (
        <View style={styles.textContainer}>
          <Text style={[styles.captionText, { fontSize: config.fontSize }]}>
            {text}
          </Text>
          <ActivityIndicator size="small" color="#2563EB" style={{ marginLeft: 6 }} />
        </View>
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
  },
  fullScreenWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  iconBadge: {
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  captionText: {
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.2,
  },
});

export { BookLoader as Loader };
export default BookLoader;
