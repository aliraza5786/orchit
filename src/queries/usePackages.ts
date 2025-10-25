import { useRoute } from "vue-router";
import { request } from "../libs/api";
import { useApiMutation, useApiQuery } from "../libs/vq";

export const useCurrentPackage = () => {
  return useApiQuery({
    key: ["current-package"],
    url: `/auth/subscription-stats`,
    method: "GET",
  });
};

export const useUpgradePackage = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["package-payment"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `billing/payment-intent`,
          method: "POST",
          data: vars,
        }),
      ...(options as any),
    } as any
  );
export const confirmPayment = (payload: any, options = {}) => {
  const route= useRoute()
  console.log(payload,route.query.session_id, '>>>>');
  return useApiMutation<any, any>(
    {
      key: ["package-payment-confirm"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `billing/confirm-payment`,
          method: "POST",
          data: { ...payload, ...vars, sessionId:route.query.session_id },
        }),
      ...(options as any),
    } as any
  );
};
