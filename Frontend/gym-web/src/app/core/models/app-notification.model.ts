export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  resourceType: string | null;
  resourceId: string | null;
  actionUrl: string | null;
  status: 'UNREAD' | 'READ';
  createdAt: string;
  readAt: string | null;
}

export interface NotificationUnreadCountResponse {
  count: number;
}
