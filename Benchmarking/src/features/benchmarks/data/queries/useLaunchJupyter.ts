import { useMutation } from '@tanstack/react-query'
import { launchJupyter } from '../services/jupyter'

/** Fires POST /api/v1/jupyter/launch for the given node IP. */
export const useLaunchJupyter = () =>
  useMutation({
    mutationFn: launchJupyter,
    meta: {
      errorNotification: {
        id: 'jupyter-launch-error',
        title: 'Unable to launch Jupyter. Please try again.',
      },
    },
  })
