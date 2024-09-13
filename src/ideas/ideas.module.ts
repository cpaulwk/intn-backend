import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { IdeasGateway } from './ideas.gateway';
import { Idea, IdeaSchema } from './schemas/idea.schema';
import { OpenAIService } from '../openai/openai.service';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Idea.name, schema: IdeaSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EventEmitterModule.forRoot()
  ],
  controllers: [IdeasController],
  providers: [IdeasService, IdeasGateway, OpenAIService],
})
export class IdeasModule {}