import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Idea } from '../ideas/schemas/idea.schema';
import { User } from '../users/schemas/user.schema';
import { Types } from 'mongoose';

export const toggleUpvote = async (
  ideaModel: Model<Idea>,
  userModel: Model<User>,
  ideaId: string,
  userId: string
): Promise<Idea> => {
  const idea = await ideaModel.findById(ideaId).exec();
  if (!idea) {
    throw new NotFoundException(`Idea with ID "${ideaId}" not found`);
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundException(`User with ID "${userId}" not found`);
  }

  const isUpvoted = user.upvotedIdeas.includes(new Types.ObjectId(ideaId));
  
  if (isUpvoted) {
    idea.upvotes--;
    user.upvotedIdeas = user.upvotedIdeas.filter(id => !id.equals(new Types.ObjectId(ideaId)));
  } else {
    idea.upvotes++;
    user.upvotedIdeas.push(new Types.ObjectId(ideaId));
  }

  await Promise.all([idea.save(), user.save()]);

  return idea;
};