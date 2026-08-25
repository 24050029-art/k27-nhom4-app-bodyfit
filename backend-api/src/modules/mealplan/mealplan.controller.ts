import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MealPlanService } from './mealplan.service';
import { FirebaseStrategy } from '../auth/firebase.strategy';

@ApiTags('Meal Planner')
@ApiBearerAuth()
@UseGuards(FirebaseStrategy)
@Controller('mealplans')
export class MealPlanController {
  constructor(private readonly mealPlanService: MealPlanService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Tạo kế hoạch ăn uống 7 ngày cá nhân hóa' })
  async generate(@Request() req: any, @Body('dietType') dietType: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const plan = await this.mealPlanService.generateMealPlan(firebaseUid, dietType);
    return { success: true, plan };
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy kế hoạch ăn uống đang kích hoạt' })
  async getActive(@Request() req: any) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const plan = await this.mealPlanService.getActiveMealPlan(firebaseUid);
    return { success: true, plan };
  }

  @Post('swap-item')
  @ApiOperation({ summary: 'Thay thế món ăn trong thực đơn' })
  async swapItem(
    @Request() req: any,
    @Body('itemId') itemId: string,
    @Body('foodName') foodName: string,
    @Body('calories') calories: number,
    @Body('protein') protein: number,
    @Body('carbs') carbs: number,
    @Body('fat') fat: number,
    @Body('servingSizeG') servingSizeG?: number
  ) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const item = await this.mealPlanService.swapMealItem(firebaseUid, itemId, foodName, calories, protein, carbs, fat, servingSizeG);
    return { success: true, item };
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Bật/tắt lưu kế hoạch ăn uống yêu thích' })
  async toggleFavorite(@Request() req: any, @Param('id') id: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const plan = await this.mealPlanService.toggleFavorite(firebaseUid, id);
    return { success: true, plan };
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Lấy danh sách kế hoạch ăn uống yêu thích' })
  async getFavorites(@Request() req: any) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const plans = await this.mealPlanService.getFavoriteMealPlans(firebaseUid);
    return { success: true, plans };
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Tái sử dụng thực đơn yêu thích' })
  async applyFavorite(@Request() req: any, @Param('id') id: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const plan = await this.mealPlanService.applyFavoriteMealPlan(firebaseUid, id);
    return { success: true, plan };
  }

  @Post('readjust')
  @ApiOperation({ summary: 'Tự động điều chỉnh thực đơn khi cân nặng thay đổi' })
  async readjust(@Request() req: any) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const plan = await this.mealPlanService.readjustMealPlan(firebaseUid);
    return { success: true, plan };
  }
}
