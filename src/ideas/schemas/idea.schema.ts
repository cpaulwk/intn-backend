import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Idea extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: Date.now })
  submissionDate: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);