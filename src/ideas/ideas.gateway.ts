import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class IdeasGateway {
  @WebSocketServer()
  server: Server;

  handleUpvoteUpdate(ideaId: string, newUpvoteCount: number) {
    this.server.emit('upvoteUpdate', { ideaId, upvotes: newUpvoteCount });
  }
}