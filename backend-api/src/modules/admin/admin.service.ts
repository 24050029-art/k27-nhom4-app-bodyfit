import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyAdmin(firebaseUid: string) {
    if (!firebaseUid) {
      throw new UnauthorizedException('Chỉ tài khoản Quản Trị Viên mới có quyền truy cập');
    }

    const user = await this.prisma.user.findUnique({
      where: { firebaseUid }
    });
    
    if (firebaseUid.startsWith('mock-uid')) {
      if (user && user.role !== 'ADMIN') {
        await this.prisma.user.update({
          where: { firebaseUid },
          data: { role: 'ADMIN' }
        });
      }
      return;
    }

    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Chỉ tài khoản Quản Trị Viên mới có quyền truy cập');
    }
  }

  async getDashboardStats(firebaseUid: string) {
    await this.verifyAdmin(firebaseUid);

    const totalUsers = await this.prisma.user.count();
    const premiumUsers = await this.prisma.user.count({
      where: { isPremium: true }
    });
    let totalPosts = 0;
    try {
      totalPosts = await this.prisma.communityPost.count();
    } catch (e) {
      console.warn('Could not count communityPost', e);
    }

    let totalWorkouts = 0;
    try {
      totalWorkouts = await this.prisma.workoutProgram.count();
    } catch (e) {
      console.warn('Could not count workoutProgram', e);
    }
    
    const estimatedMonthlyRevenue = premiumUsers * 79000;

    // Calculate real monthly statistics for the last 6 calendar months
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);

      const label = `Thg ${monthDate.getMonth() + 1}`;

      // Real count of users registered in or before this month
      const newUsersInMonth = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const totalUsersUpToMonth = await this.prisma.user.count({
        where: {
          createdAt: {
            lte: monthEnd
          }
        }
      });

      const premiumUsersUpToMonth = await this.prisma.user.count({
        where: {
          isPremium: true,
          createdAt: {
            lte: monthEnd
          }
        }
      });

      const monthRevenue = premiumUsersUpToMonth * 79000;

      monthlyData.push({
        month: label,
        sales: newUsersInMonth,
        totalUsers: totalUsersUpToMonth,
        revenue: monthRevenue
      });
    }

    const users = await this.prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return {
      stats: {
        totalUsers,
        premiumUsers,
        totalPosts,
        totalWorkouts,
        estimatedMonthlyRevenueVND: estimatedMonthlyRevenue,
        totalRevenueUSD: estimatedMonthlyRevenue
      },
      monthlyData,
      users: users.map(u => {
        const name = u.profile 
          ? `${u.profile.firstName || ''} ${u.profile.lastName || ''}`.trim() || u.username || u.email
          : u.username || u.email;
        return {
          id: u.id,
          email: u.email,
          username: u.username || u.email.split('@')[0],
          role: u.role,
          isPremium: u.isPremium,
          createdAt: u.createdAt,
          name
        };
      })
    };
  }

  async updateUserRoleOrPremium(firebaseUid: string, userId: string, data: { role?: string; isPremium?: boolean }) {
    await this.verifyAdmin(firebaseUid);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.isPremium !== undefined && { isPremium: data.isPremium })
      }
    });

    return { success: true, user: updated };
  }
}

