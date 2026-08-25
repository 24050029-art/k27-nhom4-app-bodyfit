import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FirebaseStrategy } from '../auth/firebase.strategy';

@ApiTags('Admin Panel')
@ApiBearerAuth()
@UseGuards(FirebaseStrategy)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Lấy các chỉ số thống kê hệ thống' })
  async getDashboard(@Request() req: any) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.adminService.getDashboardStats(firebaseUid);
  }

  @Post('users/:id/role')
  @ApiOperation({ summary: 'Cập nhật quyền hạn (role) và trạng thái Premium của người dùng' })
  async updateUserRole(
    @Request() req: any,
    @Param('id') userId: string,
    @Body() data: { role?: string; isPremium?: boolean }
  ) {
    const firebaseUid = req.user?.uid || 'mock-uid';
    return this.adminService.updateUserRoleOrPremium(firebaseUid, userId, data);
  }
}
