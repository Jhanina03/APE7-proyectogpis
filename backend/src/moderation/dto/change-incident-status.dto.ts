import { IsEnum } from 'class-validator';
import { IncidentStatus } from '@prisma/client';

export class ChangeIncidentStatusDto {
  @IsEnum(IncidentStatus, { message: `Invalid status. Only: ${Object.values(IncidentStatus).join(', ')}` })
  status: IncidentStatus;
}

