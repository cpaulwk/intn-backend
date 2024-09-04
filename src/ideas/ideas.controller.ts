import { Controller, Get, Post, Body } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { Idea } from './schemas/idea.schema';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  create(@Body() createIdeaDto: CreateIdeaDto): Promise<Idea> {
    return this.ideasService.create(createIdeaDto);
  }

  @Get()
  findAll(): Promise<Idea[]> {
    return this.ideasService.findAll();
  }
}