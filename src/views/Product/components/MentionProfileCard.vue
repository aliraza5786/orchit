<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';

const props = defineProps({
  user: { type: Object, required: true },
  target: { type: Object as () => HTMLElement, required: true },
});

const emit = defineEmits(['close']);

const popoverRef = ref<HTMLElement | null>(null);
const coords = ref({ x: 0, y: 0 });
const isReady = ref(false);

let cleanup: (() => void) | null = null;

const initials = (n?: string) =>
  (n ?? "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

onMounted(() => {
  if (popoverRef.value && props.target) {
    cleanup = autoUpdate(props.target, popoverRef.value, () => {
      computePosition(props.target, popoverRef.value!, {
        placement: 'top',
        middleware: [offset(10), flip(), shift({ padding: 10 })]
      }).then(({ x, y }) => {
        coords.value = { x, y };
        isReady.value = true;
      });
    });
  }
  
  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (popoverRef.value && !popoverRef.value.contains(e.target as Node) && !props.target.contains(e.target as Node)) {
      emit('close');
    }
  };
  window.addEventListener('mousedown', handleClickOutside);
  onBeforeUnmount(() => {
    window.removeEventListener('mousedown', handleClickOutside);
    if (cleanup) cleanup();
  });
});
</script>

<template>
  <Teleport to="body">
    <div
      ref="popoverRef"
      :style="{
        position: 'fixed',
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        visibility: isReady ? 'visible' : 'hidden'
      }"
      :class="['z-[9999] w-[300px] bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden pointer-events-auto transition-[opacity,transform] duration-300 ease-out', 
               isReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95']"
    >
        <!-- Banner -->
        <div class="h-24 bg-accent relative opacity-90"></div>
        
        <!-- Content Area -->
        <div class="px-5 pb-5 relative">
          <!-- Avatar and Name Section -->
          <div class="flex items-end -mt-12 gap-3 mb-4">
            <!-- Large Overlapping Avatar -->
            <div class="w-22 h-22 min-w-[88px] rounded-full border-4 border-bg-card bg-bg-surface overflow-hidden flex items-center justify-center shadow-md">
               <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover">
               <span v-else class="text-accent text-3xl font-bold">{{ initials(user.u_full_name || user.name || user.title) }}</span>
            </div>
            
            <!-- User Name Info (next to avatar) -->
            <div class="pb-1 min-w-0">
              <h4 class="text-text-primary font-bold text-xl truncate leading-tight">
                {{ user.u_full_name || user.name || user.title }}
              </h4>
              <div class="flex items-center gap-1 text-text-secondary text-xs opacity-70">
                <i class="fa-regular fa-envelope"></i>
                <span class="truncate">{{ user.email }}</span>
              </div>
            </div>
          </div>
          
          <!-- Bio / Role Placeholder if needed -->
          <p v-if="user.bio" class="text-text-secondary text-sm line-clamp-2 mb-4 px-1">
            {{ user.bio }}
          </p>

          <!-- Action Section -->
          <div class="pt-4 border-t border-border/50">
            <button class="w-full py-2.5 bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-sm rounded-xl transition-all duration-200 border border-accent/20 active:scale-[0.98] flex items-center justify-center gap-2">
               <span>View Full Profile</span>
               <i class="fa-solid fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
