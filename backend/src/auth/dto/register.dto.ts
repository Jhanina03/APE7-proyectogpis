import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsNotEmpty() firstName: string;
  @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  @IsNotEmpty() password: string;
  @IsNotEmpty() nationalId: string;
  phone?: string;
  @IsString() address?: string;
  gender?: string;
  role?: 'CLIENT';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}
