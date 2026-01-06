import { useQuery } from "@tanstack/vue-query";
import api from "../libs/api";

export const fetchReleaseNotes = async () => {
  const { data } = await api.get("/common/releasenotes");
  return data.data; // Assuming response structure { data: [...] } based on user input
};

export const useReleaseNotes = (options = {}) => {
  return useQuery({
    queryKey: ["common", "releasenotes"],
    queryFn: fetchReleaseNotes,
    ...options,
  });
};
