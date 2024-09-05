import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async upvoteIdea(userId: string, ideaId: string) {
    const user = await this.userModel.findById(userId);
    const objectIdIdeaId = new Types.ObjectId(ideaId);
    // if (user && !user.upvotedIdeas.includes(objectIdIdeaId)) {
    //   user.upvotedIdeas.push(objectIdIdeaId);
    //   await user.save();
    // }
    return user;
  }

  // You can add more user-related methods here, such as:
  
  async findUserById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId).exec();
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }
}