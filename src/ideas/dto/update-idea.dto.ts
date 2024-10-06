import { IsOptional, IsString } from 'class-validator';

export class UpdateIdeaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
