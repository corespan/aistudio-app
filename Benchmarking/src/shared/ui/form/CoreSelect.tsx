import { Select, SelectProps } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'

type CoreSelectProps = SelectProps & {
  name: string
}

export const CoreSelect = ({ name, ...props }: CoreSelectProps) => {
  const { control } = useFormContext()

  const {
    field,
    fieldState: { error },
  } = useController({ name, control })

  return <Select {...props} {...field} error={error?.message} />
}
