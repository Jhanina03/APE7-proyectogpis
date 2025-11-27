import { IsNotEmpty, IsEnum, IsString, IsOptional } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateReportDto {
  @IsNotEmpty()
  productId: number;

  @IsEnum(ReportType, { message: `Report type can only be: ${Object.values(ReportType).join(', ')}` })
  type: ReportType;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsNotEmpty()
  reporterId: string;
}
