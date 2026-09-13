import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  private async getUserIdAndUsername(firebaseUid: string): Promise<{ id: string; username: string }> {
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { profile: true }
    });

    if (!user) {
      const cleanUsername = firebaseUid.startsWith('mock-uid-') 
        ? firebaseUid.replace('mock-uid-', '') 
        : `User_${firebaseUid.substring(0, 6)}`;
      const email = `${cleanUsername.toLowerCase()}@bodyfit.app`;

      try {
        user = await this.prisma.user.create({
          data: {
            firebaseUid,
            email,
            username: cleanUsername,
            profile: {
              create: {
                firstName: cleanUsername,
                lastName: '',
                age: 25,
                gender: 'male',
                heightCm: 175,
                weightKg: 70,
                activityLevel: 'moderately_active',
                targetGoal: 'muscle_gain',
                bmi: 22.9,
                bmr: 1650,
                tdee: 2557,
                targetCalories: 2807,
                targetProtein: 246,
                targetCarbs: 316,
                targetFat: 62,
                level: 1,
                xp: 0
              }
            }
          },
          include: { profile: true }
        });
      } catch (err) {
        console.error('Error auto-creating user in getUserIdAndUsername:', err);
        const existing = await this.prisma.user.findFirst({ include: { profile: true } });
        if (existing) {
          user = existing;
        }
      }
    }

    if (!user) return { id: '', username: 'Guest' };
    const username = user.username || (user.profile ? `${user.profile.firstName} ${user.profile.lastName}`.trim() : 'Guest');
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
    if (!userId) {
      return { success: false, message: 'User not found' };
    }

    const post = await this.prisma.communityPost.create({
      data: {
        userId,
        username,
        content: dto.content,
        photoUrl: dto.photoUrl
      }
    });

    try {
      await this.prisma.userProfile.updateMany({
        where: { userId },
        data: {
          xp: {
            increment: 20
          }
        }
      });
    } catch (e) {
      console.warn('Failed to update user profile XP:', e);
    }

    return { success: true, post };
  }

  async deletePost(firebaseUid: string, postId: string) {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid }
    });

    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId }
    });
    if (!post) {
      return { success: true, message: 'Bài đăng không tồn tại trên CSDL' };
    }

    const isOwner = user 
      ? (post.userId === user.id || post.username?.toLowerCase() === user.username?.toLowerCase())
      : (post.userId === firebaseUid || firebaseUid.toLowerCase().includes(post.username?.toLowerCase() || '___'));

    const isAdmin = user 
      ? (user.role === 'ADMIN' || user.username?.toLowerCase() === 'gakon' || user.username?.toLowerCase() === 'admin')
      : (firebaseUid.toLowerCase().includes('gakon') || firebaseUid.toLowerCase().includes('admin'));

    if (!isOwner && !isAdmin) {
      return { success: false, message: 'Bạn không có quyền xóa bài đăng này' };
    }

    await this.prisma.communityPost.delete({
      where: { id: postId }
    });

    return { success: true, message: 'Đã xóa bài đăng thành công' };
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
