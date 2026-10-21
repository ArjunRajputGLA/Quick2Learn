import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  Animated,
  ViewProps,
  Keyboard,
  Platform,
  Dimensions,
  Easing,
  EmitterSubscription,
} from 'react-native';
import {
  KeyboardAwareContext,
  measureRef,
  getCurrentlyFocusedNativeInput,
  MeasuredLayout,
} from './KeyboardAwareContext';

export interface KeyboardAwareViewProps extends ViewProps {
  children: React.ReactNode;
  extraScrollMargin?: number;
  animationDuration?: number;
  enabled?: boolean;
}

export function KeyboardAwareView({
  children,
  extraScrollMargin = 20,
  animationDuration = 250,
  enabled = true,
  style,
  ...restProps
}: KeyboardAwareViewProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const currentShift = useRef(0);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardTop, setKeyboardTop] = useState(Dimensions.get('window').height);

  const isKeyboardVisibleRef = useRef(false);
  const keyboardHeightRef = useRef(0);
  const keyboardTopRef = useRef(Dimensions.get('window').height);

  const activeFieldRef = useRef<any>(null);
  const activeMarginRef = useRef(extraScrollMargin);

  useEffect(() => {
    isKeyboardVisibleRef.current = isKeyboardVisible;
    keyboardHeightRef.current = keyboardHeight;
    keyboardTopRef.current = keyboardTop;
  }, [isKeyboardVisible, keyboardHeight, keyboardTop]);

  const animateTo = useCallback(
    (toValue: number) => {
      Animated.timing(translateY, {
        toValue,
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      currentShift.current = -toValue; // shift upwards is positive
    },
    [animationDuration, translateY]
  );

  const checkAndAdjustView = useCallback(
    (customRef?: any, customMargin?: number) => {
      if (!enabled) return;
      const targetRef = customRef || activeFieldRef.current;
      const margin = typeof customMargin === 'number' ? customMargin : activeMarginRef.current;

      const performMeasurement = (elemRef: any) => {
        measureRef(elemRef, (layout: MeasuredLayout | null) => {
          if (!layout) return;

          const kbTop = keyboardTopRef.current;
          // Current visual bottom on screen
          const visualBottom = layout.y + layout.height + margin;

          if (visualBottom > kbTop) {
            // Covered by keypad!
            const overlap = visualBottom - kbTop;
            const newShift = currentShift.current + overlap;
            animateTo(-newShift);
          } else {
            // Field is ALREADY above keyboard
            // Check if we previously shifted up unnecessarily high
            const unshiftedBottom = visualBottom + currentShift.current;
            if (unshiftedBottom <= kbTop && currentShift.current > 0) {
              // Can smoothly return to default position
              animateTo(0);
            }
            // Otherwise, do nothing!
          }
        });
      };

      if (targetRef?.current) {
        performMeasurement(targetRef);
      } else {
        const nativeInput = getCurrentlyFocusedNativeInput();
        if (nativeInput) {
          performMeasurement({ current: nativeInput });
        }
      }
    },
    [animateTo]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: any) => {
      const height = e?.endCoordinates?.height || 0;
      const windowHeight = Dimensions.get('window').height;
      const top =
        typeof e?.endCoordinates?.screenY === 'number' && e.endCoordinates.screenY > 0
          ? e.endCoordinates.screenY
          : windowHeight - height;

      setIsKeyboardVisible(true);
      setKeyboardHeight(height);
      setKeyboardTop(top);

      isKeyboardVisibleRef.current = true;
      keyboardHeightRef.current = height;
      keyboardTopRef.current = top;

      setTimeout(() => {
        checkAndAdjustView();
      }, 30);
    };

    const onKeyboardHide = () => {
      const windowHeight = Dimensions.get('window').height;
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      setKeyboardTop(windowHeight);

      isKeyboardVisibleRef.current = false;
      keyboardHeightRef.current = 0;
      keyboardTopRef.current = windowHeight;

      // Animate smoothly back down to default place
      animateTo(0);
      activeFieldRef.current = null;
    };

    const showSub: EmitterSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub: EmitterSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [animateTo, checkAndAdjustView]);

  const onInputFocus = useCallback(
    (inputRef: React.RefObject<any> | { current: any }, margin?: number) => {
      activeFieldRef.current = inputRef;
      if (typeof margin === 'number') {
        activeMarginRef.current = margin;
      }

      if (isKeyboardVisibleRef.current) {
        setTimeout(() => {
          checkAndAdjustView(inputRef, margin);
        }, 40);
      }
    },
    [checkAndAdjustView]
  );

  const onInputBlur = useCallback((inputRef?: React.RefObject<any> | { current: any }) => {
    // onKeyboardHide will handle animating back to 0
  }, []);

  return (
    <KeyboardAwareContext.Provider
      value={{
        isKeyboardVisible,
        keyboardHeight,
        keyboardTop,
        onInputFocus,
        onInputBlur,
      }}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ translateY }],
          },
        ]}
        {...restProps}
      >
        {children}
      </Animated.View>
    </KeyboardAwareContext.Provider>
  );
}
