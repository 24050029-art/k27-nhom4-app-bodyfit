import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
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
  async getPosts(@Request() req: any) {
    const posts = await this.communityService.getPosts();
    const host = req.headers?.host || 'localhost:3000';
    const isSecure = req.secure || req.headers?.['x-forwarded-proto'] === 'https';
    const protocol = isSecure ? 'https' : 'http';

    const formattedPosts = posts.map((p: any) => {
      let av = p.userProfile?.avatarUrl;
      if (av && !av.startsWith('http') && !av.startsWith('data:') && !av.startsWith('file:')) {
        av = `${protocol}://${host}/v1/users/avatars/${av}`;
      } else if (av && av.includes('localhost:3000')) {
        av = av.replace('localhost:3000', host);
      }

      let photo = p.photoUrl;
      if (photo && !photo.startsWith('http') && !photo.startsWith('data:') && !photo.startsWith('file:')) {
        photo = `${protocol}://${host}/v1/users/avatars/${photo}`;
      } else if (photo && photo.includes('localhost:3000')) {
        photo = photo.replace('localhost:3000', host);
      }

      return {
        ...p,
        photoUrl: photo,
        userProfile: {
          ...p.userProfile,
          avatarUrl: av
        }
      };
    });

    return { success: true, posts: formattedPosts };
  }

  @Post('posts')
  @ApiOperation({ summary: 'Đăng tải bài viết mới chia sẻ quá trình' })
  async createPost(@Request() req: any, @Body() dto: CreatePostDto) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.communityService.createPost(firebaseUid, dto);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Xóa bài đăng (Chủ bài viết hoặc Admin)' })
  async deletePost(@Request() req: any, @Param('id') postId: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.communityService.deletePost(firebaseUid, postId);
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
