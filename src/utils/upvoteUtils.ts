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
  const updateOperation = isUpvoted
    ? { $inc: { upvotes: -1 }, $pull: { upvotedBy: userId } }
    : { $inc: { upvotes: 1 }, $addToSet: { upvotedBy: userId } };

  const updatedIdea = await ideaModel.findByIdAndUpdate(
    ideaId,
    updateOperation,
    { new: true }
  ).exec();

  if (isUpvoted) {
    user.upvotedIdeas = user.upvotedIdeas.filter(id => id.toString() !== ideaId);
  } else {
    user.upvotedIdeas.push(new Types.ObjectId(ideaId));
  }
  await user.save();

  return updatedIdea;
};