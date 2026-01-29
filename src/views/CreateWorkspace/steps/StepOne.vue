<template>
  <div class="w-full">
    <h2 v-once class="text-2xl md:text-4xl font-semibold text-text-primary text-left m-0">Project Details</h2>
    <p v-once class="text-sm md:text-base text-text-secondary text-left mt-3 sm:mt-5 mb-0">Let's refine your
      project details</p>
  </div>

  <div class="space-y-6 pb-[60px] w-full">
    <!-- File Upload with Memoization -->
    <FileUploader v-model="logo" label="Upload your project logo" tooltip="You can upload your logo image here"
      message="Supports .png, .jpg, .jpeg file formats" :error="logoError" placeholder="Choose a logo"
      accept=".png,.jpg,.jpeg" />

    <BaseTextField label="Give your workspace a name" placeholder="Workspace name" size="lg" v-model="form.title"
      :message="ai ? 'AI suggested this name based on your description' : ''">
      <template #msgIcon>
        <img src="../../../assets/icons/stars.svg" alt="" />
      </template>
    </BaseTextField>

    <BaseSelectField v-model="form['workspace-type']" :options="workspaceTypeOptions" label="Workspace Type" size="lg"
      :allowCustom="true" :message="ai ? 'AI suggested this name based on your description' : ''"
      placeholder="e.g. for team" >
      <template #msgIcon>
        <img src="../../../assets/icons/stars.svg" alt="" />
      </template>
    </BaseSelectField>

    <BaseMultiSelect v-model="form['workspace-industries']" :options="industryData || []" label="Industry" size="lg"
      :allowCustom="true" :message="ai ? 'AI suggested this name based on your description' : ''"
      placeholder="e.g. Ecommerce, Health, EdTech">
      <template #msgIcon>
        <img src="../../../assets/icons/stars.svg" alt="" />
      </template>
    </BaseMultiSelect>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import BaseTextField from '../../../components/ui/BaseTextField.vue';
import BaseMultiSelect from '../../../components/ui/BaseMultiSelect.vue';
import BaseSelectField from '../../../components/ui/BaseSelectField.vue';
import FileUploader from '../../../components/ui/FileUploader.vue';
import { useIndustries, useWorkspacesTitles } from '../../../queries/useWorkspace';
import { useUploadFile, usePrivateUploadFile } from '../../../queries/useCommon';
import { toast } from 'vue-sonner';
import { useWorkspaceStore } from '../../../stores/workspace';
const workspaceStore = useWorkspaceStore();

defineProps<{
  ai: boolean;
}>();

type WorkspaceVariables = {
  title: string;
  'workspace-type': string;
  'workspace-industries': string[];
  [k: string]: unknown;
};

type Workspace = {
  logo?: string;
  variables: Partial<WorkspaceVariables>;
};

function safeJSONParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return value as T;
  } catch {
    return fallback;
  }
}

function getWorkspace(): Workspace {
  return safeJSONParse<Workspace>(workspaceStore.workspace, { variables: {} });
}

function setWorkspace(updater: (prev: Workspace) => Workspace) {
  const prev = getWorkspace();
  const next = updater(prev);
  workspaceStore.setWorkspace(next)
}

/** Static Options */
const workspaceTypeOptions = [
  { title: 'For client', _id: 'client' },
  { title: 'For Me', _id: 'personel' },
  { title: 'For Team', _id: 'team' },
]; 

const { data: industryData } = useIndustries();
const { data: allWorkspacesTitles } = useWorkspacesTitles();

const emit = defineEmits<{
  (e: 'next'): void;
  (e: 'back'): void;
}>();

const logo = ref<any>(getWorkspace().logo ?? null);
const form = ref<WorkspaceVariables>({
  title: '',
  'workspace-type': '',
  'workspace-industries': [],
});

onMounted(() => {
  const ws = getWorkspace();
  const vars = ws.variables || {};
  form.value = {
    ...form.value,
    ...vars,
    'workspace-type': vars['workspace-type'] ? String(vars['workspace-type']).toLowerCase() : '',
    'workspace-industries': Array.isArray(vars['workspace-industries'])
      ? (vars['workspace-industries'] as string[])
      : [],
    title: String(vars.title || ''),
  };
});

const logoError = computed(() => !logo.value);
const isValid = computed(() => {
  const hasLogo = !!logo.value;
  const hasTitle = !!form.value.title?.trim();
  const rawType = form.value['workspace-type'];
  const hasType = typeof rawType === 'string' &&
    rawType.trim() !== '' &&
    rawType !== 'undefined' &&
    rawType !== 'null';
  const hasIndustries = (form.value['workspace-industries']?.length || 0) > 0;
  return hasLogo && hasTitle && hasType && hasIndustries;
});

function ensureUniqueTitle() {
  const titles: string[] = (allWorkspacesTitles.value as unknown as string[]) || [];
  const exists = titles.includes(form.value.title);
  if (exists) {
    toast.error('Workspace title already exists. Please choose a different title.');
    return false;
  }
  return true;
}

/** Upload + persist */
const { mutate, isPending } = useUploadFile({
  onSuccess: (data: any) => {
    const url: string | undefined = data?.data?.url;
    if (!url) {
      toast.error('Upload succeeded but no URL was returned.');
      return;
    }
    setWorkspace(prev => ({
      ...prev,
      logo: url,
      variables: { ...(prev.variables || {}), ...form.value },
    }));
    emit('next');
    return;
  },
  onError: (err: any) => {
    console.error('File upload failed', err);
    toast.error('File upload failed. Please try again.');
  },
});
const { mutate: privateMutate, isPending: isPrivatePending } = usePrivateUploadFile({
  onSuccess: (data: any) => {
    const url: string | undefined = data?.data?.url;
    if (!url) {
      toast.error('Upload succeeded but no URL was returned.');
      return;
    }
    setWorkspace(prev => ({
      ...prev,
      logo: url,
      variables: { ...(prev.variables || {}), ...form.value },
    }));
    emit('next');
    return;
  },
  onError: (err: any) => {
    console.error('File upload failed', err);
    toast.error('File upload failed. Please try again.');
  },
});

function continueHandler() {
  if (!form.value['workspace-type']?.trim()) {
    toast.error('Please select a workspace type.');
    return;
  }
  if (!isValid.value) {
    toast.error('Please fill all fields and upload a file.');
    return;
  }
  if (!ensureUniqueTitle()) return;

  if (logo.value instanceof File) {
    const fd = new FormData();
    fd.append('file', logo.value);
    if (localStorage.getItem('token')) {
      privateMutate(fd);
    } else
      mutate(fd);
    return;
  }

  setWorkspace(prev => ({
    ...prev,
    logo: typeof logo.value === 'string' ? logo.value : prev.logo,
    variables: { ...(prev.variables || {}), ...form.value },
  }));
  emit('next');
}

defineExpose({ continueHandler, isPending, isPrivatePending });
</script>

<style scoped>
input[type='radio'].peer {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
</style>
