import { useQuery } from "@tanstack/react-query";

import {
  explainLatestTaalBulletin,
  explainTaalBulletinById,
  explainTaalBulletinWithContext,
  getLatestTaalBulletin,
  getTaalBulletinById
} from "../services/taalBulletinApi";
import type { TaalBulletinExplainContext } from "../services/taalBulletinApi";

const bulletinQuerySettings = {
  staleTime: 1000 * 60 * 30,
  retry: 1
};

function normalizeId(id: number | string | undefined) {
  if (typeof id === "number") {
    return Number.isInteger(id) && id > 0 ? id : undefined;
  }

  const trimmed = id?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function useLatestTaalBulletin() {
  return useQuery({
    queryKey: ["taal-bulletins", "latest"],
    queryFn: getLatestTaalBulletin,
    ...bulletinQuerySettings
  });
}

export function useTaalBulletinById(id: number | string | undefined) {
  const bulletinId = normalizeId(id);

  return useQuery({
    queryKey: ["taal-bulletins", bulletinId],
    queryFn: () => getTaalBulletinById(bulletinId as number | string),
    enabled: bulletinId !== undefined,
    ...bulletinQuerySettings
  });
}

export function useExplainTaalBulletinById(id: number | string | undefined) {
  const bulletinId = normalizeId(id);

  return useQuery({
    queryKey: ["taal-bulletins", bulletinId, "explain"],
    queryFn: () => explainTaalBulletinById(bulletinId as number | string),
    enabled: bulletinId !== undefined,
    ...bulletinQuerySettings
  });
}

export function useExplainLatestTaalBulletin() {
  return useQuery({
    queryKey: ["taal-bulletins", "latest", "explain"],
    queryFn: explainLatestTaalBulletin,
    ...bulletinQuerySettings
  });
}

export function useExplainTaalBulletinWithContext(
  id: number | string | undefined,
  context: TaalBulletinExplainContext | undefined
) {
  const bulletinId = normalizeId(id);

  return useQuery({
    queryKey: ["taal-bulletins", bulletinId, "explain", context],
    queryFn: () =>
      explainTaalBulletinWithContext(
        bulletinId as number | string,
        context as TaalBulletinExplainContext
      ),
    enabled: bulletinId !== undefined && context !== undefined,
    ...bulletinQuerySettings
  });
}
