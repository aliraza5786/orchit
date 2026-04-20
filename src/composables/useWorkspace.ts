// composables/useWorkspace.ts
import { useRoute } from 'vue-router'

export function useWorkspace() {
  const route = useRoute()

  const slug = import.meta.env.PROD
    ? window.location.hostname.split('.')[0]  // extracts "abc" from "abc.orchit.ai"
    : route.query.workspace as string         // reads ?workspace=abc locally

  return { slug }
}