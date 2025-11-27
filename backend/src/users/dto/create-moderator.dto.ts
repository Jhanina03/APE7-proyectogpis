import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateModeratorDTO {
  @IsNotEmpty() firstName: string;
  @IsNotEmpty() lastName: string;
  @IsEmail() email: string;
  // @IsNotEmpty() password: string;
  @IsNotEmpty() nationalId: string;
  phone?: string;
  address?: string;
  gender?: string;
  role: 'MODERATOR';
}
