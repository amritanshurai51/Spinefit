import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Text } from './Typography';
import { useTheme } from '../theme/ThemeContext';

const BODY_WIDTH = 180;
const BODY_HEIGHT = 330;
const VIEWBOX_WIDTH = 150;
const VIEWBOX_HEIGHT = 290;
const WAVE_AMPLITUDE = 4;
// Set to true temporarily to see layout bounds and print the component's measured size.
const DEBUG_WATER_BODY = false;

const BODY_PATH = 'M75 8 C64 8 58 17 58 29 C58 41 63 50 70 54 L70 65 C66 70 55 74 44 78 C34 82 28 90 25 102 L17 132 C15 139 17 146 22 148 C27 150 30 145 32 139 L39 116 L39 147 L33 174 L28 208 L24 246 C23 254 28 259 34 258 C39 258 42 254 43 247 L50 212 L58 180 L64 158 L66 198 L64 264 C64 273 68 279 75 279 C82 279 86 273 86 264 L87 198 L91 158 L97 180 L105 212 L112 247 C113 254 117 258 123 257 C129 256 131 251 130 244 L126 207 L120 174 L114 147 L114 116 L121 139 C123 145 126 150 131 148 C136 146 137 140 135 133 L127 102 C124 90 118 82 108 78 C97 74 85 70 80 65 L80 54 C87 50 92 40 92 28 C92 16 86 8 75 8 Z';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

function buildWavePath(levelY: number, phase: number) {
  'worklet';
  const samples = 30;
  let path = `M0 ${levelY}`;
  for (let index = 0; index <= samples; index += 1) {
    const x = VIEWBOX_WIDTH * index / samples;
    const y = levelY + Math.sin(index / samples * Math.PI * 4 + phase) * WAVE_AMPLITUDE;
    path += ` L${x} ${y}`;
  }
  return `${path} L${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT} L0 ${VIEWBOX_HEIGHT} Z`;
}

export type WaterBodyProps = {
  current: number;
  goal: number;
  reducedMotion?: boolean;
};

export function WaterBody({ current, goal, reducedMotion }: WaterBodyProps) {
  const { theme } = useTheme();
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const safeGoal = Math.max(1, goal);
  const fraction = Math.max(0, Math.min(1, current / safeGoal));
  const level = useSharedValue(0);
  const wavePhaseA = useSharedValue(0);
  const wavePhaseB = useSharedValue(Math.PI * 2);
  const shouldReduceMotion = reducedMotion ?? systemReducedMotion;

  const fillProps = useAnimatedProps(() => {
    const fillHeight = VIEWBOX_HEIGHT * level.value;
    return { y: VIEWBOX_HEIGHT - fillHeight, height: fillHeight };
  });
  const waveAProps = useAnimatedProps(() => ({
    d: buildWavePath(VIEWBOX_HEIGHT * (1 - level.value), wavePhaseA.value),
  }));
  const waveBProps = useAnimatedProps(() => ({
    d: buildWavePath(VIEWBOX_HEIGHT * (1 - level.value), wavePhaseB.value),
  }));

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => { if (mounted) setSystemReducedMotion(enabled); })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReducedMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    cancelAnimation(level);
    level.value = shouldReduceMotion
      ? fraction
      : withTiming(fraction, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [fraction, level, shouldReduceMotion]);

  useEffect(() => {
    cancelAnimation(wavePhaseA);
    cancelAnimation(wavePhaseB);
    if (shouldReduceMotion) {
      wavePhaseA.value = 0;
      wavePhaseB.value = Math.PI;
      return;
    }
    wavePhaseA.value = withRepeat(withTiming(Math.PI * 2, { duration: 2800, easing: Easing.linear }), -1, false);
    wavePhaseB.value = withRepeat(withTiming(0, { duration: 4100, easing: Easing.linear }), -1, false);
  }, [shouldReduceMotion, wavePhaseA, wavePhaseB]);

  const onLayout = (event: LayoutChangeEvent) => {
    if (DEBUG_WATER_BODY) console.log('[WaterBody] layout:', event.nativeEvent.layout);
  };
  const litres = (current / 1000).toFixed(current % 1000 === 0 ? 0 : 1).replace(/\.0$/, '');
  const goalLitres = (goal / 1000).toFixed(goal % 1000 === 0 ? 0 : 1).replace(/\.0$/, '');

  return (
    <View
      onLayout={onLayout}
      style={[styles.row, DEBUG_WATER_BODY && styles.debugRow]}
    >
      <View style={styles.metric}>
        <Text style={[styles.metricValue, { color: theme.text }]}>{litres}L</Text>
        <Text style={[styles.metricCaption, { color: theme.subtext }]}>OF {goalLitres}L</Text>
      </View>

      <Svg
        width={BODY_WIDTH}
        height={BODY_HEIGHT}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        onLayout={onLayout}
        style={DEBUG_WATER_BODY ? styles.debugSvg : undefined}
      >
        <Defs>
          <LinearGradient id="waterBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#5BC8FF" />
            <Stop offset="100%" stopColor="#1E7BFF" />
          </LinearGradient>
          <ClipPath id="waterBodyClip">
            <Path d={BODY_PATH} />
          </ClipPath>
        </Defs>

        <Path d={BODY_PATH} fill={theme.dark ? '#455171' : '#E3EAF6'} />
        <G clipPath="url(#waterBodyClip)">
          <AnimatedRect
            animatedProps={fillProps}
            x="0"
            width={VIEWBOX_WIDTH}
            fill="url(#waterBodyGradient)"
          />
          {fraction > 0 && (
            <>
              <AnimatedPath animatedProps={waveAProps} fill="rgba(190,241,255,0.68)" />
              <AnimatedPath animatedProps={waveBProps} fill="rgba(36,148,255,0.48)" />
            </>
          )}
        </G>
        <Path d={BODY_PATH} fill="none" stroke={theme.dark ? '#8FDFFF' : '#1685CE'} strokeWidth="1.45" />
      </Svg>

      <View style={[styles.metric, styles.metricRight]}>
        <Text style={[styles.metricValue, { color: theme.text }]}>{Math.round(fraction * 100)}%</Text>
        <Text style={[styles.metricCaption, { color: theme.subtext }]}>HYDRATED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metric: { flex: 1, minWidth: 58 },
  metricRight: { alignItems: 'flex-end' },
  metricValue: { fontSize: 20, lineHeight: 26, fontWeight: '800' },
  metricCaption: { fontSize: 9, letterSpacing: 1.2 },
  debugRow: { borderWidth: 2, borderColor: 'magenta' },
  debugSvg: { borderWidth: 2, borderColor: 'lime' },
});
