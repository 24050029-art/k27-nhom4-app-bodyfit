import { Controller, Post, Headers, UnauthorizedException, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Đồng bộ tài khoản từ Firebase token' })
  async syncUser(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token header format');
    }
    const token = authHeader.split(' ')[1];
    const decoded = await this.authService.verifyToken(token);
    
    // Find or create the user in MariaDB
    const user = await this.authService.syncUser(decoded);
    return { success: true, user };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới cho tài khoản truyền thống' })
  async resetPassword(
    @Body('usernameOrEmail') usernameOrEmail: string,
    @Body('newPassword') newPassword: string
  ) {
    const user = await this.authService.resetPassword(usernameOrEmail, newPassword);
    return { success: true, message: 'Đặt lại mật khẩu thành công', username: user.username };
  }

  @Post('register/send-otp')
  @ApiOperation({ summary: 'Gửi mã OTP đăng ký tài khoản qua Email hoặc Số điện thoại' })
  async sendRegisterOtp(
    @Body('username') username: string,
    @Body('emailOrPhone') emailOrPhone: string,
    @Body('password') passwordHash: string
  ) {
    return this.authService.sendRegisterOtp(username, emailOrPhone, passwordHash);
  }

  @Post('register/verify-otp')
  @ApiOperation({ summary: 'Xác thực mã OTP để hoàn tất đăng ký' })
  async verifyRegisterOtp(
    @Body('emailOrPhone') emailOrPhone: string,
    @Body('otp') otp: string
  ) {
    const result = await this.authService.verifyRegisterOtp(emailOrPhone, otp);
    return { success: true, ...result };
  }

  @Post('forgot-password/send-otp')
  @ApiOperation({ summary: 'Gửi mã OTP quên mật khẩu qua Email hoặc Số điện thoại' })
  async sendForgotPasswordOtp(
    @Body('emailOrPhone') emailOrPhone: string
  ) {
    return this.authService.sendForgotPasswordOtp(emailOrPhone);
  }

  @Post('forgot-password/verify-otp')
  @ApiOperation({ summary: 'Xác thực OTP và đặt mật khẩu mới' })
  async verifyForgotPasswordOtp(
    @Body('emailOrPhone') emailOrPhone: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPasswordHash: string
  ) {
    await this.authService.verifyForgotPasswordOtp(emailOrPhone, otp, newPasswordHash);
    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  }
}


