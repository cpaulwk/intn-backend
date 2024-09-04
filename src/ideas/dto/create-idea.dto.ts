import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateIdeaDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  readonly description: string = ''; // Default to empty string

  @IsString()
  @IsNotEmpty()
  readonly username: string;

  @IsDateString()
  @IsOptional()
  readonly submissionDate?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  readonly upvotes?: number;
}