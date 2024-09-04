import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { IdeasGateway } from './ideas.gateway';
import { Idea, IdeaSchema } from './schemas/idea.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Idea.name, schema: IdeaSchema }])],
  controllers: [IdeasController],
  providers: [IdeasService, IdeasGateway],
})
export class IdeasModule {}