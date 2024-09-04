import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IdeasService } from './ideas.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class IdeasGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly ideasService: IdeasService) {}

  @SubscribeMessage('upvoteIdea')
  async handleUpvote(@MessageBody() id: string) {
    const updatedIdea = await this.ideasService.upvote(id);
    this.server.emit('ideaUpvoted', updatedIdea);
  }
}