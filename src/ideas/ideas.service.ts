import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Idea } from './schemas/idea.schema';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService } from '../openai/openai.service';
import { User } from '../users/schemas/user.schema';
import { IdeasGateway } from './ideas.gateway';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<Idea>,
    private eventEmitter: EventEmitter2,
    private openAIService: OpenAIService,
    @InjectModel(User.name) private userModel: Model<User>,
    private ideasGateway: IdeasGateway
  ) {}

  async create(createIdeaDto: CreateIdeaDto, userId?: string): Promise<Idea> {
    let enhancedIdea = createIdeaDto;

    if (!createIdeaDto.description && userId) {
      const { title, description } = await this.openAIService.enhanceIdea(createIdeaDto.title, userId);
      enhancedIdea = { ...createIdeaDto, title, description };
    }

    const createdIdea = new this.ideaModel({
      ...enhancedIdea,
      submissionDate: new Date(),
      upvotes: 1,
      createdAt: new Date(),
    });

    const savedIdea = await createdIdea.save();

    if (userId) {
      await this.userModel.findByIdAndUpdate(userId, {
        $addToSet: { upvotedIdeas: savedIdea._id }
      });
    }

    return savedIdea;
  }

  async findAll(): Promise<Idea[]> {
    return this.ideaModel.find().sort({ upvotes: -1 }).exec();
  }

  async findAllAuthenticated(userId: string): Promise<Idea[]> {
    const ideas = await this.ideaModel.find().exec();
    const user = await this.userModel.findById(userId);
    
    return ideas.map(idea => ({
      ...idea.toObject(),
      isUpvoted: user.upvotedIdeas.includes(idea._id)
    }));
  }

  async toggleUpvote(ideaId: string, userId: string): Promise<{ idea: Idea; isUpvoted: boolean }> {
    const idea = await this.ideaModel.findById(ideaId);
    if (!idea) {
      throw new NotFoundException(`Idea with ID "${ideaId}" not found`);
    }

    const user = await this.userModel.findById(userId);
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

    // Ensure the username is set if it's missing
    if (!idea.username) {
      idea.username = user.email || '';
    }

    await Promise.all([idea.save(), user.save()]);

    return { idea, isUpvoted: !isUpvoted };
  }

  async findOne(id: string): Promise<Idea | null> {
    return this.ideaModel.findById(id).exec();
  }

  async remove(id: string): Promise<Idea> {
    const deletedIdea = await this.ideaModel.findByIdAndDelete(id).exec();
    if (!deletedIdea) {
      throw new NotFoundException(`Idea with ID "${id}" not found`);
    }
    return deletedIdea;
  }

  async addViewedIdea(userId: string, ideaId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { viewedIdeas: ideaId },
      },
      { new: true }
    );
  }

  async getViewedIdeas(userId: string): Promise<Idea[]> {
    const user = await this.userModel.findById(userId).exec();
    return this.ideaModel.find({ _id: { $in: user.viewedIdeas } }).limit(50).exec();
  }

  async getAllDataUnauthenticated(): Promise<{ ideas: Idea[]}> {
    const ideas = await this.findAll();

    return {
      ideas,
    };
  }

  async getAllDataAuthenticated(userId: string): Promise<{ ideas: Idea[], recentlyViewed: Idea[], submittedIdeas: Idea[], upvotedIdeas: Idea[] }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [ideas, recentlyViewed, submittedIdeas, upvotedIdeas] = await Promise.all([
      this.findAllAuthenticated(userId),
      this.getViewedIdeas(userId),
      this.ideaModel.find({ username: user.email }).sort({ createdAt: -1 }).exec(),
      this.ideaModel.find({ _id: { $in: user.upvotedIdeas } }).sort({ createdAt: -1 }).exec()
    ]);

    return {
      ideas,
      recentlyViewed,
      submittedIdeas: submittedIdeas.map(idea => ({
        ...idea.toObject(),
        isUpvoted: user.upvotedIdeas.includes(idea._id)
      })),
      upvotedIdeas: upvotedIdeas.map(idea => ({
        ...idea.toObject(),
        isUpvoted: true
      }))
    };
  }

  async removeRecentlyViewed(userId: string, ideaId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $pull: { viewedIdeas: ideaId },
      },
      { new: true }
    );
  }

  async deleteIdea(ideaId: string, userId: string): Promise<void> {
    const idea = await this.ideaModel.findById(ideaId);
    if (!idea) {
      throw new NotFoundException(`Idea with ID "${ideaId}" not found`);
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    if (idea.username !== user.email) {
      throw new ForbiddenException('You are not authorized to delete this idea');
    }

    await this.ideaModel.findByIdAndDelete(ideaId);

    // Remove the idea from user's upvotedIdeas if it exists
    user.upvotedIdeas = user.upvotedIdeas.filter(id => !id.equals(new Types.ObjectId(ideaId)));
    await user.save();
  }
}