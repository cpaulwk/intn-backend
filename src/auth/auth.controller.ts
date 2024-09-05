import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth/google')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
  	return;
   }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    console.log("req.user: ", req.user);
    const { access_token } = await this.authService.googleLogin(req.user);
    
    // Set the token as an HTTP-only cookie
    res.cookie('auth_token', access_token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    // Redirect to the root URL
    res.redirect(`${process.env.FRONTEND_URL}`);
  }
}