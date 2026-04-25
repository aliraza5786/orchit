import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import api from "../libs/api";
import { socket } from "../libs/socket";
import { onUnmounted, watch, computed } from "vue";
import { useAuthStore } from '../stores/auth'

// -----------------------------
// INTERFACES
// -----------------------------
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

// -----------------------------
// HELPERS — always read fresh company_id
// -----------------------------
function getCompanyId(): string {
  const authStore = useAuthStore()
  return authStore.company_id || localStorage.getItem('company_id') || ''
}

// -----------------------------
// API FUNCTIONS
// -----------------------------
export const fetchNotifications = async () => {
  try {
    const companyId = getCompanyId()
    console.log('🏢 fetchNotifications company_id:', companyId)

    const { data } = await api.get(`/notifications${companyId ? `?company_id=${companyId}` : ''}`)
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
    const companyId = getCompanyId()
    console.log('🏢 fetchUnreadCount company_id:', companyId)

    const { data } = await api.get(`/notifications/unread-count${companyId ? `?company_id=${companyId}` : ''}`)
    return data.data.count || 0
  } catch (err) {
    console.warn("⚠️ Unread count API failed, returning 0")
    return 0
  }
}

export const markNotificationsRead = async (ids: string[]) => {
  const { data } = await api.patch("/notifications/read", {
    notification_ids: ids,
  })
  return data.data
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/notifications/read-all")
  return data.data
}

// -----------------------------
// COMPOSABLE
// -----------------------------
export const useNotificationsQuery = (options = {}) => {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  // ✅ Reactive company_id — watches both authStore and localStorage
  const companyId = computed(() =>
    authStore.company_id || localStorage.getItem('company_id') || ''
  )

  // ✅ Re-fetch both queries whenever company_id changes
  watch(companyId, (newId, oldId) => {
    if (newId === oldId) return
    console.log('🔄 company_id changed, refetching notifications:', newId)

    queryClient.invalidateQueries({ queryKey: ["notifications", "list"] })
    queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] })
  })

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list", companyId],
    queryFn: fetchNotifications,
    ...options,
  })

  // Fetch unread count
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unreadCount", companyId],
    queryFn: fetchUnreadCount,
    ...options,
  })

  onUnmounted(() => {
    socket.off("new_notification")
    socket.off("unread_count_update")
  })

  // -----------------------------
  // MUTATIONS
  // -----------------------------
  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
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