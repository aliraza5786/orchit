<template>
  <div class="relative" ref="dropdownRef">
    <!--  Bell Icon -->
    <button @click="toggleDropdown" class="relative flex items-center justify-center sm:mt-2  rounded-full cursor-pointer">
      <i class="fa-solid fa-bell text-primary text-[20px] font-bold"></i>

      <span v-if="count > 0"
        class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full px-[5px] py-[1px]">
        {{ count }}
      </span>
    </button>

    <!--  Dropdown -->
    <div v-if="isOpen"
      class="absolute -right-14 mt-3 w-70 sm:w-96 bg-bg-lavender border-b border-border-input rounded-xl shadow-2xl overflow-hidden z-50">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-border-input  flex items-center justify-between">
        <h3 class="text-[16px] font-bold font-manrope text-primary">Notifications</h3>
        <button v-if="notifications.length"
          class="text-[12px] cursor-pointer font-bold font-manrope text-accent underline" @click="markAllRead">Mark all
          as read</button>
      </div>

      <!-- Loading / Error -->
      <div v-if="notificationsQuery.isLoading.value" class="p-5 text-sm text-gray-500">Loading...</div>
      <div v-else-if="notificationsQuery.isError.value" class="p-5 text-sm text-red-500">Failed to load notifications
      </div>

      <!-- List -->
      <div v-else-if="Object.keys(groupedNotifications || {}).length" class="max-h-96 h-full overflow-y-auto">
        <template v-for="(group, label) in groupedNotifications" :key="label">
          <div class="px-4 py-2 text-xs font-semibold text-primary uppercase">{{ label }}</div>
          <div v-for="notification in group" :key="notification.id" @click="openNotification(notification)"
            class="flex gap-3 px-4 py-3 border-b border-border-input last:border-b-0  cursor-pointer transition-colors"
            :class="{
              'bg-bg-body ': !notification.read && !isDark,
              'hover:bg-bg-body': true
            }">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                :class="avatarColorClass(notification.actor_name || notification.title || 'U')">
                {{ initials(notification.actor_name || notification.title || 'U') }}
              </div>
            </div>
              <div class="flex-1 min-w-0 group">
                <p class="text-sm truncate"
                  :class="!notification.read ? 'font-semibold text-text-primary' : 'text-text-primary'">
                  <!-- <span v-if="notification.actor_name" class="mr-1">{{ notification.actor_name }}</span> -->
                  <span class="text-text-primary text-[14px] font-bold font-manrope block">
                    {{ notification.action || notification.title }}
                  </span>
                  <span class="block my-1 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-text-secondary font-manrope">
                    {{  notification.body || notification.message || ""}}
                  </span>
                </p>
                <div class="flex items-center justify-between">
                  <p class="text-xs  text-text-secondary mt-1 truncate font-manrope">{{ timeAgo(notification.created_at)
                  }}</p>
                  <div class="flex items-center gap-1.5 text-accent text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 pt-1">
                     <span>View details</span>
                     <i class="fa-solid fa-arrow-right text-[9px] mt-0.5 mb-1 transition-transform group-hover:translate-x-1"></i>
                  </div>
                </div>
                
              </div>
            <div v-if="!notification.read" class="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1"></div>
          </div>

        </template>
      </div>

      <!-- Empty -->
      <div v-else class="p-5 text-sm text-primary text-center font-manrope">No notifications</div>
    </div>

    <!-- Notification Detail Modal -->
    <BaseModal v-model="showDetailModal" :title="selectedNotification?.title || 'Notification Detail'" size="md">
      <div class="px-6 py-4 space-y-4">
        <div class="flex items-center gap-3">
          <div v-if="selectedNotification?.icon" class="text-2xl">{{ selectedNotification.icon }}</div>
          <div v-else class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
            :class="avatarColorClass(selectedNotification?.actor_name || selectedNotification?.title || 'U')">
            {{ initials(selectedNotification?.actor_name || selectedNotification?.title || 'U') }}
          </div>
          <div>
            <h4 class="text-base font-bold text-text-primary">{{ selectedNotification?.title }}</h4>
            <p class="text-xs text-text-secondary">{{ timeAgo(selectedNotification?.created_at) }}</p>
          </div>
        </div>
        
        <div class="bg-bg-body/50 p-4 rounded-lg border border-border/40">
          <p class="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {{ selectedNotification?.body || selectedNotification?.message }}
          </p>
        </div>

        <div v-if="selectedNotification?.metaData" class="space-y-2">
          <p class="text-xs font-bold text-text-secondary uppercase tracking-wider">Additional Information</p>
          <div class="grid grid-cols-1 gap-2">
             <div v-for="(value, key) in selectedNotification.metaData" :key="key" class="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
                <span class="text-text-secondary capitalize">{{ key.toString().replace(/_/g, ' ') }}:</span>
                <span class="text-text-primary font-medium">{{ value }}</span>
             </div>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useNotificationsQuery } from "../../../queries/useNotifications";
import { useTheme } from "../../../composables/useTheme";
import router from "../../../router";
import BaseModal from "../../../components/ui/BaseModal.vue";
const { isDark } = useTheme();

const showDetailModal = ref(false);
const selectedNotification = ref<any>(null);

const isOpen = ref(false);
const toggleDropdown = () => (isOpen.value = !isOpen.value);

const dropdownRef = ref<HTMLElement | null>(null);
function handleClickOutside(event: MouseEvent) {
  if (
    isOpen.value &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const {
  notificationsQuery,
  unreadCountQuery,
  markReadMutation,
  markAllReadMutation,
} = useNotificationsQuery();

const notifications = computed(() => notificationsQuery.data?.value || []);
const count = computed(() => unreadCountQuery.data?.value || 0);
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "UN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
];
function avatarColorClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

const groupedNotifications = computed(() => {
  if (!notifications.value.length) return {};
  const now = new Date();
  const groups: Record<string, any[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  notifications.value.forEach((n: any) => {
    const d = new Date(n.created_at || Date.now());
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) groups.Today.push(n);
    else if (diffDays === 1) groups.Yesterday.push(n);
    else groups.Older.push(n);
  });

  Object.keys(groups).forEach((k) => !groups[k].length && delete groups[k]);
  return groups;
});

function openNotification(notification: any) {
  if (!notification.read) {
    notification.read = true;
    markReadMutation.mutate([notification.id]);
  }

  // Use normalized .url if it's not the '#' fallback, otherwise use raw .action_url if present
  const targetUrl = (notification.url && notification.url !== '#') ? notification.url : notification.action_url;

  if (targetUrl) {
    router.push(targetUrl);
    isOpen.value = false;
    return;
  }

  const ws = notification?.workspace_id ?? notification?.data?.workspace_id;
  const moduleId = notification?.module_id ?? notification?.data?.module_id;
  
  if (ws && moduleId) {
    router.push({
      name: "productTask",
      params: {
        id: ws,
        module_id: moduleId,
        card_id: notification?.metaData?.card_id || notification?.metaData?.task_id || notification?.metadata?.card_id
      }
    });
    isOpen.value = false;
    return;
  }

  // Fallback: Open detail modal
  selectedNotification.value = notification;
  showDetailModal.value = true;
  isOpen.value = false;
}
const markAllRead = () => markAllReadMutation.mutate();
</script>
<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(100, 100, 100, 0.3);
  border-radius: 10px;
}
</style>
