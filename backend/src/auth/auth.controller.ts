import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyDto } from './dto/verify.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() data: RegisterDto) {
        return this.authService.register(data);
    }

    @Post('verify')
    verify(@Body() data: VerifyDto) {
        return this.authService.verifyEmail(data.email, data.code);
    }
    @Post('resend-verification')
    resendVerification(@Body() body: { email: string }) {
        return this.authService.resendVerification(body.email);
    }

    @Post('login')
    login(@Body() data: LoginDto) {
        return this.authService.login(data.email, data.password);
    }

    @Post('forgot-password')
    forgotPassword(@Body() data: ForgotPasswordDto) {
        return this.authService.forgotPassword(data.email);
    }
    @Post('reset-password')
    resetPassword(@Body() data: ResetPasswordDto) {
        const { email, code, newPassword } = data;
        return this.authService.resetPassword(email, code, newPassword);
    }

    @Post('logout')
    logout() {
        return this.authService.logout();
    }
}
