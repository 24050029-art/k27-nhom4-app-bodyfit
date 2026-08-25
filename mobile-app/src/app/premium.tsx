import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocalDb } from '@/hooks/use-local-db';
import { MaxContentWidth } from '@/constants/theme';

type PlanId = 'monthly' | 'yearly';
const PLANS = {
  monthly: { name: 'Hàng tháng', price: '79.000₫', cadence: '/ tháng', note: 'Linh hoạt, hủy bất cứ lúc nào' },
  yearly: { name: 'Hàng năm', price: '599.000₫', cadence: '/ năm', note: 'Chỉ 49.917₫/tháng', badge: 'TIẾT KIỆM 37%' },
} as const;
const BENEFITS = [
  ['sparkles-outline', 'AI Coach không giới hạn', 'Tư vấn dinh dưỡng và luyện tập 24/7 theo hồ sơ của bạn.'],
  ['scan-outline', 'Quét món ăn bằng AI', 'Nhận diện món ăn từ ảnh và tự động ước tính calories, protein, carb, fat.'],
  ['restaurant-outline', 'Thực đơn cá nhân hóa', 'Tạo meal plan theo mục tiêu, sở thích và chế độ ăn riêng.'],
  ['barbell-outline', 'Giáo án AI chuyên sâu', 'Lịch tập thích ứng theo mục tiêu, trình độ và tiến độ thực tế.'],
  ['analytics-outline', 'Phân tích nâng cao', 'Xu hướng cân nặng, cảnh báo và nhận xét AI mỗi ngày.'],
  ['ban-outline', 'Không quảng cáo', 'Trải nghiệm tập trung, sạch sẽ và không bị gián đoạn.'],
] as const;

export default function PremiumScreen() {
  const router = useRouter();
  const { isPremium, togglePremiumStatus } = useLocalDb();
  const [planId, setPlanId] = useState<PlanId>('yearly');
  const [loading, setLoading] = useState(false);
  const plan = PLANS[planId];

  const activate = async () => {
    setLoading(true);
    try {
      // Checkout mô phỏng cho môi trường phát triển. Production phải xác minh receipt ở backend.
      await togglePremiumStatus(true);
      Alert.alert('Chào mừng đến Premium 👑', `Đã kích hoạt gói ${plan.name.toLowerCase()} (${plan.price}).`, [
        { text: 'Bắt đầu trải nghiệm', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Chưa thể kích hoạt', 'Vui lòng kiểm tra kết nối và thử lại.');
    } finally { setLoading(false); }
  };

  return <LinearGradient colors={['#07140E', '#10271B', '#080D0A']} style={s.page}>
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Pressable accessibilityLabel={'Quay lại'} onPress={() => router.back()} style={s.back}><Ionicons name={'chevron-back'} size={24} color={'#F7FFF9'} /></Pressable>
        <Text style={s.headerTitle}>BodyFit Premium</Text><View style={s.placeholder} />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <LinearGradient colors={['#FFD95A', '#F3A712']} style={s.crown}><Ionicons name={'diamond'} size={30} color={'#1B210E'} /></LinearGradient>
          <Text style={s.eyebrow}>NÂNG CẤP PHIÊN BẢN TỐT NHẤT CỦA BẠN</Text>
          <Text style={s.title}>Huấn luyện cá nhân,{`\n`}ngay trong túi bạn</Text>
          <Text style={s.subtitle}>AI hiểu mục tiêu, dữ liệu và thói quen để đưa ra kế hoạch phù hợp mỗi ngày.</Text>
          {isPremium && <View style={s.active}><Ionicons name={'checkmark-circle'} size={18} color={'#07140E'} /><Text style={s.activeText}>PREMIUM ĐANG HOẠT ĐỘNG</Text></View>}
        </View>
        <View style={s.benefits}>{BENEFITS.map(([icon, title, description]) => <View key={title} style={s.benefit}>
          <View style={s.benefitIcon}><Ionicons name={icon} size={22} color={'#43E58B'} /></View>
          <View style={s.benefitCopy}><Text style={s.benefitTitle}>{title}</Text><Text style={s.benefitDescription}>{description}</Text></View>
        </View>)}</View>
        {!isPremium && <>
          <Text style={s.sectionTitle}>Chọn gói của bạn</Text>
          <View style={s.plans}>{(Object.keys(PLANS) as PlanId[]).map(id => {
            const item = PLANS[id]; const selected = id === planId;
            return <Pressable key={id} onPress={() => setPlanId(id)} style={[s.plan, selected && s.planSelected]}>
              {'badge' in item && <Text style={s.badge}>{item.badge}</Text>}
              <View style={[s.radio, selected && s.radioSelected]}>{selected && <View style={s.dot} />}</View>
              <View style={s.planCopy}><Text style={s.planName}>{item.name}</Text><Text style={s.planNote}>{item.note}</Text></View>
              <View style={s.priceWrap}><Text style={s.price}>{item.price}</Text><Text style={s.cadence}>{item.cadence}</Text></View>
            </Pressable>;
          })}</View>
          {planId === 'yearly' && <Text style={s.saving}>Bạn tiết kiệm 349.000₫ mỗi năm</Text>}
          <Pressable disabled={loading} onPress={activate} style={s.ctaWrap}><LinearGradient colors={['#EFFF62', '#46E38A']} style={s.cta}>
            {loading ? <ActivityIndicator color={'#07140E'} /> : <Text style={s.ctaText}>Dùng thử Premium ngay</Text>}
          </LinearGradient></Pressable>
          <Text style={s.trial}>7 ngày dùng thử miễn phí • Sau đó {plan.price}{plan.cadence} • Có thể hủy bất cứ lúc nào</Text>
        </>}
        <View style={s.trust}><Ionicons name={'shield-checkmark-outline'} size={18} color={'#91A89A'} /><Text style={s.trustText}>Thanh toán an toàn</Text><Ionicons name={'refresh-outline'} size={18} color={'#91A89A'} /><Text style={s.trustText}>Khôi phục giao dịch</Text></View>
        <Text style={s.legal}>Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của BodyFit.</Text>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const s = StyleSheet.create({
  page:{flex:1},safe:{flex:1},header:{height:58,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  back:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.07)'},placeholder:{width:42},headerTitle:{color:'#F7FFF9',fontSize:16,fontWeight:'900'},
  content:{width:'100%',maxWidth:MaxContentWidth,alignSelf:'center',paddingHorizontal:18,paddingBottom:42},hero:{alignItems:'center',paddingTop:20,paddingBottom:28},
  crown:{width:68,height:68,borderRadius:24,alignItems:'center',justifyContent:'center',marginBottom:18,transform:[{rotate:'6deg'}]},eyebrow:{color:'#43E58B',fontSize:11,fontWeight:'900',letterSpacing:1.2,textAlign:'center'},
  title:{color:'#FFF',fontSize:32,lineHeight:38,fontWeight:'900',textAlign:'center',marginTop:10},subtitle:{color:'#AFC0B5',fontSize:14,lineHeight:21,textAlign:'center',marginTop:12,maxWidth:380},
  active:{marginTop:18,backgroundColor:'#FFD95A',borderRadius:999,paddingHorizontal:14,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:7},activeText:{color:'#07140E',fontSize:11,fontWeight:'900'},
  benefits:{backgroundColor:'rgba(255,255,255,0.045)',borderWidth:1,borderColor:'rgba(255,255,255,0.08)',borderRadius:24,padding:18,gap:18},benefit:{flexDirection:'row',gap:13},benefitIcon:{width:42,height:42,borderRadius:14,backgroundColor:'rgba(67,229,139,0.12)',alignItems:'center',justifyContent:'center'},benefitCopy:{flex:1},benefitTitle:{color:'#F7FFF9',fontSize:15,fontWeight:'900',marginBottom:3},benefitDescription:{color:'#91A89A',fontSize:12,lineHeight:18},
  sectionTitle:{color:'#FFF',fontSize:20,fontWeight:'900',marginTop:28,marginBottom:13},plans:{gap:10},plan:{minHeight:84,borderRadius:20,borderWidth:1.5,borderColor:'rgba(255,255,255,0.1)',backgroundColor:'rgba(255,255,255,0.04)',padding:14,flexDirection:'row',alignItems:'center',gap:11,overflow:'hidden'},planSelected:{borderColor:'#43E58B',backgroundColor:'rgba(67,229,139,0.09)'},
  badge:{position:'absolute',top:0,right:0,color:'#07140E',backgroundColor:'#FFD95A',fontSize:9,fontWeight:'900',paddingHorizontal:9,paddingVertical:4,borderBottomLeftRadius:10},radio:{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:'#607268',alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:'#43E58B'},dot:{width:10,height:10,borderRadius:5,backgroundColor:'#43E58B'},planCopy:{flex:1},planName:{color:'#F7FFF9',fontSize:15,fontWeight:'900'},planNote:{color:'#91A89A',fontSize:11,marginTop:4},priceWrap:{alignItems:'flex-end'},price:{color:'#FFF',fontSize:16,fontWeight:'900'},cadence:{color:'#91A89A',fontSize:10,marginTop:3},saving:{color:'#FFD95A',fontSize:12,fontWeight:'800',textAlign:'center',marginTop:12},
  ctaWrap:{marginTop:18,borderRadius:999,overflow:'hidden'},cta:{height:58,alignItems:'center',justifyContent:'center'},ctaText:{color:'#07140E',fontSize:16,fontWeight:'900'},trial:{color:'#91A89A',fontSize:10,lineHeight:15,textAlign:'center',marginTop:10},trust:{flexDirection:'row',justifyContent:'center',alignItems:'center',flexWrap:'wrap',gap:7,marginTop:24},trustText:{color:'#91A89A',fontSize:11,fontWeight:'700',marginRight:10},legal:{color:'#5F7266',fontSize:9,lineHeight:14,textAlign:'center',marginTop:15,paddingHorizontal:18},
});
