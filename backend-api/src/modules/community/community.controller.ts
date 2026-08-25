import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { FirebaseStrategy } from '../auth/firebase.strategy';

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

@ApiTags('Community & Leaderboards')
@ApiBearerAuth()
@UseGuards(FirebaseStrategy)
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  @ApiOperation({ summary: 'Lấy danh sách các bài đăng trong cộng đồng' })
  async getPosts() {
    const posts = await this.communityService.getPosts();
    return { success: true, posts };
  }

  @Post('posts')
  @ApiOperation({ summary: 'Đăng tải bài viết mới chia sẻ quá trình' })
  async createPost(@Request() req: any, @Body() dto: CreatePostDto) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.communityService.createPost(firebaseUid, dto);
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Thích hoặc Bỏ thích bài đăng' })
  async toggleLike(@Request() req: any, @Param('id') postId: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.communityService.toggleLike(firebaseUid, postId);
  }

  @Post('posts/:id/comment')
  @ApiOperation({ summary: 'Bình luận vào bài đăng' })
  async addComment(@Request() req: any, @Param('id') postId: string, @Body('content') content: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.communityService.addComment(firebaseUid, postId, content);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Lấy bảng xếp hạng hoạt động & giảm cân' })
  async getLeaderboard() {
    const leaderboard = await this.communityService.getLeaderboard();
    return { success: true, leaderboard };
  }
}
