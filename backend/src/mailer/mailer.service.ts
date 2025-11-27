import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
    constructor(
        private readonly nestMailerService: NestMailerService,
        private readonly configService: ConfigService,
    ) { }

    async sendVerificationEmail(email: string, firstName: string, code: string) {
        const frontendBaseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const verifyUrl = `${frontendBaseUrl}/verify?email=${encodeURIComponent(email)}`;

        await this.nestMailerService.sendMail({
            to: email,
            subject: 'Verify your account',
            template: 'verify-email',
            context: { firstName, code, verifyUrl },
        });
    }

    async sendForgotPasswordEmail(email: string, firstName: string, code: string) {
        await this.nestMailerService.sendMail({
            to: email,
            subject: 'Password Recovery',
            template: 'forgot-password',
            context: { firstName, code },
        });
    }

    async sendWelcomeEmail(params: { to: string; name: string; email: string; password: string }) {
        const { to, name, email, password } = params;
        const frontendBaseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const loginUrl = `${frontendBaseUrl}/login`;

        await this.nestMailerService.sendMail({
            to,
            subject: 'Welcome!',
            template: 'welcome',
            context: {
                name,
                email,
                password,
                loginUrl,
            },
        });
    }

    async sendAccountStatusEmail(email: string, firstName: string, status: 'Active' | 'Deactivated', reason?: string) {
        const color = status === 'Active' ? '#4CAF50' : '#FF4C4C';
        const frontendBaseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const loginUrl = `${frontendBaseUrl}/login`;

        await this.nestMailerService.sendMail({
            to: email,
            subject: `Your account has been ${status.toLowerCase()}`,
            template: 'account-status-update',
            context: {
                firstName,
                status,
                reason,
                color,
                loginUrl
            },
        });
    }

}
