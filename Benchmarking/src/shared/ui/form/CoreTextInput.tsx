import { useRef } from 'react'
import { TextInput, TextInputProps } from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { useController, useFormContext } from 'react-hook-form'
import { useCoreMindField } from '@/shared/coremind/fieldRegistry'

type CoreTextInputProps = TextInputProps & {
  name: string
  /** Extra words CoreMind should accept for this field, e.g. ["ip", "machine"]. */
  coreMindAliases?: string[]
}

export const CoreTextInput = ({ name, coreMindAliases, ...props }: CoreTextInputProps) => {
  const { control } = useFormContext()

  const {
    field,
    fieldState: { error },
  } = useController({ name, control })

  // Every CoreTextInput is known to CoreMind, so it can be filled from chat.
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = useMergedRef(field.ref, inputRef)
  useCoreMindField(
    {
      name,
      label: props.label,
      placeholder: props.placeholder,
      aliases: coreMindAliases,
      disabled: props.disabled,
      value: field.value,
      onChange: field.onChange,
    },
    inputRef,
  )

  return (
    <TextInput {...field} value={field.value ?? ''} {...props} ref={ref} error={error?.message} />
  )
}
