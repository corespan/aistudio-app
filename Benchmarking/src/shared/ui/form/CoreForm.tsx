import { ReactNode } from 'react'
import {
  FormProvider,
  UseFormReturn,
  FieldValues,
  DefaultValues,
  UseFormProps,
} from 'react-hook-form'
import { ZodType } from 'zod'
import { useCoreForm } from './useCoreForm'

type CoreFormProps<T extends FieldValues> = {
  schema: ZodType<T>
  defaultValues?: DefaultValues<T>
  onSubmit: (data: T, methods: UseFormReturn<T>) => void | Promise<void>
  children: ReactNode
  formId: string
  /** Override the default `onTouched` validation trigger (e.g. `onSubmit` to validate only on submit). */
  mode?: UseFormProps<T>['mode']
  reValidateMode?: UseFormProps<T>['reValidateMode']
}

export const CoreForm = <T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  formId,
  mode,
  reValidateMode,
}: CoreFormProps<T>) => {
  const methods = useCoreForm<T>({
    schema,
    defaultValues,
    ...(mode ? { mode } : {}),
    ...(reValidateMode ? { reValidateMode } : {}),
  })

  const handleSubmit = methods.handleSubmit((data: any) => {
    return onSubmit(data, methods)
  })

  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormProvider>
  )
}
