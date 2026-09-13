import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle, Text as SvgText } from 'react-native-svg';

interface DonutMacroChartProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  consumedCalories: number;
  targetCalories: number;
  size?: number;
  strokeWidth?: number;
  textColor?: string;
  subTextColor?: string;
}

export default function DonutMacroChart({
  proteinG,
  carbsG,
  fatG,
  consumedCalories,
  targetCalories,
  size = 170,
  strokeWidth = 18,
  textColor = '#FFF8E7',
  subTextColor = 'rgba(255, 248, 231, 0.5)',
}: DonutMacroChartProps) {
  const pCal = Math.max(0, proteinG * 4);
  const cCal = Math.max(0, carbsG * 4);
  const fCal = Math.max(0, fatG * 9);
  const totalMacroCal = pCal + cCal + fCal || 1;

  const pPct = pCal / totalMacroCal;
  const cPct = cCal / totalMacroCal;
  const fPct = fCal / totalMacroCal;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Segment strokeDasharray & offsets
  const pDash = pPct * circumference;
  const cDash = cPct * circumference;
  const fDash = fPct * circumference;

  const pOffset = 0;
  const cOffset = -pDash;
  const fOffset = -(pDash + cDash);

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background track circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Protein segment (Cyan #38BDF8) */}
            {pCal > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#38BDF8"
                strokeWidth={strokeWidth}
                strokeDasharray={`${pDash} ${circumference}`}
                strokeDashoffset={pOffset}
                fill="transparent"
                strokeLinecap="round"
              />
            )}

            {/* Carbs segment (Orange #FF9F1C) */}
            {cCal > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#FF9F1C"
                strokeWidth={strokeWidth}
                strokeDasharray={`${cDash} ${circumference}`}
                strokeDashoffset={cOffset}
                fill="transparent"
                strokeLinecap="round"
              />
            )}

            {/* Fat segment (Pink #EC4899) */}
            {fCal > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#EC4899"
                strokeWidth={strokeWidth}
                strokeDasharray={`${fDash} ${circumference}`}
                strokeDashoffset={fOffset}
                fill="transparent"
                strokeLinecap="round"
              />
            )}
          </G>
        </Svg>

        {/* Center label */}
        <View style={styles.centerTextContainer}>
          <Text style={[styles.calValue, { color: textColor }]}>
            {consumedCalories}
          </Text>
          <Text style={[styles.calUnit, { color: subTextColor }]}>
            / {targetCalories} kcal
          </Text>
        </View>
      </View>

      {/* Legend & Percentages */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF9F1C' }]} />
          <Text style={[styles.legendLabel, { color: textColor }]}>Carb</Text>
          <Text style={[styles.legendPct, { color: '#FF9F1C' }]}>
            {Math.round(cPct * 100)}% ({carbsG}g)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
          <Text style={[styles.legendLabel, { color: textColor }]}>Đạm</Text>
          <Text style={[styles.legendPct, { color: '#38BDF8' }]}>
            {Math.round(pPct * 100)}% ({proteinG}g)
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EC4899' }]} />
          <Text style={[styles.legendLabel, { color: textColor }]}>Béo</Text>
          <Text style={[styles.legendPct, { color: '#EC4899' }]}>
            {Math.round(fPct * 100)}% ({fatG}g)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  calUnit: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendPct: {
    fontSize: 11,
    fontWeight: '800',
  },
});
