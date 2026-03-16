export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  readonly id: number;
  readonly title: string;
  readonly message: string;
  readonly type: NotificationType;
  readonly date: string;
  readonly read: boolean;
}

export interface NotificationInput {
  readonly title: string;
  readonly message: string;
  readonly type: NotificationType;
}
