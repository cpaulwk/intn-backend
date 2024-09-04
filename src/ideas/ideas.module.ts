import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { IdeasGateway } from './ideas.gateway';
import { Idea, IdeaSchema } from './schemas/idea.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Idea.name, schema: IdeaSchema }]),
    EventEmitterModule.forRoot()
  ],
  controllers: [IdeasController],
  providers: [IdeasService, IdeasGateway],
})
export class IdeasModule {}