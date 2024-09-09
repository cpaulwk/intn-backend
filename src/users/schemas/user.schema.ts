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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Idea' }] })
  upvotedIdeas: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);