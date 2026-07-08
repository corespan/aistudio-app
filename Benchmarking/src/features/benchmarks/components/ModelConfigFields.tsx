import { useEffect, useMemo } from 'react'
import { SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { Controller, useFormContext } from 'react-hook-form'
import { extractConfigFields, formatConfigValue } from '../data/selectors/extractConfigFields'
import type { StartBenchmarkFormValues } from '../startBenchmark.schema'

type Props = {
  /** Raw /models/config response — keys become editable fields. */
  config: unknown
}

/**
 * Renders the model config response as editable inputs, including `precision`.
 * Reads and writes the `config` field of the wizard's shared form (see
 * StartBenchmarkModal), so validity is owned entirely by that form's Zod
 * schema instead of being tracked locally.
 */
export const ModelConfigFields = ({ config }: Props) => {
  const { control, setValue } = useFormContext<StartBenchmarkFormValues>()

  const fields = useMemo(() => Object.entries(extractConfigFields(config)), [config])

  // Seed the shared form's `config` field whenever a new model's configuration
  // arrives, so the inputs start pre-filled with the fetched values.
  // shouldValidate runs the schema immediately, so a field that comes back
  // blank shows its "Required" error right away instead of only after the
  // user happens to touch it (or clicking Next, which is disabled precisely
  // when a field is blank — so it could never fire the validation itself).
  useEffect(() => {
    setValue(
      'config',
      Object.fromEntries(fields.map(([key, value]) => [key, formatConfigValue(value)])),
      { shouldValidate: true },
    )
  }, [fields, setValue])

  if (!fields.length) return null

  return (
    <Stack gap="sm">
      <Text fw={600} size="sm">
        Model configuration
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {fields.map(([key]) => (
          <Controller
            key={key}
            name={`config.${key}`}
            control={control}
            render={({ field, fieldState }) => (
              <TextInput {...field} value={field.value ?? ''} label={key} error={fieldState.error?.message} />
            )}
          />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
