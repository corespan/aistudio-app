import { useQuery } from '@tanstack/react-query'
import { healthKeys } from '../keys'
import { getHealth } from '../services/health'

/**
 * Polls the backend `/health` endpoint so the DB-health indicator stays live
 * without a manual refresh. A failed request surfaces as `isError`, which the
 * indicator renders as "unreachable" — no error toast (this is a passive probe).
 */
export const useHealth = () =>
  useQuery({
    queryKey: healthKeys.all,
    queryFn: getHealth,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  })
