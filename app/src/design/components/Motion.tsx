import React from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { durations } from '../tokens';

/* true when the phone asks for reduced motion — decorative animation then becomes instant */
let cachedReduce = false;   // remembered so components that mount later know the setting straight away
export function useReduceMotion() {
  const [r, setR] = React.useState(cachedReduce);
  React.useEffect(() => {
    let on = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { cachedReduce = !!v; if (on) setR(!!v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', v => { cachedReduce = !!v; setR(!!v); });
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

/* Screen shake: six decaying jolts over ~380ms. `style` goes on the Animated.View that wraps the screen. */
export function useShake() {
  const reduce = useReduceMotion();
  const v = React.useRef(new Animated.Value(0)).current;
  const shake = React.useCallback(() => {
    if (reduce) return;
    v.setValue(0);
    Animated.timing(v, { toValue: 6, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [reduce]);
  const r = [0, 1, 2, 3, 4, 5, 6];
  const style = { transform: [
    { translateX: v.interpolate({ inputRange: r, outputRange: [0, 14, -11, 8, -5, 2, 0] }) },
    { translateY: v.interpolate({ inputRange: r, outputRange: [0, -6, 5, -3, 2, -1, 0] }) },
    { rotate: v.interpolate({ inputRange: r, outputRange: ['0deg', '0.5deg', '-0.45deg', '0.35deg', '-0.2deg', '0.1deg', '0deg'] }) },
  ] };
  return { style, shake };
}
