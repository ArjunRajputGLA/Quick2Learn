import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import {
  Keyboard,
  Platform,
  Dimensions,
  TextInput,
  EmitterSubscription,
} from 'react-native';

export type MeasuredLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface KeyboardAwareContextValue {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  keyboardTop: number;
  onInputFocus: (ref: React.RefObject<any> | { current: any }, extraMargin?: number) => void;
  onInputBlur: (ref?: React.RefObject<any> | { current: any }) => void;
}

const defaultContextValue: KeyboardAwareContextValue = {
  isKeyboardVisible: false,
  keyboardHeight: 0,
  keyboardTop: Dimensions.get('window').height,
  onInputFocus: () => {},
  onInputBlur: () => {},
};

export const KeyboardAwareContext = createContext<KeyboardAwareContextValue>(defaultContextValue);

export function useKeyboardAware(): KeyboardAwareContextValue {
  return useContext(KeyboardAwareContext);
}

/**
 * Safely measures a component ref in window coordinates.
 * Compatible with React Native Old and New (Fabric) Architecture.
 */
export function measureRef(
  ref: React.RefObject<any> | { current: any } | null | undefined,
  callback: (layout: MeasuredLayout | null) => void
) {
  if (!ref?.current) {
    callback(null);
    return;
  }

  const target = ref.current;
  if (typeof target.measureInWindow === 'function') {
    try {
      target.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (typeof y === 'number' && !isNaN(y) && height > 0) {
          callback({ x, y, width, height });
        } else {
          callback(null);
        }
      });
    } catch {
      callback(null);
    }
  } else {
    callback(null);
  }
}

/**
 * Fallback to find currently focused input in React Native runtime.
 */
export function getCurrentlyFocusedNativeInput(): any {
  try {
    const TextInputState = (TextInput as any).State;
    if (TextInputState && typeof TextInputState.currentlyFocusedInput === 'function') {
      return TextInputState.currentlyFocusedInput();
    }
    if (TextInputState && typeof TextInputState.currentlyFocusedField === 'function') {
      return TextInputState.currentlyFocusedField();
    }
  } catch {
    // ignore
  }
  return null;
}
