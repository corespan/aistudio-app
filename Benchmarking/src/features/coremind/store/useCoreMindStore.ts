import { create } from 'zustand'
import type { ChatMessage, CoreMindStore } from '../types'

export const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  text: `Hi, I'm CoreMind. Tell me what to do — e.g. "go to benchmarks", "change theme to teal" or "make the sidebar dark blue". Type "help" for more.`,
}

/** Chat panel open state, mode and transcript. In-memory only — clears on reload. */
export const useCoreMindStore = create<CoreMindStore>((set) => ({
  isOpen: false,
  mode: 'agent',
  messages: [GREETING],
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
  addMessage: (message) => {
    const id = crypto.randomUUID()
    set((s) => ({ messages: [...s.messages, { ...message, id }] }))
    return id
  },
  clear: () => set({ messages: [GREETING] }),
}))
