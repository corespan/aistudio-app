import { z } from 'zod'

// A /models/config field can be any JSON value (number, boolean, string,
// nested object/array) — the app only cares that the top-level response is a
// plain object of fields, so field values are intentionally left unvalidated.
const configRecordSchema = z.record(z.string(), z.unknown())

/** Normalizes a /models/config response into a flat record, unwrapping a `{ data: {...} }` envelope if present. */
export const extractConfigFields = (response: unknown): Record<string, unknown> => {
  // A malformed response (null, a string, an array, ...) has no fields to read.
  const parsedResponse = configRecordSchema.safeParse(response)
  if (!parsedResponse.success) return {}

  // Some endpoints wrap the config in a `{ data: {...} }` envelope, others
  // return the config fields directly at the top level — support both.
  const parsedEnvelope = configRecordSchema.safeParse(parsedResponse.data.data)
  return parsedEnvelope.success ? parsedEnvelope.data : parsedResponse.data
}

/** Converts a config value into the text shown in its edit field. */
export const formatConfigValue = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// The reverse of formatConfigValue: converts the edited text back to whatever
// type the field originally had, so e.g. a boolean doesn't get sent to the
// API as the string "true" instead of the boolean `true`.
const restoreOriginalType = (originalValue: unknown, editedText: string): unknown => {
  switch (typeof originalValue) {
    case 'number': {
      const parsed = Number(editedText)
      return editedText.trim() !== '' && Number.isFinite(parsed) ? parsed : editedText
    }
    case 'boolean':
      return editedText.trim().toLowerCase() === 'true'
    case 'object':
      if (originalValue === null) return editedText
      try {
        return JSON.parse(editedText)
      } catch {
        return editedText // user typed invalid JSON — keep the raw text instead of crashing
      }
    default:
      return editedText
  }
}

/**
 * Merges the user's edited text values back onto the original config record,
 * restoring each value's original type (number, boolean, object) so the API
 * receives the same shape it returned. Any key the user didn't edit passes
 * through untouched.
 */
export const mergeConfigValues = (
  response: unknown,
  editedValues: Record<string, string>,
): Record<string, unknown> => {
  const original = extractConfigFields(response)
  const merged: Record<string, unknown> = { ...original }

  for (const [key, editedText] of Object.entries(editedValues)) {
    merged[key] = restoreOriginalType(original[key], editedText)
  }

  return merged
}
