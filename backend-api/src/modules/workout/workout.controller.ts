import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkoutService } from './workout.service';
import { FirebaseStrategy } from '../auth/firebase.strategy';

@ApiTags('Workout Program')
@ApiBearerAuth()
@UseGuards(FirebaseStrategy)
@Controller('workouts')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Get('programs')
  @ApiOperation({ summary: 'Lấy danh sách các chương trình tập luyện mẫu' })
  async getPrograms() {
    const programs = await this.workoutService.getAllPrograms();
    return { success: true, programs };
  }

  @Delete('programs/:id')
  @ApiOperation({ summary: 'Xóa bài tập khỏi lộ trình' })
  async deleteProgram(@Param('id') id: string) {
    return this.workoutService.deleteProgram(id);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Lấy danh sách lịch tập đã lên kế hoạch' })
  async getSchedules(@Request() req: any) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    const schedules = await this.workoutService.getUserSchedules(firebaseUid);
    return { success: true, schedules };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Lên lịch tập cho một ngày nhất định' })
  async scheduleWorkout(
    @Request() req: any, 
    @Body('programId') programId: string, 
    @Body('date') date: string,
    @Body('title') title?: string,
    @Body('exercises') exercises?: any[]
  ) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.workoutService.scheduleWorkout(firebaseUid, programId, date, title, exercises);
  }

  @Post('schedules/:id/complete')
  @ApiOperation({ summary: 'Đánh dấu buổi tập đã hoàn thành' })
  async completeWorkout(@Request() req: any, @Param('id') scheduleId: string) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.workoutService.completeWorkout(firebaseUid, scheduleId);
  }
}
