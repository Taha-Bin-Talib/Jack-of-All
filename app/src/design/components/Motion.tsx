import React from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { durations } from '../tokens';

/* true when the phone asks for reduced motion — decorative animation then becomes instant */
export function useReduceMotion() {
  const [r, setR] = React.useState(false);
  React.useEffect(() => {
    let on = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => on && setR(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => setR(!!v));
    return () => { on = false; sub?.remove?.(); };
  }, []);
  return r;
}

/* Fades + eases content in on mount (screens, lobby players). `dx` slides in from the side, `dy` from below. */
export function Appear({ children, dx = 0, dy = 0, delay = 0, duration = durations.base, style }: { children: React.ReactNode; dx?: number; dy?: number; delay?: number; duration?: number; style?: any }) {
  const reduce = useReduceMotion();
  const t = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (reduce) { t.setValue(1); return; }
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce]);
  return (
    <Animated.View style={[{ opacity: t, transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [dx, 0] }) }, { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}
