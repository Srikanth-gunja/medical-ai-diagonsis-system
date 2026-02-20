import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, Notification } from '@/lib/api';

// Query keys for notifications
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (limit?: number, unreadOnly?: boolean) =>
    [...notificationKeys.lists(), { limit, unreadOnly }] as const,
  count: () => [...notificationKeys.all, 'count'] as const,
};

/**
 * Hook to fetch notifications
 */
export function useNotifications(limit: number = 20, unreadOnly: boolean = false) {
  return useQuery({
    queryKey: notificationKeys.list(limit, unreadOnly),
    queryFn: () => notificationsApi.getAll(limit, unreadOnly),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
  });
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadNotificationCount(enablePolling: boolean = true) {
  return useQuery({
    queryKey: notificationKeys.count(),
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: enablePolling ? 30000 : false,
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
