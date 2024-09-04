import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateIdeaDto {
  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsDateString()
  @IsOptional()
  readonly submissionDate?: Date;
}