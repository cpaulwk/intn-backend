import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('upvote-idea')
  @UseGuards(AuthGuard('jwt'))
  async upvoteIdea(@Req() req, @Body('ideaId') ideaId: string) {
    const userId = req.user.id;
    return this.usersService.upvoteIdea(userId, ideaId);
  }

  // You can add more user-related endpoints here
}