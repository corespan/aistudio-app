import { useQuery } from '@tanstack/react-query'
import { jupyterKeys } from '../keys'
import { getJupyterInstances } from '../services/jupyter'
import { toJupyterInstanceRows } from '../selectors/toJupyterInstanceRows'

/** Lists previously-launched Jupyter notebook servers from GET /jupyter/instances. */
export const useJupyterInstances = () =>
  useQuery({
    queryKey: jupyterKeys.instances(),
    queryFn: getJupyterInstances,
    select: toJupyterInstanceRows,
    // Fetch once per session (e.g. on first sidebar hover) and reuse the
    // result everywhere else — the sidebar dropdown, the page table, etc. —
    // instead of refetching on every mount/focus/hover.
    staleTime: 20_000,
    gcTime: 20_000,
    meta: {
      errorNotification: {
        id: 'jupyter-instances-error',
        title: 'Unable to load Jupyter instances. Please try again.',
      },
    },
  })
