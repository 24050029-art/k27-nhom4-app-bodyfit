import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserIdAndUsername(firebaseUid: string): Promise<{ id: string; username: string }> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true }
    });
    if (!user) return { id: '', username: 'Guest' };
    const username = user.username || (user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Guest');
    return { id: user.id, username };
  }

  async getPosts() {
    const posts = await this.prisma.communityPost.findMany({
      include: {
        likes: true,
        comments: {
          orderBy: { createdAt: 'asc' }
        },
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return posts.map(p => ({
      id: p.id,
      userId: p.userId,
      username: p.username,
      content: p.content,
      photoUrl: p.photoUrl,
      createdAt: p.createdAt,
      likes: p.likes,
      comments: p.comments,
      userProfile: {
        avatarUrl: p.user?.profile?.avatarUrl || null,
        level: p.user?.profile?.level || 1
      }
    }));
  }

  async createPost(firebaseUid: string, dto: { content: string; photoUrl?: string }) {
    const { id: userId, username } = await this.getUserIdAndUsername(firebaseUid);
    const post = await this.prisma.communityPost.create({
      data: {
        userId,
        username,
        content: dto.content,
        photoUrl: dto.photoUrl
      }
    });

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        xp: {
          increment: 20
        }
      }
    });

    return { success: true, post };
  }

  async toggleLike(firebaseUid: string, postId: string) {
    const { id: userId } = await this.getUserIdAndUsername(firebaseUid);

    const existingLike = await this.prisma.communityPostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existingLike) {
      await this.prisma.communityPostLike.delete({
        where: {
          postId_userId: {
            postId,
            userId
          }
        }
      });
      return { success: true, liked: false };
    } else {
      await this.prisma.communityPostLike.create({
        data: {
          postId,
          userId
        }
      });
      return { success: true, liked: true };
    }
  }

  async addComment(firebaseUid: string, postId: string, content: string) {
    const { id: userId, username } = await this.getUserIdAndUsername(firebaseUid);

    const comment = await this.prisma.communityPostComment.create({
      data: {
        postId,
        userId,
        username,
        content
      }
    });

    return { success: true, comment };
  }

  async getLeaderboard() {
    const topActive = await this.prisma.userProfile.findMany({
      select: {
        firstName: true,
        lastName: true,
        level: true,
        xp: true,
        user: {
          select: { username: true }
        }
      },
      orderBy: [
        { level: 'desc' },
        { xp: 'desc' }
      ],
      take: 10
    });

    const users = await this.prisma.user.findMany({
      where: {
        profile: { isNot: null },
        weightLogs: { some: {} }
      },
      include: {
        profile: true,
        weightLogs: {
          orderBy: { loggedAt: 'asc' }
        }
      }
    });

    const weightLossList = users.map(u => {
      const logs = u.weightLogs;
      if (logs.length < 2) {
        const oldestWeight = u.profile?.weightKg || 70;
        const currentWeight = logs[0].weightKg;
        const loss = oldestWeight - currentWeight;
        return {
          username: u.username || `${u.profile?.firstName} ${u.profile?.lastName}`,
          weightLostKg: Number(loss.toFixed(1)),
          currentWeightKg: currentWeight
        };
      } else {
        const oldestWeight = logs[0].weightKg;
        const currentWeight = logs[logs.length - 1].weightKg;
        const loss = oldestWeight - currentWeight;
        return {
          username: u.username || `${u.profile?.firstName} ${u.profile?.lastName}`,
          weightLostKg: Number(loss.toFixed(1)),
          currentWeightKg: currentWeight
        };
      }
    })
    .sort((a, b) => b.weightLostKg - a.weightLostKg)
    .slice(0, 10);

    return {
      topActive: topActive.map(item => ({
        name: item.firstName ? `${item.firstName} ${item.lastName}` : (item.user.username || 'User'),
        level: item.level,
        xp: item.xp
      })),
      topWeightLoss: weightLossList
    };
  }
}
