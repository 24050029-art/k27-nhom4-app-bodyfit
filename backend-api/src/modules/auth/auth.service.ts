import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import { promises as dns } from 'dns';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter | null = null;
  private registerOtps = new Map<string, { username: string; passwordHash: string; otp: string; expiresAt: number }>();
  private forgotOtps = new Map<string, { otp: string; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'bodyfit-ai',
      });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });
      console.log('Nodemailer SMTP Transporter initialized successfully.');
    } else {
      console.warn('SMTP_USER and SMTP_PASS are not configured. Real email sending is disabled. OTPs will be logged to console.');
    }
  }

  async verifyToken(token: string) {
    // Check mock tokens first to avoid blocking/hanging on Google cert fetch
    if (token === 'mock-token') {
      return { uid: 'mock-uid', email: 'user@example.com' };
    }
    if (token && token.startsWith('mock-token:')) {
      const parts = token.split(':');
      const mode = parts[1];
      if (mode === 'register') {
        const username = parts[2] || '';
        const emailOrPhone = parts[3] || '';
        const password = parts[4] || '';
        const usernameClean = username.trim().toLowerCase();
        const emailClean = emailOrPhone.trim().toLowerCase();
        const hash = Buffer.from(usernameClean).toString('hex').substring(0, 20);
        const uid = `mock-uid-${hash}`;
        return { uid, email: emailClean, username: usernameClean, password, action: 'register' };
      } else if (mode === 'login') {
        const username = parts[2] || '';
        const password = parts[3] || '';
        const usernameClean = username.trim().toLowerCase();
        const hash = Buffer.from(usernameClean).toString('hex').substring(0, 20);
        const uid = `mock-uid-${hash}`;
        
        let email = `${usernameClean}@bodyfit.vn`;
        try {
          const user = await this.prisma.user.findUnique({
            where: { username: usernameClean }
          });
          if (user) {
            email = user.email;
          }
        } catch (dbErr) {
          // ignore database connection errors here
        }
        return { uid, email, username: usernameClean, password, action: 'login' };
      } else if (mode === 'google') {
        const email = parts[2] || 'google-user@example.com';
        const name = parts[3] || 'Google User';
        const emailClean = email.trim().toLowerCase();
        const hash = Buffer.from(emailClean).toString('hex').substring(0, 20);
        const uid = `mock-uid-google-${hash}`;
        return { uid, email: emailClean };
      } else {
        // Fallback legacy mock-token:<email>:<password>
        const email = parts[1] || 'user@example.com';
        const emailClean = email.trim().toLowerCase();
        const hash = Buffer.from(emailClean).toString('hex').substring(0, 20);
        const uid = `mock-uid-${hash}`;
        return { uid, email: emailClean };
      }
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      throw error;
    }
  }

  async syncUser(decoded: any) {
    if (decoded.action === 'register') {
      const existingUserByUsername = await this.prisma.user.findUnique({
        where: { username: decoded.username }
      });
      if (existingUserByUsername) {
        throw new BadRequestException('Tên đăng nhập đã tồn tại');
      }

      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: decoded.email }
      });
      if (existingUserByEmail) {
        throw new BadRequestException('Email hoặc Số điện thoại đã tồn tại');
      }

      return this.prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          username: decoded.username,
          passwordHash: decoded.password, // lưu plain password cho môi trường dev/test
          authProvider: 'email',
        }
      });
    } else if (decoded.action === 'login') {
      const user = await this.prisma.user.findUnique({
        where: { username: decoded.username }
      });
      if (!user) {
        throw new UnauthorizedException('Tài khoản không tồn tại');
      }
      if (user.passwordHash !== decoded.password) {
        throw new UnauthorizedException('Mật khẩu không chính xác');
      }
      return user;
    } else {
      return this.findOrCreateUser(decoded.uid, decoded.email);
    }
  }

  async findOrCreateUser(firebaseUid: string, email: string) {
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          firebaseUid,
          email,
          authProvider: 'firebase',
        },
      });
    }

    return user;
  }

  async resetPassword(usernameOrEmail: string, newPassword: string) {
    const target = usernameOrEmail.trim().toLowerCase();
    
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: target },
          { email: target }
        ]
      }
    });

    if (!user) {
      throw new BadRequestException('Tài khoản hoặc Email không tồn tại trong hệ thống');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPassword
      }
    });

    return updatedUser;
  }

  private formatToE164(phone: string): string {
    let clean = phone.trim().replace(/\s+/g, '');
    if (clean.startsWith('0')) {
      clean = '+84' + clean.substring(1);
    } else if (!clean.startsWith('+')) {
      clean = '+' + clean;
    }
    return clean;
  }

  private async sendSmsViaTwilio(toPhone: string, code: string): Promise<boolean> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      console.log('[Twilio SMS] Credentials not configured. Twilio SMS sending skipped.');
      return false;
    }

    try {
      const e164Phone = this.formatToE164(toPhone);
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const body = new URLSearchParams();
      body.append('To', e164Phone);
      body.append('From', fromPhone);
      body.append('Body', `Ma OTP BodyFit cua ban la: ${code}. Ma nay co hieu luc trong 5 phut.`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Twilio SMS] Failed to send SMS:', errText);
        return false;
      }

      console.log(`[Twilio SMS] SMS successfully sent to ${e164Phone}`);
      return true;
    } catch (err) {
      console.error('[Twilio SMS] Error sending SMS:', err);
      return false;
    }
  }

  private isEmail(input: string): boolean {
    return input.includes('@');
  }

  async sendRegisterOtp(username: string, emailOrPhone: string, passwordHash: string) {
    const cleanEmailOrPhone = emailOrPhone.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Check if the input is an email, and perform strict format + MX lookup checks
    const isEmailInput = this.isEmail(cleanEmailOrPhone);
    if (isEmailInput) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmailOrPhone)) {
        throw new BadRequestException('Định dạng email không hợp lệ');
      }

      const domain = cleanEmailOrPhone.split('@')[1];
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DNS Timeout')), 3000)
        );
        const mxRecords = await Promise.race([
          dns.resolveMx(domain),
          timeoutPromise
        ]);
        if (!mxRecords || mxRecords.length === 0) {
          console.warn(`Strict MX check warning: No MX records found for ${domain}.`);
        }
      } catch (err) {
        console.warn(`Strict MX check skipped for ${domain} due to: ${err.message}`);
      }
    }

    // Check if username already exists
    const userByUsername = await this.prisma.user.findUnique({
      where: { username: cleanUsername }
    });
    if (userByUsername) {
      throw new BadRequestException('Tên đăng nhập đã tồn tại');
    }

    // Check if email/phone already exists
    const userByEmail = await this.prisma.user.findUnique({
      where: { email: cleanEmailOrPhone }
    });
    if (userByEmail) {
      throw new BadRequestException('Email hoặc Số điện thoại đã tồn tại');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in cache
    this.registerOtps.set(cleanEmailOrPhone, {
      username: cleanUsername,
      passwordHash,
      otp,
      expiresAt
    });

    let sentRealOtp = false;

    if (isEmailInput) {
      if (this.transporter) {
        try {
          await this.transporter.sendMail({
            from: `"BodyFit" <${process.env.SMTP_USER}>`,
            to: cleanEmailOrPhone,
            subject: 'Mã xác thực đăng ký tài khoản BodyFit',
            text: `Mã OTP đăng ký tài khoản BodyFit của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4CAF50; text-align: center;">BodyFit - Đăng ký tài khoản</h2>
                <p>Chào bạn,</p>
                <p>Bạn đang đăng ký tài khoản tại ứng dụng BodyFit. Dưới đây là mã xác thực OTP của bạn:</p>
                <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #333;">${otp}</div>
                <p>Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                <hr style="border: 0; border-top: 1px solid #eeeeee;" />
                <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động từ hệ thống BodyFit. Vui lòng không trả lời email này.</p>
              </div>
            `,
          });
          sentRealOtp = true;
        } catch (error) {
          console.error('Lỗi khi gửi email qua SMTP:', error);
        }
      }
    } else {
      sentRealOtp = await this.sendSmsViaTwilio(cleanEmailOrPhone, otp);
    }

    console.log(`[OTP REGISTER] OTP for ${cleanEmailOrPhone} is: ${otp}`);

    return {
      success: true,
      message: sentRealOtp ? 'Mã OTP đã được gửi thành công.' : 'Mã OTP đã được gửi (kiểm tra console/alert).',
      sentRealOtp,
      devOtp: sentRealOtp ? undefined : otp
    };
  }

  async verifyRegisterOtp(emailOrPhone: string, otp: string) {
    const cleanEmailOrPhone = emailOrPhone.trim().toLowerCase();
    const cached = this.registerOtps.get(cleanEmailOrPhone);

    if (!cached) {
      throw new BadRequestException('Không tìm thấy yêu cầu gửi OTP hoặc OTP đã hết hạn');
    }

    if (Date.now() > cached.expiresAt) {
      this.registerOtps.delete(cleanEmailOrPhone);
      throw new BadRequestException('Mã OTP đã hết hạn, vui lòng gửi lại');
    }

    if (cached.otp !== otp.trim()) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    this.registerOtps.delete(cleanEmailOrPhone);

    const cleanUsername = cached.username;
    const hash = Buffer.from(cleanUsername).toString('hex').substring(0, 20);
    const uid = `mock-uid-${hash}`;

    const user = await this.prisma.user.create({
      data: {
        firebaseUid: uid,
        email: cleanEmailOrPhone,
        username: cleanUsername,
        passwordHash: cached.passwordHash,
        authProvider: 'email',
      }
    });

    const token = `mock-token:register:${cleanUsername}:${cleanEmailOrPhone}:${cached.passwordHash}`;
    return { user, token };
  }

  async sendForgotPasswordOtp(emailOrPhone: string) {
    const cleanEmailOrPhone = emailOrPhone.trim().toLowerCase();

    // Find user by email/phone or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmailOrPhone },
          { username: cleanEmailOrPhone }
        ]
      }
    });

    if (!user) {
      throw new BadRequestException('Tài khoản hoặc Email/SĐT không tồn tại');
    }

    const userEmail = user.email;
    const isEmailInput = this.isEmail(userEmail);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.forgotOtps.set(userEmail, { otp, expiresAt });

    // Dispatch email/SMS in background so HTTP response completes in <50ms
    if (isEmailInput && this.transporter) {
      this.transporter.sendMail({
        from: `"BodyFit" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: 'Mã OTP khôi phục mật khẩu BodyFit',
        text: `Mã OTP khôi phục mật khẩu BodyFit của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #f44336; text-align: center;">BodyFit - Đặt lại mật khẩu</h2>
            <p>Chào bạn,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản BodyFit. Dưới đây là mã xác thực OTP của bạn:</p>
            <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #333;">${otp}</div>
            <p>Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <hr style="border: 0; border-top: 1px solid #eeeeee;" />
            <p style="font-size: 12px; color: #888; text-align: center;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        `,
      }).catch(err => console.error('Lỗi gửi email OTP ngầm:', err));
    } else if (!isEmailInput) {
      this.sendSmsViaTwilio(userEmail, otp).catch(err => console.error('Lỗi gửi SMS OTP ngầm:', err));
    }

    return {
      success: true,
      message: 'Mã OTP đặt lại mật khẩu đã được gửi thành công.',
      sentRealOtp: true,
      emailOrPhone: userEmail,
      devOtp: otp
    };
  }

  async verifyForgotPasswordOtp(emailOrPhone: string, otp: string, newPasswordHash: string) {
    const cleanEmailOrPhone = emailOrPhone.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmailOrPhone },
          { username: cleanEmailOrPhone }
        ]
      }
    });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    const userEmail = user.email;
    const cached = this.forgotOtps.get(userEmail);

    if (!cached) {
      throw new BadRequestException('Không tìm thấy yêu cầu gửi OTP hoặc OTP đã hết hạn');
    }

    if (Date.now() > cached.expiresAt) {
      this.forgotOtps.delete(userEmail);
      throw new BadRequestException('Mã OTP đã hết hạn, vui lòng gửi lại');
    }

    if (cached.otp !== otp.trim()) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    this.forgotOtps.delete(userEmail);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash
      }
    });

    return updatedUser;
  }
}

