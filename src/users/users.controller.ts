import { Controller, Get, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('upvoted-ideas')
  @UseGuards(AuthGuard('jwt'))
  async getUpvotedIdeas(@Req() req) {
    const userId = req.user.id;
    return this.usersService.getUpvotedIdeas(userId);
  }

  @Post('toggle-upvote')
  @UseGuards(AuthGuard('jwt'))
  async toggleUpvote(@Req() req, @Body('ideaId') ideaId: string) {
    const userId = req.user.id;
    const updatedUser = await this.usersService.toggleUpvote(userId, ideaId);
    return { upvotedIdeas: updatedUser.upvotedIdeas };
  }
}