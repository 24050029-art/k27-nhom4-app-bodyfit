import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';

interface BmiGaugeChartProps {
  bmi: number;
  width?: number;
  textColor?: string;
  subTextColor?: string;
}

export default function BmiGaugeChart({
  bmi,
  width = 260,
  textColor = '#FFF8E7',
  subTextColor = 'rgba(255, 248, 231, 0.55)',
}: BmiGaugeChartProps) {
  const height = width * 0.58;
  const strokeWidth = 16;
  const radius = (width - strokeWidth * 2) / 2;
  const cx = width / 2;
  const cy = height - 12;

  // Segments calculation: BMI from 14 to 36
  const minBmi = 14;
  const maxBmi = 36;
  const totalBmiRange = maxBmi - minBmi; // 22

  // Polar to Cartesian conversion for arc
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // BMI break angles (0 to 180 deg, from left to right)
  const angleUnder = ((18.5 - minBmi) / totalBmiRange) * 180;
  const angleNormal = ((24.9 - minBmi) / totalBmiRange) * 180;
  const angleOver = ((29.9 - minBmi) / totalBmiRange) * 180;
  const angleObese = 180;

  // Clamped needle angle
  const clampedBmi = Math.min(maxBmi, Math.max(minBmi, bmi));
  const needlePct = (clampedBmi - minBmi) / totalBmiRange;
  const needleAngleDeg = needlePct * 180;
  const needleAngleRad = Math.PI - (needleAngleDeg * Math.PI) / 180;

  const needleLen = radius - 10;
  const needleX = cx + needleLen * Math.cos(needleAngleRad);
  const needleY = cy - needleLen * Math.sin(needleAngleRad);

  // Category and color
  let categoryLabel = 'Bình thường';
  let categoryColor = '#10B981';
  let categoryDesc = 'Thể trạng cân đối, tiếp tục phát huy!';

  if (bmi < 18.5) {
    categoryLabel = 'Thiếu cân / Gầy';
    categoryColor = '#38BDF8';
    categoryDesc = 'Nên bổ sung dinh dưỡng & tập tăng cơ';
  } else if (bmi < 25) {
    categoryLabel = 'Bình thường / Chuẩn';
    categoryColor = '#10B981';
    categoryDesc = 'Thể trạng lý tưởng, duy trì phong độ';
  } else if (bmi < 30) {
    categoryLabel = 'Thừa cân';
    categoryColor = '#F59E0B';
    categoryDesc = 'Nên thâm hụt calo nhẹ & tăng vận động';
  } else {
    categoryLabel = 'Béo phì';
    categoryColor = '#EF4444';
    categoryDesc = 'Cần lộ trình siết cân & giảm mỡ an toàn';
  }

  return (
    <View style={styles.container}>
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Segment 1: Gầy (< 18.5) #38BDF8 */}
          <Path
            d={describeArc(cx, cy, radius, 0, angleUnder - 1.5)}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={strokeWidth}
          />

          {/* Segment 2: Chuẩn (18.5 - 24.9) #10B981 */}
          <Path
            d={describeArc(cx, cy, radius, angleUnder + 1.5, angleNormal - 1.5)}
            fill="none"
            stroke="#10B981"
            strokeWidth={strokeWidth}
          />

          {/* Segment 3: Thừa cân (25.0 - 29.9) #F59E0B */}
          <Path
            d={describeArc(cx, cy, radius, angleNormal + 1.5, angleOver - 1.5)}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={strokeWidth}
          />

          {/* Segment 4: Béo phì (>= 30.0) #EF4444 */}
          <Path
            d={describeArc(cx, cy, radius, angleOver + 1.5, angleObese)}
            fill="none"
            stroke="#EF4444"
            strokeWidth={strokeWidth}
          />

          {/* Scale labels */}
          <SvgText x={cx - radius + 4} y={cy + 12} fontSize="9" fill={subTextColor} fontWeight="bold" textAnchor="middle">
            14
          </SvgText>
          <SvgText x={polarToCartesian(cx, cy, radius - 16, angleUnder).x} y={polarToCartesian(cx, cy, radius - 16, angleUnder).y} fontSize="8" fill={subTextColor} fontWeight="bold" textAnchor="middle">
            18.5
          </SvgText>
          <SvgText x={polarToCartesian(cx, cy, radius - 16, angleNormal).x} y={polarToCartesian(cx, cy, radius - 16, angleNormal).y} fontSize="8" fill={subTextColor} fontWeight="bold" textAnchor="middle">
            25
          </SvgText>
          <SvgText x={polarToCartesian(cx, cy, radius - 16, angleOver).x} y={polarToCartesian(cx, cy, radius - 16, angleOver).y} fontSize="8" fill={subTextColor} fontWeight="bold" textAnchor="middle">
            30
          </SvgText>
          <SvgText x={cx + radius - 4} y={cy + 12} fontSize="9" fill={subTextColor} fontWeight="bold" textAnchor="middle">
            36+
          </SvgText>

          {/* Needle / Pointer */}
          <Line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={categoryColor}
            strokeWidth={3.5}
            strokeLinecap="round"
          />

          {/* Needle center cap hub */}
          <Circle cx={cx} cy={cy} r={8} fill={categoryColor} />
          <Circle cx={cx} cy={cy} r={4} fill="#1E1A17" />
        </Svg>
      </View>

      {/* Result Value Card */}
      <View style={styles.infoRow}>
        <View style={[styles.badge, { backgroundColor: `${categoryColor}20`, borderColor: categoryColor }]}>
          <Text style={[styles.badgeText, { color: categoryColor }]}>{categoryLabel.toUpperCase()}</Text>
        </View>
        <Text style={[styles.bmiText, { color: textColor }]}>
          BMI: <Text style={{ color: categoryColor, fontWeight: '900' }}>{bmi}</Text>
        </Text>
      </View>

      <Text style={[styles.descText, { color: subTextColor }]}>{categoryDesc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bmiText: {
    fontSize: 16,
    fontWeight: '700',
  },
  descText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
