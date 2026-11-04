import {
  CreateWebWorkerMLCEngine,
  type InitProgressReport,
  type WebWorkerMLCEngine,
} from '@mlc-ai/web-llm'

/** The model CoreMind runs locally — small, fast, good at picking from a list. */
export const LOCAL_MODEL = 'Qwen3-1.7B-q4f16_1-MLC'

let enginePromise: Promise<WebWorkerMLCEngine> | null = null

/**
 * Loads the model once (downloading it on first use) and reuses it after —
 * calling this again never downloads or loads twice.
 */
export const getLocalEngine = (onProgress?: (report: InitProgressReport) => void) => {
  if (!enginePromise) {
    const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' })
    enginePromise = CreateWebWorkerMLCEngine(worker, LOCAL_MODEL, {
      initProgressCallback: onProgress,
    }).catch((error: unknown) => {
      enginePromise = null // let the user retry after a failure
      worker.terminate()
      throw error
    })
  }
  return enginePromise
}
