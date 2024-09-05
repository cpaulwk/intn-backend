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
    if (!user|| !user.email) {
      throw new Error('Invalid user data from Google');
    }

    let dbUser = await this.userModel.findOne({ email: user.email });

    if (!dbUser) {
      // Create a new user if not found
      const newUser = {
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        // other fields as needed
      };
      dbUser = new this.userModel(newUser);
      await dbUser.save();
    }

    const payload = { email: dbUser.email, sub: dbUser._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
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