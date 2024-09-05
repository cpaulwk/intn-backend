import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  googleId: string;

  @Prop({ type: [String], default: [] })
  upvotedIdeas: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);