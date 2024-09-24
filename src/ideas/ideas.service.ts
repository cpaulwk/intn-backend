import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Idea } from './schemas/idea.schema';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService } from '../openai/openai.service';
import { User } from '../users/schemas/user.schema';
import { toggleUpvote } from '../utils/upvoteUtils';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<Idea>,
    private eventEmitter: EventEmitter2,
    private openAIService: OpenAIService,
    @InjectModel(User.name) private userModel: Model<User>
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
      upvotes: enhancedIdea.upvotes || 1,
      upvotedBy: userId ? [userId] : []
    });

    const savedIdea = await createdIdea.save();

    if (userId) {
      await this.userModel.findByIdAndUpdate(userId, {
        $addToSet: { upvotedIdeas: savedIdea._id }
      });
    }

    this.eventEmitter.emit('idea.created', savedIdea);
    return savedIdea;
  }

  async findAll(): Promise<Idea[]> {
    return this.ideaModel.find().sort({ upvotes: -1 }).exec();
  }

  async toggleUpvote(id: string, userId: string): Promise<Idea> {
    const updatedIdea = await toggleUpvote(this.ideaModel, this.userModel, id, userId);
    this.eventEmitter.emit('idea.upvoteToggled', updatedIdea);
    return updatedIdea;
  }

  async findOne(id: string): Promise<Idea | null> {
    return this.ideaModel.findById(id).exec();
  }

  async remove(id: string): Promise<Idea> {
    const deletedIdea = await this.ideaModel.findByIdAndDelete(id).exec();
    if (!deletedIdea) {
      throw new NotFoundException(`Idea with ID "${id}" not found`);
    }
    this.eventEmitter.emit('idea.deleted', id);
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

}