import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'

// Runs in a background thread so the model never freezes the page.
// It only forwards messages between CoreMind and WebLLM.
const handler = new WebWorkerMLCEngineHandler()
self.onmessage = (event: MessageEvent) => handler.onmessage(event)
