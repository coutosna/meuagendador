import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class RegisterDto {
  @IsString()
  companyName: string

  @IsString()
  companySlug: string

  @IsString()
  userName: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string
}

export class ResetPasswordDto {
  @IsString()
  token: string

  @IsString()
  @MinLength(8)
  password: string
}
