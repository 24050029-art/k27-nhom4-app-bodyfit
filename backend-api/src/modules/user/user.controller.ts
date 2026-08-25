import { Controller, Get, Post, Body, UseGuards, Request, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService, UserProfileDto } from './user.service';
import { FirebaseStrategy } from '../auth/firebase.strategy';
import { Response } from 'express';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

class UploadAvatarDto {
  @IsString()
  @IsNotEmpty()
  base64: string;
}

class LogWeightDto {
  @IsNumber()
  weightKg: number;

  @IsNumber()
  @IsOptional()
  waistCm?: number;

  @IsNumber()
  @IsOptional()
  chestCm?: number;

  @IsNumber()
  @IsOptional()
  hipsCm?: number;

  @IsNumber()
  @IsOptional()
  bodyFatPct?: number;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsNotEmpty()
  loggedDate: string;
}

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(FirebaseStrategy)
  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin hồ sơ' })
  async getProfile(@Request() req: any) {
    const userId = req.user?.uid || 'mock-uid';
    const profile = await this.userService.getProfile(userId);
    if (!profile) {
      return { success: false, message: 'Profile not found' };
    }
    if (profile.avatarUrl) {
      if (!profile.avatarUrl.startsWith('http') && !profile.avatarUrl.startsWith('data:') && !profile.avatarUrl.startsWith('file:')) {
        const host = req.headers.host || 'localhost:3000';
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        const protocol = isSecure ? 'https' : 'http';
        profile.avatarUrl = `${protocol}://${host}/v1/users/avatars/${profile.avatarUrl}`;
      }
    }
    return { success: true, profile };
  }

  @UseGuards(FirebaseStrategy)
  @Post('profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ' })
  async updateProfile(@Request() req: any, @Body() dto: UserProfileDto) {
    const userId = req.user?.uid || 'mock-uid';
    const profile = await this.userService.updateProfile(userId, dto);
    if (profile && profile.avatarUrl) {
      if (!profile.avatarUrl.startsWith('http') && !profile.avatarUrl.startsWith('data:') && !profile.avatarUrl.startsWith('file:')) {
        const host = req.headers.host || 'localhost:3000';
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        const protocol = isSecure ? 'https' : 'http';
        profile.avatarUrl = `${protocol}://${host}/v1/users/avatars/${profile.avatarUrl}`;
      }
    }
    return { success: true, profile };
  }

  @UseGuards(FirebaseStrategy)
  @Post('weight')
  @ApiOperation({ summary: 'Ghi chép cân nặng' })
  async logWeight(@Request() req: any, @Body() dto: LogWeightDto) {
    const userId = req.user?.uid || 'mock-uid';
    return this.userService.logWeight(userId, dto);
  }

  @UseGuards(FirebaseStrategy)
  @Get('weight')
  @ApiOperation({ summary: 'Lấy lịch sử cân nặng' })
  async getWeightLogs(@Request() req: any) {
    const userId = req.user?.uid || 'mock-uid';
    const logs = await this.userService.getWeightLogs(userId);
    return { success: true, logs };
  }

  @UseGuards(FirebaseStrategy)
  @Post('premium/activate')
  @ApiOperation({ summary: 'Kích hoạt premium' })
  async togglePremium(@Request() req: any, @Body('isPremium') isPremium: boolean) {
    const userId = req.user?.uid || 'mock-uid';
    return this.userService.togglePremium(userId, isPremium);
  }

  @UseGuards(FirebaseStrategy)
  @Post('profile/avatar')
  @ApiOperation({ summary: 'Tải lên ảnh đại diện base64' })
  async uploadAvatar(@Request() req: any, @Body() dto: UploadAvatarDto) {
    const userId = req.user?.uid || 'mock-uid';
    
    const base64Data = dto.base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const dir = join(process.cwd(), 'public', 'avatars');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    let extension = 'jpg';
    if (buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      extension = 'png';
    } else if (buffer.length > 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      extension = 'gif';
    } else if (buffer.length > 4 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      extension = 'webp';
    }
    
    const filename = `${userId}-${Date.now()}.${extension}`;
    const filePath = join(dir, filename);
    writeFileSync(filePath, buffer);
    
    // Save to user profile in DB immediately
    await this.userService.updateAvatarFilename(userId, filename);

    const host = req.headers.host || 'localhost:3000';
    const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
    const protocol = isSecure ? 'https' : 'http';
    const url = `${protocol}://${host}/v1/users/avatars/${filename}`;
    
    return { success: true, url };
  }

  @Get('avatars/:filename')
  @ApiOperation({ summary: 'Lấy ảnh đại diện' })
  async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'avatars', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Không tìm thấy hình ảnh');
    }
    return res.sendFile(filePath);
  }
}
