import type { QueryClient } from "@tanstack/svelte-query";
import { createMutation } from "@tanstack/svelte-query";
import { goto } from "$app/navigation";
import {
  invalidateLecturerDetail,
  invalidateLecturerList,
  removeLecturerDetail,
} from "$lib/lecturer-availability-queries";
import { lecturerAvailabilityCreateResponseSchema } from "$lib/lecturer-availability-schemas";
import type {
  LecturerAvailabilityCreate,
  LecturerAvailabilityForm,
} from "$lib/lecturer-availability-types";
import { http } from "./http";

export function createLecturerMutation(queryClient: QueryClient) {
  return createMutation(() => ({
    mutationFn: async (data: LecturerAvailabilityCreate) => {
      const res = await http({
        method: "POST",
        url: "/api/lecturer-availability",
        schema: lecturerAvailabilityCreateResponseSchema,
        payload: data,
      });

      return res;
    },
    onSuccess: async (created) => {
      await invalidateLecturerList(queryClient);
      await goto(
        `/dostepnosc-prowadzacych/${encodeURIComponent(created.usos_id)}`,
      );
    },
  }));
}

export function saveLecturerMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: async (formData: LecturerAvailabilityForm) => {
      await http({
        method: "PATCH",
        url: `/api/lecturer-availability/${encodeURIComponent(formData.usos_id)}`,
        payload: formData,
      });
    },
    onSuccess: async (_: unknown, formData: LecturerAvailabilityForm) => {
      await invalidateLecturerDetail(queryClient, formData.usos_id);
    },
  };
}

export function deleteLecturerMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: async (usosId: string) => {
      await http({
        method: "DELETE",
        url: `/api/lecturer-availability/${encodeURIComponent(usosId)}`,
      });
    },
    onSuccess: async (_: unknown, usosId: string) => {
      removeLecturerDetail(queryClient, usosId);
      await invalidateLecturerList(queryClient);
      await goto("/dostepnosc-prowadzacych");
    },
  };
}
