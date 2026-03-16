import { Injectable, computed, signal } from '@angular/core';
import { Notification, NotificationInput, NotificationType } from '../models/notification.model';

const STORAGE_KEY = 'aurora.course-manager.notifications';

@Injectable({ providedIn: 'root' })
export class NotificationStoreService {
  private readonly notificationState = signal<readonly Notification[]>(this.loadNotifications());

  readonly notifications = computed(() => this.notificationState());
  readonly unreadCount = computed(() => this.notificationState().filter(n => !n.read).length);

  getNotificationById(notificationId: number): Notification | undefined {
    return this.notificationState().find(n => n.id === notificationId);
  }

  addNotification(input: NotificationInput): Notification {
    const createdNotification: Notification = {
      id: this.getNextNotificationId(),
      title: input.title,
      message: input.message,
      type: input.type,
      date: new Date().toISOString(),
      read: false,
    };

    this.writeNotifications([createdNotification, ...this.notificationState()]);
    return createdNotification;
  }

  markAsRead(notificationId: number): void {
    const nextNotifications = this.notificationState().map(n =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    this.writeNotifications(nextNotifications);
  }

  markAllAsRead(): void {
    const nextNotifications = this.notificationState().map(n => ({ ...n, read: true }));
    this.writeNotifications(nextNotifications);
  }

  removeNotification(notificationId: number): void {
    const nextNotifications = this.notificationState().filter(n => n.id !== notificationId);
    this.writeNotifications(nextNotifications);
  }

  clearAll(): void {
    this.writeNotifications([]);
  }

  private writeNotifications(notifications: readonly Notification[]): void {
    this.notificationState.set(notifications);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }

  private loadNotifications(): readonly Notification[] {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return this.generateFakeNotifications();
    }

    try {
      const parsedData = JSON.parse(rawData) as Notification[];
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData;
      }
    } catch {
      return this.generateFakeNotifications();
    }
    return this.generateFakeNotifications();
  }

  private getNextNotificationId(): number {
    return this.notificationState().reduce((maxId, n) => Math.max(maxId, n.id), 0) + 1;
  }

  private generateFakeNotifications(): readonly Notification[] {
    return [
      {
        id: 1,
        title: '系统更新提醒',
        message: '教务管理系统已更新至 V2.0 版本，新增教师管理和成绩管理功能。',
        type: 'info',
        date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
      },
      {
        id: 2,
        title: '安全提醒',
        message: '检测到您的账号在新设备上登录。',
        type: 'warning',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: false,
      },
    ];
  }
}
