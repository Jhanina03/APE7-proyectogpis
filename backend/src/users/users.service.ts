import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma, PrismaClient, Role } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';

import * as bcrypt from 'bcrypt';
import { NominatimService } from '../nominatim/nominatim.service';

@Injectable()
export class UsersService extends PrismaClient {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private mailer: MailerService,
    private nominatim: NominatimService,
  ) {
    super();
  }

  async createModerator(data: any) {
    const existing = await this.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email already in use');

    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Use provided coordinates or fallback to geocoding
    let latitude: number | null = data.latitude || null;
    let longitude: number | null = data.longitude || null;
    let geocodedAddress: string | null = null;

    if (latitude && longitude) {
      // Coordinates provided from frontend - use directly!
      geocodedAddress = data.address || null;
      this.logger.debug(`Using provided coordinates for moderator (lat: ${latitude}, lng: ${longitude})`);
    } else if (data.address) {
      // Fallback: geocode if coordinates not provided
      try {
        const geocoded = await this.nominatim.geocodeAddress(data.address);
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
        geocodedAddress = geocoded.address;
        this.logger.debug(`Moderator location geocoded (fallback): ${geocodedAddress}`);
      } catch (error) {
          this.logger.warn(`Failed to geocode moderator address: ${error.message}`);
          // Continue without location - it's optional for moderators
          geocodedAddress = data.address;
      }
    }

    const user = await this.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        nationalId: data.nationalId,
        phone: data.phone,
        address: geocodedAddress || data.address,
        gender: data.gender,
        passwordHash,
        latitude,
        longitude,
        role: 'MODERATOR',
        isVerified: true,
        isActive: true,
      },
    });

    // Update PostGIS location if coordinates available
    if (latitude && longitude) {
      try {
        await this.$executeRaw`
          UPDATE "User"
          SET location = ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )
          WHERE id = ${user.id}
        `;
        this.logger.debug(`PostGIS location set for moderator ${user.id}`);
      } catch (error) {
        this.logger.warn(`Failed to set PostGIS location for moderator: ${error.message}`);
      }
    }

    // Send welcome email with temporary password
    await this.mailer.sendWelcomeEmail({
      to: user.email,
      name: user.firstName,
      email: user.email,
      password: tempPassword,
    });

    return user;
  }

  // Obtener todos los usuarios, opcionalmente filtrar por rol o activo
  async findAll(filters?: { role?: Role; isActive?: boolean }) {
    return this.user.findMany({
      where: {
        role: filters?.role,
        isActive: filters?.isActive,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        nationalId: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        gender: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Obtener un usuario por ID
  async findOne(id: string) {
    const user = await this.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        nationalId: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        gender: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setActiveStatus(id: string, isActive: boolean) {
    const user = await this.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.user.update({
      where: { id },
      data: { isActive },
    });

    if (!isActive) {
      await this.product.updateMany({
        where: {
          userId: id,
          status: 'ACTIVE',
        },
        data: { status: 'DEACTIVATED' },
      });

      await this.mailer.sendAccountStatusEmail(
        user.email,
        user.firstName,
        'Deactivated',
        'Your account was disabled by an administrator.'
      );
    } else {
      // When reactivating account: only restore DEACTIVATED products back to ACTIVE
      await this.product.updateMany(
        {
          where: {
            userId: id,
            status: 'DEACTIVATED',
          },
          data: { status: 'ACTIVE' },
        }
      );

      await this.mailer.sendAccountStatusEmail(user.email, user.firstName, 'Active');
    }

    return updatedUser;
  }

  // Asignar rol a un usuario
  async setRole(id: string, role: Role) {
    const user = await this.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // No permitir asignar ADMIN arbitrariamente desde aquí, solo MODERATOR
    if (role === 'ADMIN') throw new BadRequestException('Cannot assign ADMIN role here');

    return this.user.update({
      where: { id },
      data: { role },
    });
  }

  // Actualizar información básica de usuario
  async updateUser(id: string, data: Partial<Prisma.UserUpdateInput>) {
    const user = await this.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Use provided coordinates or fallback to geocoding
    let updateData = { ...data };
    let latitude: number | null = null;
    let longitude: number | null = null;

    // Check if coordinates were provided (as raw data, need type casting)
    const dataWithCoords = data as any;
    if (dataWithCoords.latitude && dataWithCoords.longitude) {
      // Coordinates provided from frontend - use directly!
      latitude = dataWithCoords.latitude;
      longitude = dataWithCoords.longitude;
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      if (data.address) updateData.address = data.address;
      this.logger.debug(`Using provided coordinates for user update (lat: ${latitude}, lng: ${longitude})`);
    } else if (data.address && typeof data.address === 'string' && data.address !== user.address) {
      // Fallback: geocode if address changed but no coordinates provided
      try {
        const geocoded = await this.nominatim.geocodeAddress(data.address as string);
        updateData.address = geocoded.address;
        updateData.latitude = geocoded.latitude;
        updateData.longitude = geocoded.longitude;
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
        this.logger.debug(`User address geocoded (fallback): ${geocoded.address}`);
      } catch (error) {
        this.logger.warn(`Failed to geocode user address: ${error.message}`);
        // Continue with update without geocoding
      }
    }

    // Update the user first
    const updatedUser = await this.user.update({
      where: { id },
      data: updateData,
    });

    // Update PostGIS location if coordinates are available
    if (latitude && longitude) {
      try {
        await this.$executeRaw`
          UPDATE "User"
          SET location = ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )
          WHERE id = ${id}
        `;
        this.logger.debug(`PostGIS location updated for user ${id}`);
      } catch (error) {
        this.logger.warn(`Failed to update PostGIS location for user: ${error.message}`);
      }
    }

    return updatedUser;
  }

  async deleteByEmail(email: string) {
    return this.user.deleteMany({
      where: { email },
    });
  }

}