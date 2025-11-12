import { useQuery } from "@tanstack/vue-query";
import api from "../libs/api";

// ---------------------------
// Fetch Prompt Suggestions
// ---------------------------
export const fetchPromptSuggestions = async () => {
  const { data } = await api.get("/common/prompt-suggestions");
  return data.data;
};

export const usePromptSuggestions = (options = {}) => {
  return useQuery({
    queryKey: ["common", "prompt-suggestions"],
    queryFn: fetchPromptSuggestions,
    ...options,
  });
};
