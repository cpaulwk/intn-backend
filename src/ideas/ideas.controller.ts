import { Controller, Get, Post, Body, Put, Param, NotFoundException } from '@nestjs/common';
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

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Idea> {
    const idea = await this.ideasService.findOne(id);
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    return idea;
  }

  @Put(':id/upvote')
  async upvote(@Param('id') id: string): Promise<Idea> {
    try {
      return await this.ideasService.upvote(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}