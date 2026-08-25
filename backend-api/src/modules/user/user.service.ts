import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { IsString, IsNumber, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class UserProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsNumber()
  age: number;

  @IsString()
  @IsIn(['male', 'female', 'other'])
  gender: 'male' | 'female' | 'other';

  @IsNumber()
  heightCm: number;

  @IsNumber()
  weightKg: number;

  @IsString()
  @IsIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete'])
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'athlete';

  @IsString()
  @IsIn(['weight_loss', 'weight_gain', 'maintain_weight', 'muscle_gain', 'healthy_lifestyle'])
  targetGoal: 'weight_loss' | 'weight_gain' | 'maintain_weight' | 'muscle_gain' | 'healthy_lifestyle';

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateUserByFirebaseUid(firebaseUid: string, email: string) {
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          email,
          authProvider: 'firebase',
        },
      });
    }

    return user;
  }

  async getProfile(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return user.profile;
  }

  async updateProfile(firebaseUid: string, dto: UserProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const calculations = this.calculateMetrics(dto);

    let cleanedAvatarUrl = dto.avatarUrl;
    if (cleanedAvatarUrl && cleanedAvatarUrl.includes('/v1/users/avatars/')) {
      const parts = cleanedAvatarUrl.split('/v1/users/avatars/');
      cleanedAvatarUrl = parts[parts.length - 1];
    }

    const updatedProfile = await this.prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        age: dto.age,
        gender: dto.gender,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        activityLevel: dto.activityLevel,
        targetGoal: dto.targetGoal,
        avatarUrl: cleanedAvatarUrl,
        ...calculations,
        xp: 0, // default initial values
        level: 1,
      },
      update: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        age: dto.age,
        gender: dto.gender,
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        activityLevel: dto.activityLevel,
        targetGoal: dto.targetGoal,
        avatarUrl: cleanedAvatarUrl !== undefined ? cleanedAvatarUrl : undefined,
        ...calculations,
      },
    });

    return updatedProfile;
  }

  private calculateMetrics(profile: UserProfileDto) {
    const { weightKg, heightCm, age, gender, activityLevel, targetGoal } = profile;
    
    // BMI
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    
    // BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Body Fat Estimate (BMI-based formula)
    const genderFactor = gender === 'male' ? 1 : 0;
    const bodyFatEstimate = Math.max(2, 1.20 * bmi + 0.23 * age - 16.2 * genderFactor - 5.4);
    const leanBodyMass = weightKg * (1 - bodyFatEstimate / 100);

    // TDEE multipliers
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      athlete: 1.9
    };
    const tdee = bmr * multipliers[activityLevel as keyof typeof multipliers];

    // Calorie & water targets based on goal
    let targetCalories = tdee;
    let targetWaterMl = 2000;

    if (targetGoal === 'weight_loss') {
      targetCalories -= 450;
      targetWaterMl = 2500;
    } else if (targetGoal === 'weight_gain') {
      targetCalories += 400;
      targetWaterMl = 3000;
    } else if (targetGoal === 'muscle_gain') {
      targetCalories += 250;
      targetWaterMl = 3000;
    } else if (targetGoal === 'healthy_lifestyle') {
      targetWaterMl = 2200;
    }

    // Macros distribution
    let pPct = 0.25, cPct = 0.50, fPct = 0.25;
    if (targetGoal === 'muscle_gain') {
      pPct = 0.35; cPct = 0.45; fPct = 0.20;
    } else if (targetGoal === 'weight_loss') {
      pPct = 0.30; cPct = 0.40; fPct = 0.30;
    }

    const targetProtein = Math.round((targetCalories * pPct) / 4);
    const targetCarbs = Math.round((targetCalories * cPct) / 4);
    const targetFat = Math.round((targetCalories * fPct) / 9);

    return {
      bmi: Number(bmi.toFixed(1)),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      targetProtein,
      targetCarbs,
      targetFat,
      targetWaterMl,
      bodyFatEstimate: Number(bodyFatEstimate.toFixed(1)),
      leanBodyMass: Number(leanBodyMass.toFixed(1))
    };
  }

  async logWeight(firebaseUid: string, dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true }
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    let bodyFatPct = dto.bodyFatPct;
    if (!bodyFatPct && dto.waistCm && user.profile) {
      const waistInches = dto.waistCm / 2.54;
      const weightLbs = dto.weightKg * 2.20462;
      if (user.profile.gender === 'male') {
        bodyFatPct = ((4.15 * waistInches - 0.082 * weightLbs - 98.42) / weightLbs) * 100;
      } else {
        bodyFatPct = ((4.15 * waistInches - 0.082 * weightLbs - 76.76) / weightLbs) * 100;
      }
      bodyFatPct = Math.max(2, Number(bodyFatPct.toFixed(1)));
    }

    const log = await this.prisma.weightLog.create({
      data: {
        userId: user.id,
        weightKg: dto.weightKg,
        waistCm: dto.waistCm,
        chestCm: dto.chestCm,
        hipsCm: dto.hipsCm,
        bodyFatPct: bodyFatPct,
        photoUrl: dto.photoUrl,
        loggedDate: dto.loggedDate,
      }
    });

    // Sync to DailyDeclaration
    const decl = await this.prisma.dailyDeclaration.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: dto.loggedDate
        }
      }
    });
    if (decl) {
      await this.prisma.dailyDeclaration.update({
        where: { id: decl.id },
        data: { weight: dto.weightKg }
      });
    } else {
      const username = user.username || user.email?.split('@')[0] || 'Người dùng';
      await this.prisma.dailyDeclaration.create({
        data: {
          userId: user.id,
          date: dto.loggedDate,
          activity: '',
          image: '',
          steps: 0,
          activeCalories: 0,
          activeTime: 0,
          username,
          weight: dto.weightKg
        }
      });
    }

    if (user.profile) {
      const updatedProfileDto: UserProfileDto = {
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        age: user.profile.age,
        gender: user.profile.gender as any,
        heightCm: user.profile.heightCm,
        weightKg: dto.weightKg,
        activityLevel: user.profile.activityLevel as any,
        targetGoal: user.profile.targetGoal as any,
        avatarUrl: user.profile.avatarUrl || undefined,
      };
      await this.updateProfile(firebaseUid, updatedProfileDto);
    }

    return { success: true, log };
  }

  async getWeightLogs(firebaseUid: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid }
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return this.prisma.weightLog.findMany({
      where: { userId: user.id },
      orderBy: [{ loggedDate: 'desc' }, { loggedAt: 'desc' }]
    });
  }

  async togglePremium(firebaseUid: string, isPremium: boolean) {
    const user = await this.prisma.user.update({
      where: { firebaseUid },
      data: { isPremium }
    });
    return { success: true, isPremium: user.isPremium };
  }

  async updateAvatarFilename(firebaseUid: string, avatarUrl: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.profile) {
      return this.prisma.userProfile.update({
        where: { userId: user.id },
        data: { avatarUrl },
      });
    } else {
      const defaultDto: UserProfileDto = {
        firstName: 'User',
        lastName: '',
        age: 25,
        gender: 'male',
        heightCm: 170,
        weightKg: 65,
        activityLevel: 'moderately_active',
        targetGoal: 'muscle_gain',
        avatarUrl,
      };
      const calculations = this.calculateMetrics(defaultDto);
      return this.prisma.userProfile.create({
        data: {
          user: { connect: { id: user.id } },
          ...defaultDto,
          ...calculations,
          xp: 0,
          level: 1,
        },
      });
    }
  }
}

