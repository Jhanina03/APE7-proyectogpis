import { Controller, Get, Patch, Param, Body, UseGuards, Query, Post, Req, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateModeratorDTO } from "./dto/create-moderator.dto"

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERATOR')
    @Post('moderators')
    async createModerator(@Body() data: CreateModeratorDTO) {
        return this.usersService.createModerator(data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERATOR')
    @Get()
    async findAll(
        @Query('role') role?: Role,
        @Query('isActive') isActive?: string
    ) {
        const filters: any = {};
        if (role) filters.role = role;
        if (isActive) filters.isActive = isActive === 'true';
        return this.usersService.findAll(filters);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'MODERATOR')
    @Patch(':id/status')
    async setActiveStatus(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean
    ) {
        return this.usersService.setActiveStatus(id, isActive);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id/role')
    async setRole(
        @Param('id') id: string,
        @Body('role') role: Role
    ) {
        return this.usersService.setRole(id, role);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() data: Partial<Prisma.UserUpdateInput>
    ) {
        return this.usersService.updateUser(id, data);
    }
}