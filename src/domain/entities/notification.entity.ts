/** Notificación persistida para un usuario. */
export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly body: string | null,
    public readonly data: Record<string, unknown> | null,
    public readonly readAt: Date | null,
    public readonly createdAt: Date,
  ) {}
}
