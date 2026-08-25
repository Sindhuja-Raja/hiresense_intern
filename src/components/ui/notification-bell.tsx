import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { notificationApi, NotificationItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const formatRelativeTime = (isoDate: string): string => {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoDate).toLocaleDateString();
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getMy();
      setNotifications(response.data?.notifications || []);
    } catch {
      // Fail silently to keep header interactions responsive.
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notification: NotificationItem) => {
    if (notification.read) return;

    setNotifications((previous) =>
      previous.map((item) =>
        item._id === notification._id ? { ...item, read: true } : item
      )
    );

    try {
      await notificationApi.markRead(notification._id);
    } catch {
      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id ? { ...item, read: false } : item
        )
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    const previous = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));

    try {
      setIsMarkingAll(true);
      await notificationApi.markAllRead();
    } catch {
      setNotifications(previous);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll || unreadCount === 0}
          >
            {isMarkingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            <span className="ml-1.5">Mark all</span>
          </Button>
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-96 overflow-y-auto p-1">
          {loading ? (
            <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className="items-start gap-2 p-3 cursor-pointer"
                onClick={() => handleMarkRead(notification)}
              >
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-transparent' : 'bg-primary'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? 'font-normal' : 'font-semibold'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;
