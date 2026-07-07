import { TextInput, TextInputProps } from '@mantine/core'
import { useController, useFormContext } from 'react-hook-form'

type CoreTextInputProps = TextInputProps & {
  name: string
}

export const CoreTextInput = ({ name, ...props }: CoreTextInputProps) => {
  const { control } = useFormContext()

  const {
    field,
    fieldState: { error },
  } = useController({ name, control })

  return <TextInput {...field} {...props} error={error?.message} />
}
