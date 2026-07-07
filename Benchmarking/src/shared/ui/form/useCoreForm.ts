import { useForm, UseFormProps, FieldValues, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ZodType } from 'zod'

type UseCoreFormProps<T extends FieldValues> = UseFormProps<T> & {
  schema: ZodType<T>
}

export const useCoreForm = <T extends FieldValues>({
  schema,
  ...options
}: UseCoreFormProps<T>): UseFormReturn<T> => {
  return useForm<T>({
    resolver: zodResolver(schema as any) as any,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    ...options,
  })
}
