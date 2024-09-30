import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';

@Schema()
export class Idea {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 0 })
  upvotes: number;

  @Prop({ required: false })
  username?: string;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);