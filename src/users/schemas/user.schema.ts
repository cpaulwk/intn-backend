import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Idea' }], default: [] })
  viewedIdeas: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Idea' }] })
  upvotedIdeas: Types.ObjectId[];

  @Prop({ type: [Date], default: [] })
  ideaSubmissions: Date[];
}

export const UserSchema = SchemaFactory.createForClass(User);