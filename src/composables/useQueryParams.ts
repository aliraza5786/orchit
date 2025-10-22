// src/composables/useRouteIds.ts
import { computed } from "vue";
import { useRoute } from "vue-router";

// Always return a string ('' if missing)
export function toParamString(v: unknown): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return typeof v === "string" ? v : "";
}

export function useWorkspaceId() {
  const route = useRoute();
  const workspaceId = computed<string>(() => toParamString(route?.params?.id));
  return { workspaceId };
}

export function useJobId() {
  const route = useRoute();
  const jobId = computed<string>(() => toParamString(route?.params?.job_id));
  return { jobId };
}

export function useRouteIds() {
  const route = useRoute();
  const workspaceId = computed<string>(() => toParamString(route?.params?.id));
  const jobId = computed<string>(
    () =>
      toParamString(route.params.job_id) ||
    toParamString(localStorage.getItem("jobId") ?? "")
  );
  const moduleId = computed<string>(() =>
    toParamString(route.params.module_id)
  );
  const token = computed<string>(() => toParamString(route.params.token));
  return { workspaceId, jobId, token, moduleId };
}
