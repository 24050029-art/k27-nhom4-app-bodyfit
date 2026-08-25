import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MealPlanService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserId(firebaseUid: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });
    return user ? user.id : '';
  }

  async generateMealPlan(firebaseUid: string, dietType: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      throw new NotFoundException('Hồ sơ người dùng chưa được cấu hình');
    }

    const { targetCalories, targetProtein, targetCarbs, targetFat } = user.profile;

    await this.prisma.mealPlan.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false }
    });

    const dietNameMap: Record<string, string> = {
      'keto': 'Chế độ Keto Đốt Mỡ 🔥',
      'eat_clean': 'Ăn Sạch Sống Khỏe Eat Clean 🥗',
      'low_carb': 'Low Carb Hạn Chế Tinh Bột 🥩',
      'high_protein': 'Giàu Protein Tăng Cơ Bắp 🍗',
      'weight_loss': 'Thâm Hụt Calo Giảm Cân 📉',
      'weight_gain': 'Dư Thừa Calo Tăng Cân Cân Đối 📈',
    };
    
    const title = dietNameMap[dietType.toLowerCase()] || `Meal Plan ${dietType}`;
    const mealPlan = await this.prisma.mealPlan.create({
      data: {
        userId: user.id,
        title,
        dietType: dietType.toUpperCase(),
        startDate: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
      }
    });

    const breakfastOptions = [
      { name: 'Cháo yến mạch chuối', calPct: 0.2, pPct: 0.15, cPct: 0.6, fPct: 0.25 },
      { name: 'Trứng cuộn phô mai kèm bơ', calPct: 0.25, pPct: 0.35, cPct: 0.1, fPct: 0.55 },
      { name: 'Bánh mì ngũ cốc kẹp trứng ốp', calPct: 0.22, pPct: 0.25, cPct: 0.5, fPct: 0.25 },
      { name: 'Sữa chua Hy Lạp hạt chia & dâu tây', calPct: 0.18, pPct: 0.35, cPct: 0.4, fPct: 0.25 }
    ];

    const lunchOptions = [
      { name: 'Ức gà áp chảo sốt chanh leo & bông cải xanh', calPct: 0.35, pPct: 0.45, cPct: 0.35, fPct: 0.2 },
      { name: 'Thịt bò xào ớt chuông hành tây & cơm lứt', calPct: 0.38, pPct: 0.4, cPct: 0.4, fPct: 0.2 },
      { name: 'Cá hồi nướng măng tây & khoai lang luộc', calPct: 0.4, pPct: 0.35, cPct: 0.3, fPct: 0.35 },
      { name: 'Đậu hũ kho nấm đông cô & canh cải bó xôi', calPct: 0.32, pPct: 0.3, cPct: 0.5, fPct: 0.2 }
    ];

    const dinnerOptions = [
      { name: 'Salad cá ngừ ngô ngọt dầu giấm', calPct: 0.25, pPct: 0.4, cPct: 0.2, fPct: 0.4 },
      { name: 'Tôm hấp sả kèm bí ngòi xào tỏi', calPct: 0.22, pPct: 0.5, cPct: 0.2, fPct: 0.3 },
      { name: 'Thịt heo nạc rim dầu hào & canh bí đỏ', calPct: 0.28, pPct: 0.35, cPct: 0.4, fPct: 0.25 },
      { name: 'Súp gà ngô non nấm hương', calPct: 0.2, pPct: 0.4, cPct: 0.3, fPct: 0.3 }
    ];

    const snackOptions = [
      { name: 'Hạt hạnh nhân & óc chó sấy khô', calPct: 0.1, pPct: 0.15, cPct: 0.15, fPct: 0.7 },
      { name: 'Whey Protein pha nước lọc', calPct: 0.12, pPct: 0.85, cPct: 0.05, fPct: 0.1 },
      { name: 'Táo tây đỏ ăn kèm 1 thìa bơ đậu phộng', calPct: 0.1, pPct: 0.15, cPct: 0.45, fPct: 0.4 }
    ];

    for (let dayNum = 1; dayNum <= 7; dayNum++) {
      const mealPlanDay = await this.prisma.mealPlanDay.create({
        data: {
          mealPlanId: mealPlan.id,
          dayNumber: dayNum,
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat,
        }
      });

      const meals = [
        { type: 'breakfast', pct: 0.25, list: breakfastOptions },
        { type: 'lunch', pct: 0.35, list: lunchOptions },
        { type: 'dinner', pct: 0.3, list: dinnerOptions },
        { type: 'snack', pct: 0.1, list: snackOptions }
      ];

      for (const m of meals) {
        const template = m.list[(dayNum + m.type.length) % m.list.length];
        const mealCalories = Math.round(targetCalories * m.pct);
        const p = Math.round((mealCalories * template.pPct) / 4);
        const c = Math.round((mealCalories * template.cPct) / 4);
        const f = Math.round((mealCalories * template.fPct) / 9);

        await this.prisma.mealPlanItem.create({
          data: {
            mealPlanDayId: mealPlanDay.id,
            mealType: m.type,
            foodName: template.name,
            servingSizeG: m.type === 'snack' ? 30 : 200,
            calories: mealCalories,
            protein: p,
            carbs: c,
            fat: f,
          }
        });
      }
    }

    return this.prisma.mealPlan.findUnique({
      where: { id: mealPlan.id },
      include: {
        days: {
          include: { items: true }
        }
      }
    });
  }

  async getActiveMealPlan(firebaseUid: string) {
    const userId = await this.getUserId(firebaseUid);
    if (!userId) return null;
    return this.prisma.mealPlan.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          include: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async swapMealItem(firebaseUid: string, itemId: string, foodName: string, calories: number, protein: number, carbs: number, fat: number, servingSizeG?: number) {
    const userId = await this.getUserId(firebaseUid);
    const item = await this.prisma.mealPlanItem.findUnique({
      where: { id: itemId },
      include: { mealPlanDay: { include: { mealPlan: true } } }
    });

    if (!item || (userId && item.mealPlanDay.mealPlan.userId !== userId)) {
      throw new NotFoundException('Không tìm thấy món ăn trong thực đơn');
    }

    const updatedItem = await this.prisma.mealPlanItem.update({
      where: { id: itemId },
      data: {
        foodName,
        calories,
        protein,
        carbs,
        fat,
        servingSizeG: servingSizeG || item.servingSizeG
      }
    });

    return updatedItem;
  }

  async toggleFavorite(firebaseUid: string, planId: string) {
    const userId = await this.getUserId(firebaseUid);
    const plan = await this.prisma.mealPlan.findUnique({ where: { id: planId } });
    if (!plan || (userId && plan.userId !== userId)) {
      throw new NotFoundException('Không tìm thấy kế hoạch ăn uống');
    }

    const updatedPlan = await this.prisma.mealPlan.update({
      where: { id: planId },
      data: { isFavorite: !plan.isFavorite }
    });

    return updatedPlan;
  }

  async getFavoriteMealPlans(firebaseUid: string) {
    const userId = await this.getUserId(firebaseUid);
    if (!userId) return [];
    return this.prisma.mealPlan.findMany({
      where: { userId, isFavorite: true },
      include: {
        days: {
          include: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async applyFavoriteMealPlan(firebaseUid: string, planId: string) {
    const userId = await this.getUserId(firebaseUid);
    const plan = await this.prisma.mealPlan.findUnique({ where: { id: planId } });
    if (!plan || (userId && plan.userId !== userId)) {
      throw new NotFoundException('Không tìm thấy kế hoạch ăn uống');
    }

    await this.prisma.mealPlan.updateMany({
      where: { userId: plan.userId, isActive: true },
      data: { isActive: false }
    });

    const activePlan = await this.prisma.mealPlan.update({
      where: { id: planId },
      data: { isActive: true },
      include: {
        days: {
          include: { items: true }
        }
      }
    });

    return activePlan;
  }

  async readjustMealPlan(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      throw new NotFoundException('Hồ sơ người dùng chưa được cấu hình');
    }

    const activePlan = await this.getActiveMealPlan(firebaseUid);
    if (!activePlan) {
      throw new NotFoundException('Không có thực đơn nào đang kích hoạt');
    }

    const { targetCalories, targetProtein, targetCarbs, targetFat } = user.profile;

    for (const day of activePlan.days) {
      const oldCal = day.calories || 1;
      const ratio = targetCalories / oldCal;

      await this.prisma.mealPlanDay.update({
        where: { id: day.id },
        data: {
          calories: targetCalories,
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat
        }
      });

      for (const item of day.items) {
        await this.prisma.mealPlanItem.update({
          where: { id: item.id },
          data: {
            calories: Math.round(item.calories * ratio),
            protein: Math.round(item.protein * ratio),
            carbs: Math.round(item.carbs * ratio),
            fat: Math.round(item.fat * ratio),
          }
        });
      }
    }

    return this.getActiveMealPlan(firebaseUid);
  }
}
