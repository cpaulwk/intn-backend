import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea } from './schemas/idea.schema';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OpenAIService } from '../openai/openai.service';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<Idea>,
    private eventEmitter: EventEmitter2,
    private openAIService: OpenAIService
  ) {}

  async create(createIdeaDto: CreateIdeaDto): Promise<Idea> {
    const createdIdea = new this.ideaModel(createIdeaDto);
    const savedIdea = await createdIdea.save();
    this.eventEmitter.emit('idea.created', savedIdea);
    return savedIdea;
  }

  async findAll(): Promise<Idea[]> {
    return this.ideaModel.find().exec();
  }

  async upvote(id: string): Promise<Idea> {
    const updatedIdea = await this.ideaModel.findByIdAndUpdate(
      id,
      { $inc: { upvotes: 1 } },
      { new: true }
    ).exec();

    if (!updatedIdea) {
      throw new NotFoundException(`Idea with ID "${id}" not found`);
    }

    this.eventEmitter.emit('idea.upvoted', updatedIdea);
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

  async createIdea(createIdeaDto: CreateIdeaDto): Promise<Idea> {
    console.log("createIdeaDto", createIdeaDto);
    const enhancedDescription = await this.openAIService.enhanceIdea(createIdeaDto.title);
    console.log("enhancedDescription", enhancedDescription);
    const newIdea = await this.create({
      ...createIdeaDto,
      title: enhancedDescription.title,
      description: enhancedDescription.description
    });

    this.eventEmitter.emit('idea.created', newIdea);
    return newIdea;
  }
}