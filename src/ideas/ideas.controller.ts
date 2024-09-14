import { Controller, Get, Post, Body, Put, Param, NotFoundException, Delete, UseGuards, Req } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { Idea } from './schemas/idea.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createIdeaDto: CreateIdeaDto, @Req() req): Promise<Idea> {
    const userId = req.user.id;
    return this.ideasService.create(createIdeaDto, userId);
  }

  @Get()
  findAll(): Promise<Idea[]> {
    return this.ideasService.findAll();
  }

  @Get('viewed')
  @UseGuards(AuthGuard('jwt'))
  async getViewedIdeas(@Req() req) {
    const userId = req.user.id;
    return this.ideasService.getViewedIdeas(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Idea> {
    const idea = await this.ideasService.findOne(id);
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    return idea;
  }

  @Put(':id/toggle-upvote')
  @UseGuards(AuthGuard('jwt'))
  async toggleUpvote(@Param('id') id: string, @Req() req): Promise<Idea> {
    try {
      const userId = req.user.id;
      return await this.ideasService.toggleUpvote(id, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Idea> {
    try {
      return await this.ideasService.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post('viewed')
  @UseGuards(AuthGuard('jwt'))
  async addViewedIdea(@Req() req, @Body('ideaId') ideaId: string) {
    const userId = req.user.id;
    return this.ideasService.addViewedIdea(userId, ideaId);
  }
}