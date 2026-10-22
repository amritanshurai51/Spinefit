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

/* ------------------------------------------------------------------ */
/* Body silhouette                                                     */
/* Only the RIGHT half is described below. The left half is generated  */
/* by mirroring it around x = 75, so the figure is always perfectly    */
/* symmetric and smooth (no hand-drawn left/right mismatch).           */
/* ------------------------------------------------------------------ */
type Pt = [number, number];
type Segment = { to: Pt; c1?: Pt; c2?: Pt };

const curve = (x1: number, y1: number, x2: number, y2: number, x: number, y: number): Segment => ({
  c1: [x1, y1],
  c2: [x2, y2],
  to: [x, y],
});
const line = (x: number, y: number): Segment => ({ to: [x, y] });

// Starts at the top of the head and ends at the crotch, both on the centre line (x = 75).
const BODY_START: Pt = [75, 4];
const RIGHT_HALF: Segment[] = [
  // Head
  curve(83, 4, 89.5, 10, 89.5, 21),
  curve(89.5, 29, 86, 35, 81, 38),
  // Neck
  line(81, 48),
  // Shoulder and upper arm (outer edge)
  curve(90, 50, 100, 52, 108, 56),
  curve(115, 58, 119, 64, 119, 72),
  curve(120, 92, 122, 106, 124, 122),
  // Forearm and hand
  curve(125.5, 136, 127.5, 152, 129, 166),
  curve(130.5, 172, 132, 180, 130.5, 186),
  curve(128.5, 191, 122.5, 191, 122, 186),
  // Inner arm back up to the armpit
  curve(121.5, 178, 121, 170, 120, 164),
  curve(117.5, 148, 113, 128, 110, 112),
  curve(108, 100, 106, 92, 104, 84),
  // Torso: ribcage, waist, hip
  curve(104, 98, 99, 112, 98, 128),
  curve(98, 138, 104, 146, 104, 158),
  // Outer leg: thigh, knee, calf, ankle
  curve(105, 176, 103, 196, 100, 212),
  curve(98.5, 224, 103, 234, 103, 246),
  curve(103, 256, 98.5, 264, 96.5, 272),
  // Foot
  curve(96.5, 277, 100, 279, 105, 281.5),
  curve(109, 283, 108.5, 288, 103, 288),
  line(89, 288),
  curve(85, 288, 85.5, 283, 86.5, 279),
  curve(86.5, 276, 86.5, 273, 87.5, 270),
  // Inner leg back up to the crotch
  curve(88.5, 260, 90, 250, 88.5, 242),
  curve(87.5, 232, 86.5, 222, 86.5, 212),
  curve(86, 196, 82, 182, 78, 170),
  curve(77, 166, 75.5, 164, 75, 164),
];

const mirror = ([x, y]: Pt): Pt => [VIEWBOX_WIDTH - x, y];
const fmt = ([x, y]: Pt) => `${x} ${y}`;

function buildBodyPath(): string {
  // Start point of every segment (needed to walk the path backwards for the left half).
  const starts: Pt[] = [BODY_START];
  RIGHT_HALF.forEach(segment => starts.push(segment.to));

  let d = `M${fmt(BODY_START)}`;
  RIGHT_HALF.forEach(segment => {
    d += segment.c1 && segment.c2
      ? ` C${fmt(segment.c1)} ${fmt(segment.c2)} ${fmt(segment.to)}`
      : ` L${fmt(segment.to)}`;
  });

  // Left half = mirrored right half, traversed in reverse (control points swap order).
  for (let i = RIGHT_HALF.length - 1; i >= 0; i -= 1) {
    const segment = RIGHT_HALF[i];
    const target = mirror(starts[i]);
    d += segment.c1 && segment.c2
      ? ` C${fmt(mirror(segment.c2))} ${fmt(mirror(segment.c1))} ${fmt(target)}`
      : ` L${fmt(target)}`;
  }
  return `${d} Z`;
}

const BODY_PATH = buildBodyPath();

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
        <Path
          d={BODY_PATH}
          fill="none"
          stroke={theme.dark ? '#8FDFFF' : '#1685CE'}
          strokeWidth="1.45"
          strokeLinejoin="round"
        />
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
