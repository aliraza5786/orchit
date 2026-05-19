<template>
  <div class="w-full">
    <h2
      v-once
      class="text-2xl md:text-4xl font-semibold text-text-primary text-left m-0"
    >
      Workspace Details
    </h2>
    <p
      v-once
      class="text-sm md:text-base text-text-secondary text-left mt-3 sm:mt-5 mb-0"
    >
      Let's refine your workspace details
    </p>
  </div>

  <div class="space-y-6 pb-[60px] w-full">
    <!-- File Upload with Memoization (Optional) -->
    <FileUploader
      v-model="logo"
      label="Upload your workspace logo (Optional)"
      tooltip="You can upload your logo image here"
      message="Supports .png, .jpg, .jpeg file formats"
      placeholder="Choose a logo"
      accept=".png,.jpg,.jpeg"
    />

    <!-- Color Picker for Workspace -->
    <div class="flex flex-col items-start gap-2 w-full text-left">
      <label class="text-sm font-medium text-text-primary"
        >Workspace Color</label
      >
      <div
        class="flex items-center gap-3 w-full bg-bg-input border border-border rounded-lg px-3 py-2 transition-all"
      >
        <input
          type="color"
          v-model="form['workspace-color']"
          class="w-8 h-8 p-0 border-0 rounded cursor-pointer shrink-0 bg-bg-input"
        />
        <span class="text-sm text-text-secondary flex-1"
          >This color will be used for your workspace icon and accents</span
        >
      </div>
    </div>

    <BaseTextField
      label="Give your workspace a name"
      placeholder="Workspace name"
      size="lg"
      v-model="form.title"
      :message="ai ? 'AI suggested this name based on your description' : ''"
    >
      <template #msgIcon>
        <img src="../../../assets/icons/stars.svg" alt="" />
      </template>
    </BaseTextField>

    <BaseSelectField
      class=""
      v-model="form['workspace-type']"
      :options="workspaceTypeOptions"
      label="Workspace Type"
      size="lg"
      :allowCustom="true"
      :message="ai ? 'AI suggested this name based on your description' : ''"
      placeholder="e.g. For Team"
    >
      <template #msgIcon>
        <img src="../../../assets/icons/stars.svg" alt="" />
      </template>
    </BaseSelectField>

    <BaseMultiSelect
      v-model="form['workspace-industries']"
      :options="industryData || []"
      label="Industry"
      size="lg"
      :allowCustom="true"
      :message="ai ? 'AI suggested this name based on your description' : ''"
      placeholder="e.g. Ecommerce, Health, EdTech"
    >
      <template #msgIcon>
        <img src="../../../assets/icons/stars.svg" alt="" />
      </template>
    </BaseMultiSelect>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed, watch } from "vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import BaseMultiSelect from "../../../components/ui/BaseMultiSelect.vue";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import FileUploader from "../../../components/ui/FileUploader.vue";
import {
  useIndustries,
  useWorkspacesTitles,
} from "../../../queries/useWorkspace";
import {
  useUploadFile,
  usePrivateUploadFile,
} from "../../../queries/useCommon";
import { toast } from "vue-sonner";
import { useWorkspaceStore } from "../../../stores/workspace";
const workspaceStore = useWorkspaceStore();

defineProps<{
  ai: boolean;
}>();

type WorkspaceVariables = {
  title: string;
  "workspace-type": string;
  "workspace-industries": string[];
  "workspace-color"?: string;
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
  workspaceStore.setWorkspace(next);
}

/** Static Options */
const workspaceTypeOptions = [
  { title: "For client", _id: "client" },
  { title: "For Me", _id: "personel" },
  { title: "For Team", _id: "team" },
];

const { data: industryData } = useIndustries();
const { data: allWorkspacesTitles } = useWorkspacesTitles();

const emit = defineEmits<{
  (e: "next"): void;
  (e: "back"): void;
}>();

const logo = ref<any>(getWorkspace().logo ?? null);
const form = ref<WorkspaceVariables>({
  title: "",
  "workspace-type": "",
  "workspace-industries": [],
  "workspace-color": "#7D68C8",
});

function extractDominantColor(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      const imgData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;

      for (let i = 0; i < imgData.length; i += 4) {
        if (imgData[i + 3] < 128) continue; // skip transparent

        // Skip near white and near black to prioritize the main brand color
        const isWhite =
          imgData[i] > 240 && imgData[i + 1] > 240 && imgData[i + 2] > 240;
        const isBlack =
          imgData[i] < 15 && imgData[i + 1] < 15 && imgData[i + 2] < 15;

        if (!isWhite && !isBlack) {
          r += imgData[i];
          g += imgData[i + 1];
          b += imgData[i + 2];
          count++;
        }
      }

      if (count === 0) {
        // Fallback to all non-transparent pixels
        for (let i = 0; i < imgData.length; i += 4) {
          if (imgData[i + 3] < 128) continue;
          r += imgData[i];
          g += imgData[i + 1];
          b += imgData[i + 2];
          count++;
        }
      }

      if (count === 0) return resolve("#7D68C8");

      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);

      const hex =
        "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
      resolve(hex);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

watch(logo, async (newLogo) => {
  if (!newLogo) return;

  let url = "";
  if (newLogo instanceof File) {
    url = URL.createObjectURL(newLogo);
  } else if (typeof newLogo === "string") {
    url = newLogo;
  }

  if (url) {
    try {
      const color = await extractDominantColor(url);
      if (color) {
        form.value["workspace-color"] = color;
      }
    } catch (e) {
      console.warn("Failed to extract color from logo", e);
    }
  }
});

onMounted(() => {
  const ws = getWorkspace();
  const vars = ws.variables || {};
  form.value = {
    ...form.value,
    ...vars,
    "workspace-type": vars["workspace-type"]
      ? String(vars["workspace-type"]).toLowerCase()
      : "",
    "workspace-industries": Array.isArray(vars["workspace-industries"])
      ? (vars["workspace-industries"] as string[])
      : [],
    "workspace-color": vars["workspace-color"]
      ? String(vars["workspace-color"])
      : "#7D68C8",
    title: String(vars.title || ""),
  };
});

const isValid = computed(() => {
  const hasTitle = !!form.value.title?.trim();
  const rawType = form.value["workspace-type"];
  const hasType =
    typeof rawType === "string" &&
    rawType.trim() !== "" &&
    rawType !== "undefined" &&
    rawType !== "null";
  const hasIndustries = (form.value["workspace-industries"]?.length || 0) > 0;
  return hasTitle && hasType && hasIndustries;
});

function ensureUniqueTitle() {
  const titles: string[] =
    (allWorkspacesTitles.value as unknown as string[]) || [];
  const exists = titles.includes(form.value.title);
  if (exists) {
    toast.error(
      "Workspace title already exists. Please choose a different title.",
    );
    return false;
  }
  return true;
}

/** Upload + persist */
const { mutate, isPending } = useUploadFile({
  onSuccess: (data: any) => {
    const url: string | undefined = data?.data?.url;
    if (!url) {
      toast.error("Upload succeeded but no URL was returned.");
      return;
    }
    setWorkspace((prev) => ({
      ...prev,
      logo: url,
      variables: { ...(prev.variables || {}), ...form.value },
    }));
    emit("next");
    return;
  },
  onError: (err: any) => {
    console.error("File upload failed", err);
    toast.error("File upload failed. Please try again.");
  },
});
const { mutate: privateMutate, isPending: isPrivatePending } =
  usePrivateUploadFile({
    onSuccess: (data: any) => {
      const url: string | undefined = data?.data?.url;
      if (!url) {
        toast.error("Upload succeeded but no URL was returned.");
        return;
      }
      setWorkspace((prev) => ({
        ...prev,
        logo: url,
        variables: { ...(prev.variables || {}), ...form.value },
      }));
      emit("next");
      return;
    },
    onError: (err: any) => {
      console.error("File upload failed", err);
      toast.error("File upload failed. Please try again.");
    },
  });

function continueHandler() {
  if (!form.value["workspace-type"]?.trim()) {
    toast.error("Please select a workspace type.");
    return;
  }
  if (!isValid.value) {
    toast.error("Please fill all mandatory fields.");
    return;
  }
  if (!ensureUniqueTitle()) return;

  if (logo.value instanceof File) {
    const fd = new FormData();
    fd.append("file", logo.value);
    if (localStorage.getItem("token")) {
      privateMutate(fd);
    } else mutate(fd);
    return;
  }

  setWorkspace((prev) => ({
    ...prev,
    logo: typeof logo.value === "string" ? logo.value : prev.logo,
    variables: { ...(prev.variables || {}), ...form.value },
  }));
  emit("next");
}

defineExpose({ continueHandler, isPending, isPrivatePending });
</script>

<style scoped>
input[type="radio"].peer {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
</style>
