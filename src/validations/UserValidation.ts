import { IsEmail, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class User {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

export class UserID {
  @IsNotEmpty()
  @IsInt()
  userId!: number;
}
