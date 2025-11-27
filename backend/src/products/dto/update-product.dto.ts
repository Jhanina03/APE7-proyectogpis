import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true, message: 'Cada ID de imagen debe ser un número entero' })
  @Min(1, { each: true, message: 'Cada ID de imagen debe ser mayor a 0' })
  imagesToRemove?: number[];
}
