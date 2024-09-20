import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';

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

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.userModel.findById(decoded.sub);
      
      if (!user) throw new Error('User not found');

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
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