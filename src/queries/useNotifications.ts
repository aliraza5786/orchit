import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import api from "../libs/api";
import { socket } from "../libs/socket";
import { onMounted, onUnmounted } from "vue";


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
}



// -----------------------------
// DUMMY FALLBACK DATA
// -----------------------------
const dummyNotifications : Notification[] = [];

// -----------------------------
// API HANDLERS
// -----------------------------
export const fetchNotifications = async () => {
  try {
    const { data } = await api.get("/notifications");
    const notifications = data?.data?.notifications || [];

    // 🧠 Transform API data → dummy-like structure
    const mappedNotifications = notifications.map((item: any):Notification => ({
      id: item._id,
      actor_name: item.triggered_by?.user_email || "Unknown User",
      title: item.title || "Untitled Notification",
      body: item.message || "",
      created_at: item.createdAt,
      url: item.action_url || "#",
      read: item.is_read || false,
    }));

    //  If API gives empty array, use dummy fallback
    return mappedNotifications.length ? mappedNotifications : dummyNotifications;
  } catch (err) {
    console.warn("⚠️ Notifications API failed, using dummy data");
    return dummyNotifications;
  }
};


export const fetchUnreadCount = async () => {
  try {
    const { data } = await api.get("/notifications/unread-count");
    return data.data.count || 0;
  } catch (err) {
    console.warn("⚠️ Unread count API failed, returning 0");
    return 0;
  }
};

export const markNotificationsRead = async (ids: string[]) => {
  const { data } = await api.patch("/notifications/read", {
    notification_ids: ids,
  });
  return data.data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/notifications/read-all");
  return data.data;
};

// -----------------------------
// MAIN COMPOSABLE
// -----------------------------
let listenersRegistered = false;

export const useNotificationsQuery = (options = {}) => {
  const queryClient = useQueryClient();

  //  Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: fetchNotifications,
    ...options,
  });

  //  Fetch unread count
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: fetchUnreadCount,
    ...options,
  });

  // -----------------------------
  // SOCKET EVENT LISTENERS
  // -----------------------------
  onMounted(() => {
    if (!listenersRegistered) {
      //  When a new notification arrives
      socket.on("new_notification", (notification) => {
        console.log(" New notification received:", notification);
        // Update cache immediately (optimistic UI)
        queryClient.setQueryData(["notifications", "list"], (oldData: any = []) => {
          return [notification, ...oldData];
        });
        queryClient.invalidateQueries({ queryKey: ["notifications", "unreadCount"] });
      });

      //  When unread count changes
      socket.on("unread_count_update", (data) => {
        console.log("📩 Unread count updated:", data);
        const newCount = typeof data === 'object' && data !== null ? data.count : data;
        queryClient.setQueryData(["notifications", "unreadCount"], newCount);
      });

      listenersRegistered = true;
    }
  });

  onUnmounted(() => {
    socket.off("new_notification");
    socket.off("unread_count_update");
    listenersRegistered = false;
  });

  // -----------------------------
  // MUTATIONS
  // -----------------------------
  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  return {
    notificationsQuery,
    unreadCountQuery,
    markReadMutation,
    markAllReadMutation,
  };
};
