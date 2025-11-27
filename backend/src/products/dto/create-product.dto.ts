import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ProductType, Category } from '@prisma/client'; // si usas enums de Prisma

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  @Max(1000000, { message: 'El precio no debe superar el 1,000,000' })
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Cada imagen debe ser un string (URL)' })
  images?: string[];

  @IsOptional()
  @IsEnum(ProductType, { message: 'Tipo inválido' })
  type?: ProductType; // default PRODUCT

  @IsOptional()
  @IsEnum(Category, { message: 'Categoría inválida' })
  category?: Category; // default OTHER

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  addressType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  serviceHours?: string; // solo para servicios

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return Boolean(value);
  })
  availability?: boolean;
}
