<template>
  <div class="w-full">
    <h2 class="text-2xl md:text-5xl font-semibold text-text-primary text-left m-0 ">
      {{ ai ? ' Choose Your Lanes' : 'Create Your Lanes' }}
    </h2>
    <p class="text-sm md:text-base text-text-secondary text-left mt-3 sm:mt-5.5 mb-0 md:mb-6">
      {{ ai ? ' Select the components you want to include in your project' : ' Create the components you want to include in your project'}}

    </p>
  </div>

  <div class="flex flex-col items-start gap-4 w-full pb-[80px]">
    <!-- Display Lanes (adapted to workspace.lanes structure) -->
    <label v-for="lane in form.lanes" :key="lane.variables.id" :for="`lane-${lane.variables.id}`"
      class="rounded-lg relative flex justify-between gap-4 lg:gap-5 items-center w-full p-4 cursor-pointer transition-all bg-bg-surface border border-border">
      <div class="flex gap-3 flex-1 min-w-0">
        <div class="w-9 h-9 shrink-0 text-text-primary rounded-lg" :style="{ background: lane.variables['lane-color'] }"></div>
        <div class="flex flex-col gap-1 min-w-0">
          <h3 class="font-medium capitalize text-sm text-text-primary">{{ lane.variables['lane-title'] }}</h3>
          <p class="text-[11px] text-text-secondary text-start line-clamp-1">{{ lane.variables['lane-description'] }}
          </p>
        </div>
      </div>

      <div class="flex gap-3 items-center">
        <button
          class="w-5 h-5 text-base aspect-square flex justify-center items-center rounded cursor-pointer text-accent"
          @click.stop="editLane(lane)">
          <i class="fa-solid fa-edit text-text-primary text-[20px]"></i>
        </button>
        <input type="checkbox" class="sr-only peer" :name="`lane-${lane.variables.id}`"
          :id="`lane-${lane.variables.id}`" v-model="selectedLanes" :value="lane.variables.id" />
        <div
          class="w-[20px] h-[20px] flex justify-center items-center border border-border bg-bg-card p-0.5 rounded cursor-pointer peer-checked:bg-accent peer-checked:border-none transition-all">
          <i class="w-4 text-bg-card fa-solid fa-check  peer-checked:text-white"></i>
        </div>
      </div>
    </label>

    <!-- Add Custom Lane Button -->
    <label v-if="!showCustomForm"
      class="rounded-lg w-full relative p-4 cursor-pointer transition-all bg-bg-surface border border-border"
      @click="handleAddCustomClick">
      <div class="flex gap-2 items-center justify-center">
        <div class="p-2.5 bg-accent rounded-full">
          <img class="w-3" src="../../../assets/icons/whitePlus.svg" alt="" />
        </div>
        <div class="flex flex-col justify-center">
          <h3 class="font-medium capitalize text-sm text-text-primary">Add Custom Lane</h3>
          <p class="text-[11px] text-text-secondary mt-1 line-clamp-1">Create your own component</p>
        </div>
      </div>
    </label>

    <!-- Lanes Form -->
    <div v-if="showCustomForm" class="bg-bg-surface border border-border w-full px-4 pt-4 rounded-lg">
      <h1 class="text-lg text-text-primary mb-3 font-semibold">{{ editMode ? 'Update Lane' : 'Add Custom Lane' }}</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <BaseTextField label="Lane Name" placeholder="Lane Name" size="lg" v-model="newLane['lane-title']"
          :error="!!titleError" :message="titleError" @blur="touched.title = true" />
        <!-- Color Picker -->
        <div class="">
          <label class="block text-base font-medium text-text-primary mb-2">Set Lane Color</label>
          <p v-if="colorError" class="text-red-500 text-sm -mt-2 mb-2">({{ colorError }})</p>
          <div class="flex items-center gap-3">
            <label class="relative block w-10 h-10 rounded-full border border-border cursor-pointer">
              <input type="color" v-model="newLane['lane-color']" class="absolute inset-0 opacity-0 cursor-pointer"
                @input="touched.color = true" />
              <div class="w-full h-full rounded-full" :style="{ backgroundColor: newLane['lane-color'] }"></div>
            </label>
            <div class="flex flex-col">
              <span class="text-sm text-text-primary">Set Color</span>
              <span class="text-xs text-text-secondary">{{ newLane['lane-color'] }}</span>
            </div>
          </div>
        </div>
        <BaseTextAreaField class="col-span-full" v-model="newLane['lane-description']" label="Description"
          placeholder="This lane will track support tickets." :error="!!descriptionError" :message="descriptionError"
          @blur="touched.description = true" />

      </div>




      <div class="flex gap-2 mt-4 justify-end border-t border-border bg-bg-surface py-4">
        <Button size="md" variant="primary" @click="editMode ? handleUpdateLane() : handleAddLane()">{{ editMode ?
          'Update Lane' : 'Add Lane' }}</Button>
        <Button size="md" variant="secondary" @click="handleCancelLane">Cancel</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import { useWorkspaceStore } from '../../../stores/workspace';
const workspaceStore = useWorkspaceStore();
defineProps<{ ai: boolean }>()
// Define workspace types and helpers
type UiLane = {
  variables: {
    id: string;
    'lane-title': string;
    'lane-description': string;
    'lane-color': string;
  }
};

const LANES = workspaceStore.workspace || {}
const form = ref<{ lanes: UiLane[] }>({ lanes: LANES.lanes || [] });
const newLane = ref<{
  id: string,
  'lane-title': string;
  'lane-description': string;
  'lane-color': string;

}>({ id: '', 'lane-title': '', 'lane-description': '', 'lane-color': '#4169E1' });

const selectedPlatforms = ref<string[]>([]);
const localIds = computed(() => {
  try {
    const raw = workspaceStore.workspace
    if (!raw) return [] // no value -> return empty array
    const data = raw
    // ensure lanes exists and is an array
    if (!data.lanes || !Array.isArray(data.lanes)) return []
    return data.lanes.map((l: any) => l.variables?.id).filter(Boolean)
  } catch (e) {
    console.warn('Failed to parse workspace from localStorage:', e)
    return []
  }
})

const selectedLanes = ref<string[]>(localIds.value ?? []);
const showCustomForm = ref(false);
const editMode = ref(false);

const touched = reactive({
  title: false,
  description: false,
  color: false,
});

const titleError = computed(() => {
  if (!touched.title) return '';
  const v = (newLane.value['lane-title'] || '').trim();
  if (!v) return 'Lane Name is required';
  if (v.length < 3) return 'Lane Name must be at least 3 characters';
  return '';
});

const descriptionError = computed(() => (!touched.description ? '' : (newLane.value['lane-description'] || '').trim() ? '' : 'Description is required'));
const colorError = computed(() => (!touched.color ? '' : /^#([0-9A-Fa-f]{6})$/.test(newLane.value['lane-color'] || '') ? '' : 'Pick a valid 6-digit HEX color'));

function handleAddCustomClick() {
  showCustomForm.value = true;
  editMode.value = false;
}

function handleCancelLane() {
  showCustomForm.value = false;
  editMode.value = false;
  resetForm()
}

function handleAddLane() {
  if (!titleError.value && !descriptionError.value) {
    selectedLanes.value = [...selectedLanes.value, `lane${form.value.lanes.length + 1}`]
    form.value.lanes.push({ variables: { ...newLane.value, id: `lane${form.value.lanes.length + 1}` } });
    showCustomForm.value = false;
    resetForm();
  }
}

function handleUpdateLane() {
  if (!titleError.value && !descriptionError.value) {
    const index = form.value.lanes.findIndex(l => l.variables.id === newLane.value.id);

    if (index !== -1) form.value.lanes[index] = { variables: { ...newLane.value } };
    showCustomForm.value = false;
    editMode.value = false;
  }
  resetForm()
}
function resetForm() {
  selectedPlatforms.value = [];
  newLane.value = { id: '', 'lane-title': '', 'lane-description': '', 'lane-color': '#4169E1' }
  touched.title = false;
  touched.description = false;

}
/** Edit existing lane */
function editLane(lane: UiLane) {
  newLane.value = { ...lane.variables }
  showCustomForm.value = true
  editMode.value = true
}



const saveToStoreHandler = () => {
  const filtered = form.value.lanes.filter((e) => selectedLanes.value.some(a => a == e.variables.id))
  workspaceStore.setWorkspace({ ...workspaceStore.workspace, variables: { ...workspaceStore.workspace.variables } , lanes: [...filtered] })
}
function continueHandler(): void {
  if (form.value.lanes.length > 0) {
    saveToStoreHandler()
    emit('next');
  }
}

defineExpose({ continueHandler });
const emit = defineEmits(['next']);

</script>

<style scoped>
input[type="radio"].peer {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
</style>
