import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  ScrollView,
  ScrollViewProps,
  Keyboard,
  Platform,
  Dimensions,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
  EmitterSubscription,
} from 'react-native';
import {
  KeyboardAwareContext,
  measureRef,
  getCurrentlyFocusedNativeInput,
  MeasuredLayout,
} from './KeyboardAwareContext';

export interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  extraHeight?: number;
  extraScrollMargin?: number;
  restoreScrollOnDismiss?: boolean;
}

export const KeyboardAwareScrollView = forwardRef<any, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(
    {
      children,
      extraHeight = 0,
      extraScrollMargin = 24,
      restoreScrollOnDismiss = true,
      contentContainerStyle,
      onScroll,
      ...restProps
    },
    ref
  ) {
    const internalScrollRef = useRef<any>(null);
    useImperativeHandle(ref, () => internalScrollRef.current);

    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [keyboardTop, setKeyboardTop] = useState(Dimensions.get('window').height);

    const isKeyboardVisibleRef = useRef(false);
    const keyboardHeightRef = useRef(0);
    const keyboardTopRef = useRef(Dimensions.get('window').height);

    const currentScrollY = useRef(0);
    const originalScrollY = useRef<number | null>(null);
    const isProgrammaticallyScrolling = useRef(false);

    const activeFieldRef = useRef<any>(null);
    const activeMarginRef = useRef(extraScrollMargin);

    // Keep refs in sync with state
    useEffect(() => {
      isKeyboardVisibleRef.current = isKeyboardVisible;
      keyboardHeightRef.current = keyboardHeight;
      keyboardTopRef.current = keyboardTop;
    }, [isKeyboardVisible, keyboardHeight, keyboardTop]);

    const checkAndAdjustScroll = useCallback(
      (customRef?: any, customMargin?: number) => {
        const targetRef = customRef || activeFieldRef.current;
        const margin = typeof customMargin === 'number' ? customMargin : activeMarginRef.current;

        const performMeasurement = (elemRef: any) => {
          measureRef(elemRef, (layout: MeasuredLayout | null) => {
            if (!layout) return;

            const kbTop = keyboardTopRef.current;
            const fieldBottom = layout.y + layout.height + margin;

            // ONLY adjust if the field is covered by the keypad
            if (fieldBottom > kbTop) {
              const overlap = fieldBottom - kbTop;
              if (originalScrollY.current === null) {
                originalScrollY.current = currentScrollY.current;
              }

              const targetY = Math.max(0, currentScrollY.current + overlap);
              isProgrammaticallyScrolling.current = true;
              internalScrollRef.current?.scrollTo({ y: targetY, animated: true });

              setTimeout(() => {
                isProgrammaticallyScrolling.current = false;
              }, 300);
            }
            // If fieldBottom <= kbTop: it's ALREADY above the keyboard!
            // Requirement: "if the field is already above the keypad then it nothing should happen"
          });
        };

        if (targetRef?.current) {
          performMeasurement(targetRef);
        } else {
          // Fallback to currently focused native input
          const nativeInput = getCurrentlyFocusedNativeInput();
          if (nativeInput) {
            performMeasurement({ current: nativeInput });
          }
        }
      },
      []
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

        // Give a brief tick for native keyboard animations / layout
        setTimeout(() => {
          checkAndAdjustScroll();
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

        if (restoreScrollOnDismiss && originalScrollY.current !== null) {
          isProgrammaticallyScrolling.current = true;
          internalScrollRef.current?.scrollTo({
            y: originalScrollY.current,
            animated: true,
          });
          originalScrollY.current = null;
          setTimeout(() => {
            isProgrammaticallyScrolling.current = false;
          }, 300);
        }

        activeFieldRef.current = null;
      };

      const showSub: EmitterSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
      const hideSub: EmitterSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

      // On Android, also listen to keyboardDidShow if keyboardWillShow is registered
      let showSubAndroid: EmitterSubscription | null = null;
      if (Platform.OS === 'android') {
        showSubAndroid = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
      }

      return () => {
        showSub.remove();
        hideSub.remove();
        showSubAndroid?.remove();
      };
    }, [checkAndAdjustScroll, restoreScrollOnDismiss]);

    const onInputFocus = useCallback(
      (inputRef: React.RefObject<any> | { current: any }, margin?: number) => {
        activeFieldRef.current = inputRef;
        if (typeof margin === 'number') {
          activeMarginRef.current = margin;
        }

        if (isKeyboardVisibleRef.current) {
          // Keyboard is already open (e.g. user moved between inputs)
          setTimeout(() => {
            checkAndAdjustScroll(inputRef, margin);
          }, 40);
        }
      },
      [checkAndAdjustScroll]
    );

    const onInputBlur = useCallback((inputRef?: React.RefObject<any> | { current: any }) => {
      if (!inputRef || activeFieldRef.current === inputRef) {
        // We do not immediately reset scroll here so that tabbing between fields doesn't flicker.
        // If keyboard hides, onKeyboardHide handles smooth return.
      }
    }, []);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      currentScrollY.current = e.nativeEvent.contentOffset.y;
      onScroll?.(e);
    };

    const dynamicPaddingBottom = isKeyboardVisible ? keyboardHeight + extraHeight : 0;

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
        <ScrollView
          ref={internalScrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            contentContainerStyle,
            dynamicPaddingBottom > 0 ? { paddingBottom: dynamicPaddingBottom } : undefined,
          ]}
          {...restProps}
        >
          {children}
        </ScrollView>
      </KeyboardAwareContext.Provider>
    );
  }
);
