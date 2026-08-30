export type TraceNotificationKind = 'ONE_YEAR_AGO' | 'NEW_MEMORY' | 'MONTHLY_REVIEW';

export type TraceNotification = {
  id: string;
  kind: TraceNotificationKind;
  title: string;
  body: string;
  scheduledAt: string;
};

export interface NotificationService {
  schedule(notification: TraceNotification): Promise<string>;
  cancel(id: string): Promise<void>;
  getScheduled(): Promise<TraceNotification[]>;
}

export class MockNotificationService implements NotificationService {
  private notifications = new Map<string, TraceNotification>();
  async schedule(notification: TraceNotification) { this.notifications.set(notification.id, notification); return notification.id; }
  async cancel(id: string) { this.notifications.delete(id); }
  async getScheduled() { return [...this.notifications.values()].sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()); }
}

export const notificationService: NotificationService = new MockNotificationService();
