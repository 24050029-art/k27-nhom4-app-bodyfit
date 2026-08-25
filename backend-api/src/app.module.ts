import { Module } from '@nestjs/common';
import { LogsModule } from './modules/logs/logs.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { MealPlanModule } from './modules/mealplan/mealplan.module';
import { CommunityModule } from './modules/community/community.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    LogsModule,
    AiModule,
    WorkoutModule,
    MealPlanModule,
    CommunityModule,
    AdminModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
