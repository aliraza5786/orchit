import { useMutation, useQuery } from "@tanstack/vue-query";
import api, { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref } from "vue";

export const updateProductCard = async (param: any) => {
  const { data } = await api.put(`/sheets/card/${param.id}`, param.payload);
  return data.data;
};

export const useUpdateProductCard = (options = {}) => {
  return useMutation({
    mutationKey: ["update-product-card"],
    mutationFn: updateProductCard,
    ...options,
  });
};
export const fetchCardTypes = async (id: any) => {
  const { data } = await api.get(`common/cardtypes-sheet?workspace_id=${id}`); // update API path as needed
  return data.data;
};

export const useFetchCardTypes = (id: any) => {
  return useQuery({
    queryKey: ["workspaces-card-types"],
    queryFn: () => fetchCardTypes(id),
  });
};
export const fetchStatus = async (id: any) => {
  const { data } = await api.get(`common/cardstatus-sheet?workspace_id=${id}`); // update API path as needed
  return data.data;
};

export const useFetchStatus = (id: any) => {
  return useQuery({
    queryKey: ["workspaces-card-status"],
    queryFn: () => fetchStatus(id),
  });
};

export const fetchPriority = async (id: any) => {
  const { data } = await api.get(
    `common/cardpriority-sheet?workspace_id=${id}`
  ); // update API path as needed
  return data.data;
};

export const useFetchPriority = (id: any) => {
  return useQuery({
    queryKey: ["workspaces-card-priority"],
    queryFn: () => fetchPriority(id),
  });
};

export const addCardTypes = async (payload: any) => {
  const { data } = await api.post(`common/cardtypes-manual`, payload); // update API path as needed
  return data.data;
};

export const useAddCardTypes = (options = {}) => {
  return useMutation({
    mutationKey: ["add-workspaces-card-types"],
    mutationFn: addCardTypes,
    ...options,
  });
};
export const addCardStatus = async (payload: any) => {
  const { data } = await api.post(`common/cardstatus-manual`, payload); // update API path as needed
  return data.data;
};

export const useAddCardStatus = (options = {}) => {
  return useMutation({
    mutationKey: ["add-workspaces-card-status"],
    mutationFn: addCardStatus,
    ...options,
  });
};
export const addCardPriority = async (payload: any) => {
  const { data } = await api.post(`common/cardpriority-manual`, payload); // update API path as needed
  return data.data;
};

export const useAddCardPriority = (options = {}) => {
  return useMutation({
    mutationKey: ["add-workspaces-card-priority"],
    mutationFn: addCardPriority,
    ...options,
  });
};

export const useComments = (card_id: any, options = {}) => {
  return useQuery({
    queryKey: ["comments", card_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/cards/${unref(card_id)}/comments`,
        method: "GET",
        signal,
      }),
    ...options,
    enabled: !unref(card_id) ? false : true,
  });
};
export const useCreateComment = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["add-comment"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `workspace/cards/${vars.id}/comments`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useDeleteComment = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["delete-comment"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/workspace/comments/${vars.id}`,
          method: "DELETE",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useUpdateComment = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["update-comment"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `workspace/comments/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useProductCard = (card_id: any, options = {}) => {
  console.log(" i am calling >>>", unref(card_id));

  return useQuery({
    queryKey: [`cardDetail`, card_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `/workspace/card/${unref(card_id)}`,
        method: "GET",
        signal,
      }),
    ...options,
    enabled: !unref(card_id) ? false : true,
  });
};
