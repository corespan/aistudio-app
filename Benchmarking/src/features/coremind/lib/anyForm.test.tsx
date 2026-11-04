import { act, render, screen } from '@testing-library/react'
import { MantineProvider, Modal } from '@mantine/core'
import { useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { CoreForm, CoreSelect, CoreTextInput } from '@/shared/ui'
import { useCoreMindField, useCoreMindFieldRegistry } from '@/shared/coremind/fieldRegistry'
import type { ToolContext } from '../types'
import { runCommand } from './runCommand'

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
  Element.prototype.scrollIntoView ??= () => {}
})

const ctx = { pathname: '/' } as ToolContext

const say = async (message: string) => {
  let text = ''
  await act(async () => {
    text = (await runCommand(message, ctx)).text
  })
  return text
}

/** A form CoreMind has never seen: no CoreMind code mentions any of these fields. */
const DeployForm = () => (
  <MantineProvider>
    <CoreForm
      formId="deploy"
      schema={z.object({ region: z.string(), replicas: z.string(), image_tag: z.string() })}
      defaultValues={{ region: '', replicas: '', image_tag: '' }}
      onSubmit={() => {}}
    >
      <CoreSelect name="region" label="Region" data={['us-east-1', 'eu-west-1', 'ap-south-1']} />
      <CoreTextInput name="replicas" label="Replicas" />
      <CoreTextInput name="image_tag" label="Image tag" />
    </CoreForm>
  </MantineProvider>
)

const visibleValue = (value: string) =>
  screen.getAllByDisplayValue(value).filter((el) => el.getAttribute('type') !== 'hidden')

describe('CoreMind understands any form built from Core inputs', () => {
  it('fills a brand-new form from chat, showing each value in its input', async () => {
    render(<DeployForm />)

    expect(await say('add replicas 3')).toBe('Replicas set to 3.')
    expect(await say('set the image tag to v2.4.1')).toBe('Image tag set to v2.4.1.')
    expect(await say('select region eu')).toBe('Region set to eu-west-1.')
    expect(await say('region is ap-south-1')).toBe('Region set to ap-south-1.')

    expect(screen.getByLabelText('Replicas')).toHaveValue('3')
    expect(screen.getByLabelText('Image tag')).toHaveValue('v2.4.1')
    expect(visibleValue('ap-south-1')).toHaveLength(1)
  })

  it('asks instead of guessing, and lists the options', async () => {
    render(<DeployForm />)
    expect(await say('select region us')).toBe('Region set to us-east-1.')
    expect(await say('select region mars')).toBe(
      '"mars" isn\'t one of the Region options: us-east-1, eu-west-1, ap-south-1.',
    )
    expect(await say('select region')).toBe(
      'Which Region? Options: us-east-1, eu-west-1, ap-south-1.',
    )
  })

  it('lists the fields on screen with their current values', async () => {
    render(<DeployForm />)
    await say('add replicas 2')
    expect(await say('what can I fill here?')).toBe(
      [
        'Fields you can fill here:',
        '• Region (dropdown: us-east-1, eu-west-1, ap-south-1)',
        '• Replicas (text) — currently "2"',
        '• Image tag (text)',
      ].join('\n'),
    )
  })

  it('forgets fields when their form leaves the screen', () => {
    const { unmount } = render(<DeployForm />)
    expect(Object.values(useCoreMindFieldRegistry.getState().fields)).toHaveLength(3)
    unmount()
    expect(useCoreMindFieldRegistry.getState().fields).toEqual({})
  })
})

/** The Benchmarks page situation: a "Model" filter on the page AND a "Model" field in a modal. */
const PageWithModal = () => {
  const page = useForm({ defaultValues: { model: '' } })
  const dialog = useForm({ defaultValues: { model: '' } })
  return (
    <MantineProvider>
      <FormProvider {...page}>
        <CoreSelect name="model" label="Model" data={['llama-3.1-8b', 'mistral-7b']} />
        <output data-testid="page">{page.watch('model')}</output>
      </FormProvider>
      <Modal opened onClose={() => {}} title="New run">
        <FormProvider {...dialog}>
          <CoreSelect name="model" label="Model" data={['llama-3.1-8b', 'mistral-7b']} />
          <output data-testid="dialog">{dialog.watch('model')}</output>
        </FormProvider>
      </Modal>
    </MantineProvider>
  )
}

describe('modals come first', () => {
  it('fills the field in the open modal, not the same-named one behind it', async () => {
    render(<PageWithModal />)
    expect(await say('set model to mistral')).toBe('Model set to mistral-7b.')
    expect(screen.getByTestId('dialog')).toHaveTextContent('mistral-7b')
    expect(screen.getByTestId('page')).toHaveTextContent('')
  })
})

/** A field CoreMind has never been told about — it only signs onto the live list. */
const RetriesField = () => {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useCoreMindField({ name: 'retryCount', label: 'Retries', value, onChange: setValue }, ref)
  return <input ref={ref} aria-label="Retries" value={value} onChange={() => {}} />
}

describe('any input can sign itself in with useCoreMindField', () => {
  it('fills a field from the live list with no special rules for it', async () => {
    render(<RetriesField />)
    // "retries" is one typo away from "results" (a word for the Benchmarks page) —
    // a real field label on screen must win over that fuzzy guess.
    expect(await say('add retries 3')).toBe('Retries set to 3.')
    expect(screen.getByLabelText('Retries')).toHaveValue('3')
  })
})
