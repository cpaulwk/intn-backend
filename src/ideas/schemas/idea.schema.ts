import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Idea extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: Date.now })
  submissionDate: Date;

  @Prop({ default: 0 })
  upvotes: number;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);