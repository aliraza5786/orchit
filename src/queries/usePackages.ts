import { useApiQuery } from "../libs/vq";

export const useCurrentPackage = () => {
  return useApiQuery({
    key: ["current-package"],
    url: `/auth/subscription-stats`,
    method: "GET",
  });
};
