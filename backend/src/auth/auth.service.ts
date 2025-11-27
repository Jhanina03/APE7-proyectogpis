import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../mailer/mailer.service';
import { PrismaClient } from '@prisma/client';
import { isValidEcuadorianId } from '../utils/ecuador-id.util';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { NominatimService } from '../nominatim/nominatim.service';

@Injectable()
export class AuthService extends PrismaClient {
    constructor(
        private jwtService: JwtService,
        private mailer: MailerService,
        private nominatim: NominatimService,
    ) { super() }

    async register(data: any) {
        const existing = await this.user.findUnique({ where: { email: data.email } });

        if (existing) {
            if (existing.isVerified) {
                throw new BadRequestException('Email already in use');
            } else {
                await this.resendVerification(existing.email);
                return { message: 'Account exists but not verified. Verification code resent.' };
            }
        }

        if (!isValidEcuadorianId(data.nationalId)) {
            throw new BadRequestException('Invalid Ecuadorian national ID (cedula)');
        }
        const existingCedula = await this.user.findUnique({
            where: { nationalId: data.nationalId },
        });
        if (existingCedula) {
            throw new BadRequestException('National ID already registered');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        // Use provided coordinates or fallback to geocoding
        let latitude: number | null = data.latitude || null;
        let longitude: number | null = data.longitude || null;
        let geocodedAddress: string | null = null;

        if (latitude && longitude) {
            // Coordinates provided from frontend - use directly!
            geocodedAddress = data.address || null;
            console.log(`Using provided coordinates for user registration (lat: ${latitude}, lng: ${longitude})`);
        } else if (data.address) {
            // Fallback: geocode if coordinates not provided
            try {
                const geocoded = await this.nominatim.geocodeAddress(data.address);
                latitude = geocoded.latitude;
                longitude = geocoded.longitude;
                geocodedAddress = geocoded.address;
                console.log(`User address geocoded (fallback): ${geocodedAddress}`);
            } catch (error) {
                console.warn('Address geocoding failed during registration:', error.message);
                // Continue without location - it's optional for users
                geocodedAddress = data.address;
            }
        }

        try {
            const user = await this.user.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    nationalId: data.nationalId,
                    phone: data.phone,
                    address: geocodedAddress || data.address,
                    gender: data.gender,
                    passwordHash,
                    role: data.role || 'CLIENT',
                    isVerified: false,
                    latitude,
                    longitude,
                },
            });

            // Update PostGIS location if coordinates available
            if (latitude && longitude) {
                await this.user.update({
                    where: { id: user.id },
                    data: {
                        // PostGIS point will be set via raw query in the database
                    },
                });

                // Set PostGIS geometry using raw query
                await this.$executeRaw`
                    UPDATE "User"
                    SET location = ST_SetSRID(
                    ST_MakePoint(${longitude}, ${latitude}),
                    4326
                    )
                    WHERE id = ${user.id}
                `;
            }

            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            await this.token.create({
                data: {
                    token: verificationCode,
                    type: 'VERIFICATION',
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                    userId: user.id,
                },
            });

            await this.mailer.sendVerificationEmail(user.email, user.firstName, verificationCode);

            return { message: 'Verification code sent to email' };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                const field = (error.meta?.target as string[])?.[0];
                if (field === 'email') {
                    throw new BadRequestException('Email already in use');
                }
                if (field === 'nationalId') {
                    throw new BadRequestException('National ID already registered');
                }
            }
            throw error;
        }
    }



    async resendVerification(email: string) {
        const user = await this.user.findUnique({ where: { email } });
        if (!user) throw new BadRequestException('User not found');

        if (user.isVerified) {
            return { message: 'User already verified' };
        }

        const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);
        const recentCount = await this.token.count({
            where: {
                userId: user.id,
                type: 'VERIFICATION',
                createdAt: { gte: oneHourAgo },
            },
        });

        if (recentCount >= 5) {
            throw new BadRequestException('Too many verification attempts. Try again later.');
        }

        await this.token.updateMany({
            where: {
                userId: user.id,
                type: 'VERIFICATION',
                used: false,
            },
            data: { used: true },
        });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        await this.token.create({
            data: {
                token: verificationCode,
                type: 'VERIFICATION',
                expiresAt,
                userId: user.id,
            },
        });

        await this.mailer.sendVerificationEmail(user.email, user.firstName, verificationCode);

        return { message: 'Verification code resent to email' };
    }

    async verifyEmail(email: string, code: string) {
        const user = await this.user.findUnique({ where: { email } });
        if (!user) throw new BadRequestException('Invalid email');

        const token = await this.token.findFirst({
            where: { userId: user.id, token: code, type: 'VERIFICATION', used: false },
            orderBy: { expiresAt: 'desc' },
        });

        if (!token || token.expiresAt < new Date()) throw new BadRequestException('Invalid or expired code');

        await this.user.update({ where: { id: user.id }, data: { isVerified: true } });
        await this.token.update({ where: { id: token.id }, data: { used: true } });

        return { message: 'Email verified successfully' };
    }

    async login(email: string, password: string) {
        const user = await this.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        if (!user.isVerified) throw new UnauthorizedException('Email not verified');

        if (!user.isActive) {
            throw new UnauthorizedException('This account is deactivated. Please contact support.');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, role: user.role };
        const token = this.jwtService.sign(payload, { expiresIn: '15m' });

        return { accessToken: token, user };
    }

    async forgotPassword(email: string) {
        const user = await this.user.findUnique({ where: { email } });
        if (!user) throw new BadRequestException('User not found');

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await this.token.create({
            data: {
                token: code,
                type: 'RECOVERY',
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
                userId: user.id,
            },
        });

        await this.mailer.sendForgotPasswordEmail(user.email, user.firstName, code);

        return { message: 'Recovery code sent to email' };
    }
    async resetPassword(email: string, code: string, newPassword: string) {
        const user = await this.user.findUnique({ where: { email } });
        if (!user) throw new BadRequestException('Invalid email');

        const token = await this.token.findFirst({
            where: { userId: user.id, token: code, type: 'RECOVERY', used: false },
            orderBy: { expiresAt: 'desc' },
        });

        if (!token || token.expiresAt < new Date())
            throw new BadRequestException('Invalid or expired code');

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await this.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        await this.token.update({
            where: { id: token.id },
            data: { used: true },
        });

        return { message: 'Password has been reset successfully' };
    }

    async logout() {
        return { message: 'Logged out successfully' };
    }
    async getLatestCodeForTesting(email: string, type: 'VERIFICATION' | 'RECOVERY'): Promise<string | null> {

        const user = await this.user.findUnique({ where: { email } });
        if (!user) {
            return null;
        }

        const token = await this.token.findFirst({
            where: {
                userId: user.id,
                type: type,
                used: false,
            },
            orderBy: {
                expiresAt: 'desc'
            },
        });

        if (token && token.expiresAt > new Date()) {
            return token.token;
        }

        return null;
    }
}


