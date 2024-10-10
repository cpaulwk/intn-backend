import {
  Controller,
  Get,
  Injectable,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { Model } from 'mongoose';

import { AuthService } from './auth.service';
import { CustomGoogleGuard } from './custom-google.guard';
import { User } from '../users/schemas/user.schema';

@Injectable()
@UseGuards(ThrottlerGuard)
@Controller('auth/google')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    return;
  }

  @Get('redirect')
  @UseGuards(CustomGoogleGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      if (req.query.error === 'access_denied') {
        console.log('Access denied');
        return res.redirect(`${process.env.FRONTEND_URL}`);
      }
      console.log('Access granted');
      const { accessToken, refreshToken } = await this.authService.googleLogin(
        req.user,
      );

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to the frontend without including sensitive data in the URL
      res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
    } catch (error) {
      console.error('Error during Google authentication redirect:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  @Get('check')
  async checkAuthStatus(@Req() req) {
    if (req.cookies['access_token']) {
      try {
        const decoded = this.jwtService.verify(req.cookies['access_token']);
        const user = await this.userModel
          .findById(decoded.sub)
          .select('-password');
        return { isAuthenticated: true, user };
      } catch {
        return { isAuthenticated: false, user: null };
      }
    }
    return { isAuthenticated: false, user: null };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    await this.authService.revokeRefreshTokens(req.user.id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const access_token = req.cookies?.access_token;
    const refresh_token = req.cookies?.refresh_token;
    if (!access_token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      const { accessToken } =
        await this.authService.refreshToken(refresh_token);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      return { message: 'Tokens refreshed successfully' };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Clear both tokens if refresh token is invalid or expired
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }
      throw error;
    }
  }
}
