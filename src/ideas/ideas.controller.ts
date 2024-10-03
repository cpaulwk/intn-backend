import { Controller, Get, Post, Body, Put, Param, NotFoundException, Delete, UseGuards, Req } from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { Idea } from './schemas/idea.schema';
import { AuthGuard } from '@nestjs/passport';
import { UpdateIdeaDto } from './dto/update-idea.dto';
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

  @Get('authenticated')
  @UseGuards(AuthGuard('jwt'))
  async findAllAuthenticated(@Req() req): Promise<Idea[]> {
    const userId = req.user.id;
    return this.ideasService.findAllAuthenticated(userId);
  }

  @Get('viewed')
  @UseGuards(AuthGuard('jwt'))
  async getViewedIdeas(@Req() req) {
    const userId = req.user.id;
    return this.ideasService.getViewedIdeas(userId);
  }

  @Post('viewed')
  @UseGuards(AuthGuard('jwt'))
  async addViewedIdea(@Req() req, @Body('ideaId') ideaId: string) {
    const userId = req.user.id;
    return this.ideasService.addViewedIdea(userId, ideaId);
  }

  @Get('all-data-authenticated')
  @UseGuards(AuthGuard('jwt'))
  async getAllDataAuthenticated(@Req() req): Promise<{ ideas: Idea[], recentlyViewed: Idea[], submittedIdeas: Idea[], upvotedIdeas: Idea[] }> {
    const userId = req.user.id;
    return this.ideasService.getAllDataAuthenticated(userId);
  }

  @Get('all-data-unauthenticated')
  async getAllDataUnauthenticated(): Promise<{ ideas: Idea[]}> {
    return this.ideasService.getAllDataUnauthenticated();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Idea> {
    const idea = await this.ideasService.findOne(id);
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    return idea;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() updateIdeaDto: UpdateIdeaDto, @Req() req): Promise<Idea> {
    const userId = req.user.id;
    return this.ideasService.update(id, updateIdeaDto, userId);
  }

  @Put(':id/toggle-upvote')
  @UseGuards(AuthGuard('jwt'))
  async toggleUpvote(@Param('id') id: string, @Req() req): Promise<{ idea: Idea; isUpvoted: boolean }> {
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
  @UseGuards(AuthGuard('jwt'))
  async deleteIdea(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.ideasService.deleteIdea(id, userId);
  }

  @Delete('recently-viewed/:id')
  @UseGuards(AuthGuard('jwt'))
  async removeRecentlyViewed(@Param('id') id: string, @Req() req): Promise<void> {
    const userId = req.user.id;
    return this.ideasService.removeRecentlyViewed(userId, id);
  }

  @Post('enhance-text')
  @UseGuards(AuthGuard('jwt'))
  async enhanceText(
    @Body('type') type: 'title' | 'description',
    @Body('title') title: string,
    @Body('description') description: string,
    @Req() req
  ): Promise<{ enhancedText: string }> {
    const userId = req.user.id;
    const enhancedText = await this.ideasService.enhanceText(type, title, description, userId);
    return { enhancedText };
  }
}