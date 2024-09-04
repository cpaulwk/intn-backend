import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IdeasService } from './ideas.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class IdeasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly ideasService: IdeasService) {}

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('idea.created')
  handleIdeaCreated(payload: any) {
    this.server.emit('newIdea', payload);
  }

  @OnEvent('idea.upvoted')
  handleIdeaUpvoted(payload: any) {
    this.server.emit('ideaUpvoted', payload);
  }

  @OnEvent('idea.deleted')
  handleIdeaDeleted(id: string) {
    this.server.emit('ideaDeleted', id);
  }
}