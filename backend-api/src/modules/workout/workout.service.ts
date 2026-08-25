import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkoutService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.workoutProgram.count();
      if (count === 0) {
        await this.seedWorkouts();
      }
    } catch (e) {
      console.warn('Could not seed workouts (db might not be ready)', e);
    }
  }

  private async seedWorkouts() {
    const workouts = [
      {
        title: 'Tập Gym Toàn Thân Tăng Cơ 🏋️‍♂️',
        description: 'Tập luyện kháng lực toàn thân tăng cơ giảm mỡ tại phòng Gym chuyên nghiệp.',
        category: 'GYM',
        difficulty: 'INTERMEDIATE',
        exercises: [
          { name: 'Squat Gánh Tạ', sets: 4, reps: '8-10', orderIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
          { name: 'Bench Press Đẩy Ngực Ngang', sets: 4, reps: '8-12', orderIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
          { name: 'Deadlift Kéo Tạ', sets: 3, reps: '5', orderIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        title: 'Cardio HIIT Đốt Mỡ Thừa 🏃‍♂️',
        description: 'Chương trình Cardio cường độ cao giúp tiêu hao calo tối đa tại nhà hoặc ngoài trời.',
        category: 'CARDIO',
        difficulty: 'BEGINNER',
        exercises: [
          { name: 'Jumping Jacks Nhảy Tay Cao', sets: 3, reps: '30s', orderIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80' },
          { name: 'Burpees Nhảy Phục Đất', sets: 3, reps: '10-12', orderIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' },
          { name: 'High Knees Chạy Nâng Cao Đùi', sets: 3, reps: '45s', orderIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        title: 'Tập Kháng Lực Tại Nhà Không Tạ 🏠',
        description: 'Tập luyện kháng lực sử dụng trọng lượng cơ thể, không cần thiết bị.',
        category: 'HOME',
        difficulty: 'BEGINNER',
        exercises: [
          { name: 'Push Up Chống Đẩy', sets: 3, reps: '15', orderIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80' },
          { name: 'Bodyweight Squats Squat Không Tạ', sets: 4, reps: '20', orderIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=400&q=80' },
          { name: 'Plank Giữ Cơ Bụng', sets: 3, reps: '60s', orderIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80' }
        ]
      },
      {
        title: 'Yoga Chào Mặt Trời Thư Giãn 🧘‍♂️',
        description: 'Chuỗi động tác Yoga thư thái khởi động ngày mới, cải thiện sự linh hoạt và tĩnh tâm.',
        category: 'YOGA',
        difficulty: 'BEGINNER',
        exercises: [
          { name: 'Tư thế Chó Úp Mặt (Downward Dog)', sets: 3, reps: '5 nhịp thở', orderIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80' },
          { name: 'Tư thế Rắn Hổ Mang (Cobra)', sets: 3, reps: '5 nhịp thở', orderIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80' },
          { name: 'Tư thế Chiến Sĩ (Warrior I)', sets: 3, reps: '5 nhịp thở', orderIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80' }
        ]
      }
    ];

    for (const w of workouts) {
      await this.prisma.workoutProgram.create({
        data: {
          title: w.title,
          description: w.description,
          category: w.category,
          difficulty: w.difficulty,
          exercises: {
            create: w.exercises
          }
        }
      });
    }
  }

  async getAllPrograms() {
    return this.prisma.workoutProgram.findMany({
      include: { exercises: true }
    });
  }

  private async getUserId(firebaseUid: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });
    return user ? user.id : '';
  }

  async scheduleWorkout(firebaseUid: string, programId: string, date: string, customTitle?: string, customExercises?: any[]) {
    const userId = await this.getUserId(firebaseUid);

    // Check if program exists
    const programExists = await this.prisma.workoutProgram.findUnique({
      where: { id: programId }
    });

    if (!programExists) {
      // Dynamically create a custom program in the database to satisfy FK constraint
      await this.prisma.workoutProgram.create({
        data: {
          id: programId,
          title: customTitle || 'Bài tập tự chọn',
          description: 'Bài tập tùy chỉnh từ thiết bị',
          category: 'HOME',
          difficulty: 'BEGINNER',
          exercises: {
            create: (customExercises || []).map((ex: any, idx: number) => ({
              name: ex.name,
              sets: ex.sets || 3,
              reps: String(ex.reps) || '12',
              orderIndex: idx
            }))
          }
        }
      });
    }

    const schedule = await this.prisma.userWorkoutSchedule.create({
      data: {
        userId,
        programId,
        scheduledDate: date,
      }
    });
    return { success: true, scheduleId: schedule.id };
  }

  async completeWorkout(firebaseUid: string, scheduleId: string) {
    const userId = await this.getUserId(firebaseUid);
    const schedule = await this.prisma.userWorkoutSchedule.update({
      where: { id: scheduleId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
      include: { program: true }
    });

    // Sync to DailyDeclaration
    const scheduledDate = schedule.scheduledDate;
    const completedSchedules = await this.prisma.userWorkoutSchedule.findMany({
      where: { userId, scheduledDate, isCompleted: true },
      include: { program: true }
    });
    const workoutName = completedSchedules.length > 0
      ? completedSchedules.map(s => s.program?.title || 'Bài tập').join(', ')
      : null;

    const decl = await this.prisma.dailyDeclaration.findUnique({
      where: {
        userId_date: {
          userId,
          date: scheduledDate
        }
      }
    });
    if (decl) {
      await this.prisma.dailyDeclaration.update({
        where: { id: decl.id },
        data: { workoutName }
      });
    } else {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const username = user?.username || user?.email?.split('@')[0] || 'Người dùng';
      await this.prisma.dailyDeclaration.create({
        data: {
          userId,
          date: scheduledDate,
          activity: '',
          image: '',
          steps: 0,
          activeCalories: 0,
          activeTime: 0,
          username,
          workoutName
        }
      });
    }

    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        xp: {
          increment: 50
        }
      }
    });

    return { success: true, schedule };
  }

  async getUserSchedules(firebaseUid: string) {
    const userId = await this.getUserId(firebaseUid);
    return this.prisma.userWorkoutSchedule.findMany({
      where: { userId },
      include: {
        program: {
          include: { exercises: true }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    });
  }

  async deleteProgram(id: string) {
    try {
      await this.prisma.workoutProgram.delete({
        where: { id }
      });
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Program not found or already deleted' };
    }
  }
}
