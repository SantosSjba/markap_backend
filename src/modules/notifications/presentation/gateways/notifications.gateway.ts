import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TokenService } from '../../../../shared/domain/services/token.service';
import { UserRepository } from '../../../identity/domain/repositories/user.repository';
import type { NotificationPayload } from '../../application/ports/notification-delivery.port';

const socketIdsByUserId = new Map<string, Set<string>>();
const userIdBySocketId = new Map<string, string>();

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (process.env.FRONTEND_URL || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async handleConnection(client: {
    id: string;
    disconnect: () => void;
    emit: (event: string) => void;
    handshake: { auth?: { token?: string }; query?: { token?: string } };
  }) {
    const token =
      client.handshake?.auth?.token ||
      (typeof client.handshake?.query?.token === 'string'
        ? client.handshake.query.token
        : undefined);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = this.tokenService.verifyToken(token);
      const user = await this.userRepository.findById(payload.sub);
      if (!user?.canAuthenticate) {
        client.disconnect();
        return;
      }

      let set = socketIdsByUserId.get(payload.sub);
      if (!set) {
        set = new Set();
        socketIdsByUserId.set(payload.sub, set);
      }
      set.add(client.id);
      userIdBySocketId.set(client.id, payload.sub);
      client.emit('authenticated');
    } catch {
      client.disconnect();
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

  emitDataChanged(resource: string): void {
    const socketIds = [...userIdBySocketId.keys()];
    if (socketIds.length)
      this.server.to(socketIds).emit('data-changed', { resource });
  }

  emitToUser(userId: string, payload: NotificationPayload): void {
    const ids = socketIdsByUserId.get(userId);
    if (!ids?.size) return;
    for (const socketId of ids) {
      this.server.to(socketId).emit('notification', payload);
    }
  }
}
