import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  findByName(@Query('name') name: string) {
    return this.usersService.findByName(name);
  }

  @Post('search')
  searchByName(@Body('name') name: string) {
    return this.usersService.findByName(name);
  }
}
