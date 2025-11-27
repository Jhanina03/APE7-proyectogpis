import { Controller, Get, Post, Patch, Body, Param, UseGuards,Request  } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ChangeIncidentStatusDto } from './dto/change-incident-status.dto';
import { IncidentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) { }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Get('incidents/:status')
  findByStatus(@Param('status') status: IncidentStatus) {
    return this.moderationService.findByStatus(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'CLIENT', 'ADMIN')
  @Post('report')
  createReport(@Body() dto: CreateReportDto) {
    return this.moderationService.createReport(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Patch('incident/:id/status')
  changeIncidentStatus(@Param('id') id: string, @Body() dto: ChangeIncidentStatusDto) {
    return this.moderationService.changeIncidentStatus(+id, dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Patch('incident/:id/assign/:moderatorId')
  assignModerator(@Param('id') id: string, @Param('moderatorId') moderatorId: string) {
    return this.moderationService.assignModerator(+id, moderatorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'CLIENT', 'ADMIN')
  @Patch('incident/:id/appeal')
  manageAppeal(@Param('id') id: string, @Body('reason') reason: string) {
    return this.moderationService.manageAppeal(+id, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Get('detect-dangerous')
  detectDangerousProducts() {
    return this.moderationService.detectDangerousProducts();
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Get('incidents')
  findAll() {
    return this.moderationService.findAllIncidents();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MODERATOR', 'ADMIN')
  @Patch('incident/:id/resolve')
  resolveIncident(
    @Param('id') id: string,
    @Body('finalStatus') finalStatus: IncidentStatus,
    @Request() req
  ) {
  const moderatorId = req.user.id; 
    return this.moderationService.resolveIncident(+id, finalStatus, moderatorId);
  }
// SOLO PARA TEST
@Get('detect-dangerous/:productId/test')
async detectDangerousProductByIdForTest(@Param('productId') productId: string) {
  const result = await this.moderationService.detectDangerousProductById(+productId);
  return { isDangerous: result }; // envolver en objeto
}
}
