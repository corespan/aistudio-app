type GpuNavigator = Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }

/**
 * Can this browser run local AI? WebLLM needs WebGPU and a real graphics
 * adapter. Kept apart from `localEngine` so this check never pulls the
 * (large) WebLLM library into the page.
 */
export const canRunLocalAI = async (): Promise<boolean> => {
  const { gpu } = navigator as GpuNavigator
  if (!gpu) return false
  try {
    return (await gpu.requestAdapter()) !== null
  } catch {
    return false
  }
}
