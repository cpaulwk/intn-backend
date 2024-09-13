import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async getUpvotedIdeas(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    return user?.upvotedIdeas.map(id => id.toString()) || [];
  }

  async toggleUpvote(userId: string, ideaId: string) {
    const objectIdIdeaId = new Types.ObjectId(ideaId);
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }
  
    const ideaIndex = user.upvotedIdeas.findIndex(id => id.equals(objectIdIdeaId));
    if (ideaIndex === -1) {
      user.upvotedIdeas.push(objectIdIdeaId);
    } else {
      user.upvotedIdeas.splice(ideaIndex, 1);
    }
  
    await user.save();
    return user;
  }

  async removeUpvote(userId: string, ideaId: string) {
    const user = await this.userModel.findById(userId);
    const objectIdIdeaId = new Types.ObjectId(ideaId);
    if (user) {
      user.upvotedIdeas = user.upvotedIdeas.filter(id => !id.equals(objectIdIdeaId));
      await user.save();
    }
    return user;
  }
  
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

  async addViewedIdea(userId: string, ideaId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { viewedIdeas: new Types.ObjectId(ideaId) },
      },
      { new: true }
    );
  }

  async getViewedIdeas(userId: string): Promise<Types.ObjectId[]> {
    const user = await this.userModel.findById(userId).exec();
    return user.viewedIdeas.slice(0, 5);
  }
}