import { Controller, Get, UseGuards, Req, Res, Post, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { CustomGoogleGuard } from './custom-google.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
@UseGuards(ThrottlerGuard)
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    if (req.query.error === 'access_denied') {
      return res.redirect(`${process.env.FRONTEND_URL}`);
    }

    const { accessToken} = await this.authService.googleLogin(req.user);
    
    res.cookie('auth_token', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

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
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeRefreshTokens(req.user.id);
    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(refreshToken);

      res.cookie('auth_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return { message: 'Tokens refreshed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Clear both tokens if refresh token is invalid or expired
        res.clearCookie('auth_token');
        res.clearCookie('refresh_token');
      }
      throw error;
    }
  }
}