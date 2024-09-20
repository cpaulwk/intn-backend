import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async googleLogin(user: any) {
    if (!user || !user.email) {
      throw new Error('Invalid user data from Google');
    }

    let dbUser = await this.userModel.findOne({ email: user.email });

    if (!dbUser) {
      const newUser = {
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        refreshTokens: [],
      };
      dbUser = new this.userModel(newUser);
      await dbUser.save();
    }
    
    return this.generateTokens(dbUser);
  }

  async generateTokens(user: User) {
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Hash the refresh token before storing it
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Add the new refresh token to the user's list
    user.refreshTokens.push({
      token: hashedRefreshToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Remove expired tokens
    user.refreshTokens = user.refreshTokens.filter(token => token.expires > new Date());

    await user.save();

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.userModel.findById(decoded.sub);
      
      if (!user) throw new UnauthorizedException('User not found');

      // Find the refresh token in the user's list
      const tokenIndex = user.refreshTokens.findIndex(token => 
        bcrypt.compareSync(refreshToken, token.token)
      );

      if (tokenIndex === -1) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const payload = { email: user.email, sub: user._id };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshTokens(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    user.refreshTokens = [];
    await user.save();
  }

  async upvoteIdea(userId: string, ideaId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { upvotedIdeas: ideaId } },
      { new: true }
    );
  }

  async removeUpvote(userId: string, ideaId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { upvotedIdeas: ideaId } },
      { new: true }
    );
  }
}