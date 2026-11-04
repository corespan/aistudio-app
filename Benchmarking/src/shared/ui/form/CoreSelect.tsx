import { useRef } from 'react'
import { Select, SelectProps } from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { useController, useFormContext } from 'react-hook-form'
import { useCoreMindField } from '@/shared/coremind/fieldRegistry'

type CoreSelectProps = SelectProps & {
  name: string
  /** Extra words CoreMind should accept for this field, e.g. ["ip", "machine"]. */
  coreMindAliases?: string[]
}

export const CoreSelect = ({ name, coreMindAliases, ...props }: CoreSelectProps) => {
  const { control } = useFormContext()

  const {
    field,
    fieldState: { error },
  } = useController({ name, control })

  // Every CoreSelect is known to CoreMind, so it can be filled from chat.
  const inputRef = useRef<HTMLInputElement>(null)
  const ref = useMergedRef(field.ref, inputRef)
  useCoreMindField(
    {
      name,
      label: props.label,
      placeholder: props.placeholder,
      aliases: coreMindAliases,
      data: props.data,
      disabled: props.disabled,
      value: field.value,
      onChange: field.onChange,
    },
    inputRef,
  )

  return <Select {...props} {...field} ref={ref} error={error?.message} />
}
