import { useMutation, useQuery } from "@tanstack/vue-query";
import api from "../libs/api";

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
