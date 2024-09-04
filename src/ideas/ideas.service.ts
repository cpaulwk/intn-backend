import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea } from './schemas/idea.schema';
import { CreateIdeaDto } from './dto/create-idea.dto';

@Injectable()
export class IdeasService {
  constructor(@InjectModel(Idea.name) private ideaModel: Model<Idea>) {}

  async create(createIdeaDto: CreateIdeaDto): Promise<Idea> {
    const createdIdea = new this.ideaModel({
      ...createIdeaDto,
      submissionDate: createIdeaDto.submissionDate || new Date(),
    });
    return createdIdea.save();
  }

  async findAll(): Promise<Idea[]> {
    return this.ideaModel.find().exec();
  }
}