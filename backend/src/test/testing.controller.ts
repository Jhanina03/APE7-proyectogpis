import { Controller, Get, Query, BadRequestException, Delete } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@Controller('testing')
export class TestingController {
    constructor(private authService: AuthService, private usersService: UsersService) { }

    @Get('code')
    async getVerificationCode(
        @Query('email') email: string,
        @Query('type') type: 'VERIFICATION' | 'RECOVERY' = 'VERIFICATION'
    ) {
        if (!email) {
            throw new BadRequestException('Email query parameter is required');
        }

        const code = await this.authService.getLatestCodeForTesting(email, type);

        if (!code) {
            return { code: null, message: `No active ${type} code found for this email.` };
        }

        return {
            code,
            type
        };
    }
    @Delete('user')
    async deleteUser(@Query('email') email: string) {
        if (!email) throw new BadRequestException('Email is required');

        return this.usersService.deleteByEmail(email);
    }
}