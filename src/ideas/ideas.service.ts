import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async create(createIdeaDto: CreateIdeaDto): Promise<Idea> {
    const createdIdea = new this.ideaModel(createIdeaDto);
    const savedIdea = await createdIdea.save();
    this.eventEmitter.emit('idea.created', savedIdea);
    return savedIdea;
  }

  async createIdea(createIdeaDto: CreateIdeaDto): Promise<Idea> {
    try {
      const { title, description } = await this.openAIService.enhanceIdea(createIdeaDto.title);
      const newIdea = await this.create({
        ...createIdeaDto,
        title,
        description,
        submissionDate: new Date(),
        upvotes: 0
      });
      return newIdea;
    } catch (error) {
      console.error('Error creating idea:', error);
      throw new Error('Failed to create enhanced idea');
    }
  }

  async findAll(): Promise<Idea[]> {
    return this.ideaModel.find().exec();
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

}