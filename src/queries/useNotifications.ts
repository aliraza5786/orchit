import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import api from "../libs/api";
import { getSocket } from "../libs/socket";           // ✅ lazy getter, not bare socket
import { onMounted, onUnmounted, watch, computed } from "vue";
import { useAuthStore } from '../stores/auth'

export interface Notification {
  id: string;
  title: string;
  body: string;
  actor_name: string;
  action?: string;
  url: string;
  created_at: string;
  read: boolean;
  workspace_id: string;
  module_id: string;
  metaData: any;
}

// -----------------------------
// DUMMY FALLBACK DATA
// -----------------------------
const dummyNotifications: Notification[] = [];

export const fetchNotifications = async () => {
  try {
    const { data } = await api.get('/notifications')
    
    const notifications = data?.data?.notifications || []
    const mappedNotifications = notifications.map((item: any): Notification => ({
      id: item._id,
      actor_name: item.triggered_by?.user_email || "Unknown User",
      title: item.title || "Untitled Notification",
      body: item.message || "",
      created_at: item.createdAt,
      url: item.action_url || "#",
      read: item.is_read || false,
      workspace_id: item.workspace_id || null,
      module_id: item.module_id || null,
      metaData: item.metadata,
    }))

    return mappedNotifications.length ? mappedNotifications : dummyNotifications
  } catch (err) {
    console.warn("⚠️ Notifications API failed, using dummy data")
    return dummyNotifications
  }
}

export const fetchUnreadCount = async () => {
  try {
    const { data } = await api.get('/notifications/unread-count')
    return data.data.count || 0
  } catch (err) {
    console.warn("⚠️ Unread count API failed, returning 0")
    return 0
  }
}

export const markNotificationsRead = async (ids: string[]) => {
  const { data } = await api.patch("/notifications/read", { notification_ids: ids })
  return data.data
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all')
  return data.data
}

// ─── Composable ───────────────────────────────────────────────────────────────

// -----------------------------
// COMPOSABLE
// -----------------------------
export const useNotificationsQuery = (options = {}) => {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  const companyId = computed(() =>
    authStore.company_id || localStorage.getItem('company_id') || ''
  )

  watch(companyId, (newId, oldId) => {
    if (newId === oldId) return
    queryClient.invalidateQueries({ queryKey: ["notifications", "list"] })
    queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] })
  })

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: fetchNotifications,
    ...options,
  })

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: fetchUnreadCount,
    ...options,
  })

  // ✅ Register listeners here — they were cleaned up but never added before
  onMounted(() => {
    const sock = getSocket()

    sock.on("new_notification", (raw: any) => {
      // Prepend to list immediately — no waiting for HTTP
      queryClient.setQueryData(
        ["notifications", "list"],
        (old: Notification[] = []) => [{
          id: raw._id,
          actor_name: raw.triggered_by?.user_email || "Unknown",
          title: raw.title || "New notification",
          body: raw.message || "",
          created_at: raw.createdAt,
          url: raw.action_url || "#",
          read: false,
          workspace_id: raw.workspace_id || null,
          module_id: raw.module_id || null,
          metaData: raw.metadata,
        }, ...old]
      )
      // Bump the badge count
      queryClient.setQueryData(
        ["notifications", "unreadCount"],
        (old: number = 0) => old + 1
      )
    })

    sock.on("unread_count_update", (data: { count: number }) => {
      // ✅ Server pushes authoritative count — use it directly
      queryClient.setQueryData(
        ["notifications", "unreadCount"],
        data.count
      )
    })
  })

  onUnmounted(() => {
    const sock = getSocket()
    sock.off("new_notification")
    sock.off("unread_count_update")
  })

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onMutate: async (ids: string[]) => {
      // ✅ Optimistic update — dot disappears instantly on click
      queryClient.setQueryData(
        ["notifications", "list"],
        (old: Notification[] = []) =>
          old.map(n => ids.includes(n.id) ? { ...n, read: true } : n)
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      // ✅ Optimistic — all dots vanish before server responds
      queryClient.setQueryData(
        ["notifications", "list"],
        (old: Notification[] = []) => old.map(n => ({ ...n, read: true }))
      )
      queryClient.setQueryData(
        ["notifications", "unreadCount"],
        0
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] })
    },
  })

  return {
    notificationsQuery,
    unreadCountQuery,
    markReadMutation,
    markAllReadMutation,
  }
}