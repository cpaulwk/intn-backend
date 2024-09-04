import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea } from './schemas/idea.schema';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<Idea>,
    private eventEmitter: EventEmitter2
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
}