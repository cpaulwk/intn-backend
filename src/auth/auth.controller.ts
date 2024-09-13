import { Controller, Get, UseGuards, Req, Res, Post, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { CustomGoogleGuard } from './custom-google.guard';
@Injectable()
@Controller('auth/google')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    return;
  }

  @Get('redirect')
  @UseGuards(CustomGoogleGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    if (req.query.error === 'access_denied') {
      // Handle access denied error
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }

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

  @Get('check')
  async checkAuthStatus(@Req() req) {
    if (req.cookies['auth_token']) {
      try {
        const decoded = this.jwtService.verify(req.cookies['auth_token']);
        const user = await this.userModel.findById(decoded.sub).select('-password');
        return { isAuthenticated: true, user };
      } catch (error) {
        return { isAuthenticated: false, user: null };
      }
    }
    return { isAuthenticated: false, user: null };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('auth_token');
    return { message: 'Logged out successfully' };
  }
}