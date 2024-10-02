import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);