import { IsEnum } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class ChangeStatusDto {
  @IsEnum(ProductStatus, { message: `El status solo puede ser: ${Object.values(ProductStatus).join(', ')}` })
  status: ProductStatus;
}
