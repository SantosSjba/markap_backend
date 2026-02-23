import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../../common/guards/ws-jwt.guard';

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
}

const socketIdsByUserId = new Map<string, Set<string>>();
const userIdBySocketId = new Map<string, string>();

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },
})
@UseGuards(WsJwtGuard)
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: { id: string; user?: { sub: string } }) {
    const userId = (client as unknown as { user: { sub: string } }).user?.sub;
    if (userId) {
      let set = socketIdsByUserId.get(userId);
      if (!set) {
        set = new Set();
        socketIdsByUserId.set(userId, set);
      }
      set.add(client.id);
      userIdBySocketId.set(client.id, userId);
    }
  }

  handleDisconnect(client: { id: string }) {
    const userId = userIdBySocketId.get(client.id);
    userIdBySocketId.delete(client.id);
    if (userId) {
      const set = socketIdsByUserId.get(userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) socketIdsByUserId.delete(userId);
      }
    }
  }

  emitToUser(userId: string, payload: NotificationPayload): void {
    const ids = socketIdsByUserId.get(userId);
    if (!ids?.size) return;
    this.server.to(Array.from(ids)).emit('notification', payload);
  }
}
