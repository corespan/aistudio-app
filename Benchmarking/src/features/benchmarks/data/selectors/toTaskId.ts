// /benchmarks/start returns the run's task id, tolerating a `{ data: {...} }` envelope.
export const readTaskId = (raw: unknown): string | null => {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  const data =
    obj?.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj
  const id = data?.task_id
  return typeof id === 'string' ? id : null
}
