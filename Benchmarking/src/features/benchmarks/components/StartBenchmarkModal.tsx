import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCheck,
  IconCpu,
  IconGauge,
  IconPlayerPlay,
  IconRocket,
  IconServer,
  IconSettings,
} from '@tabler/icons-react'
import { CoreIcon, CoreSelect } from '@/shared/ui'
import { useModels, useNodes } from '../data/queries/useBenchmarkOptions'
import { useModelConfig } from '../data/queries/useModelConfig'
import { useStartBenchmark } from '../data/queries/useStartBenchmark'
import { extractConfigFields, mergeConfigValues } from '../data/selectors/extractConfigFields'
import { readTaskId } from '../data/selectors/toTaskId'
import { startBenchmarkSchema, type StartBenchmarkFormValues } from '../startBenchmark.schema'
import { useRunStreamsStore } from '../store/useRunStreamsStore'
import { ModelConfigFields } from './ModelConfigFields'

type Props = {
  opened: boolean
  onClose: () => void
}

const STEPS = [
  {
    title: 'Select Node',
    description: 'Choose the machine where the benchmark will run.',
    icon: IconServer,
  },
  {
    title: 'Configure Model',
    description: 'Select the model to benchmark.',
    icon: IconCpu,
  },
  {
    title: 'Model Configuration',
    description: 'Configuration fetched for the selected model.',
    icon: IconSettings,
  },
  {
    title: 'Review & Confirm',
    description: 'Please review your configuration before starting.',
    icon: IconGauge,
  },
] as const

const EMPTY_VALUES: StartBenchmarkFormValues = {
  nodeIp: '',
  model: '',
  config: {},
}

const GRADIENT = { from: 'cyan', to: 'indigo', deg: 135 } as const

const CONFIG_INCOMPLETE_MESSAGE =
  'Configuration is incomplete. Please ensure all fields are present.'
const CONFIG_UNAVAILABLE_MESSAGE =
  "This model's configuration could not be loaded correctly. Please try again or select a different model."

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <Group justify="space-between" wrap="nowrap">
    <Text size="sm" c="dimmed">
      {label}
    </Text>
    <Text size="sm" fw={600} ta="right">
      {value || '—'}
    </Text>
  </Group>
)

export const StartBenchmarkModal = ({ opened, onClose }: Props) => {
  const [active, setActive] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const startRun = useRunStreamsStore((s) => s.startRun)
  const openDrawer = useRunStreamsStore((s) => s.openDrawer)

  const form = useForm<StartBenchmarkFormValues>({
    resolver: zodResolver(startBenchmarkSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: EMPTY_VALUES,
  })

  const nodeIp = useWatch({ control: form.control, name: 'nodeIp' })
  const model = useWatch({ control: form.control, name: 'model' })
  const configValues = useWatch({ control: form.control, name: 'config' })

  const nodes = useNodes()
  const models = useModels()
  // GET /api/v1/models/config?node_ip=<nodeIp>&model=<model> — fires once both
  // the node (step 0) and the model (step 1) have been selected.
  const modelConfig = useModelConfig(nodeIp || null, model || null)
  const startBenchmark = useStartBenchmark()

  // configFieldCount === 0 and "some field is blank" are DIFFERENT failure
  // modes and must never be conflated:
  //   - Every real model always returns at least one config field, so zero
  //     fields means the /models/config response was malformed or otherwise
  //     failed to parse (see extractConfigFields) — not "nothing to configure."
  //   - A blank field (count > 0, but some value is empty) means the user
  //     cleared it while editing.
  // This is derived from modelConfig.data directly, NOT from the form's
  // `config` value — ModelConfigFields is the thing that seeds `config` from
  // modelConfig.data in the first place, so gating on the form value would
  // create a chicken-and-egg deadlock (it starts empty, so it would look
  // "malformed" on every render before ModelConfigFields ever gets a chance
  // to seed it).
  const configFieldCount = modelConfig.isSuccess
    ? Object.keys(extractConfigFields(modelConfig.data)).length
    : 0
  // Object.values({}).every(...) is vacuously true for an empty object, so
  // isConfigComplete must check configFieldCount > 0 explicitly — otherwise a
  // malformed response silently looks "complete" with zero fields.
  const isConfigComplete =
    configFieldCount > 0 &&
    Object.values(configValues ?? {}).every((value) => (value ?? '').trim() !== '')

  const reset = () => {
    setActive(0)
    setValidationError(null)
    form.reset(EMPTY_VALUES)
    startBenchmark.reset()
  }

  const handleClose = () => {
    onClose()
    reset()
  }

  // Users can move between steps freely — only the first three steps require a
  // valid selection (per the shared Zod schema) before advancing.
  const handleNext = async () => {
    setValidationError(null)

    if (active === 0 && !(await form.trigger('nodeIp'))) return

    if (active === 1 && !(await form.trigger('model'))) return

    if (active === 2) {
      if (!modelConfig.isSuccess) {
        setValidationError('Configuration is still loading. Please wait.')
        return
      }
      if (configFieldCount === 0) {
        setValidationError(CONFIG_UNAVAILABLE_MESSAGE)
        return
      }
      if (!isConfigComplete) {
        setValidationError(CONFIG_INCOMPLETE_MESSAGE)
        return
      }
    }

    setActive((step) => Math.min(step + 1, STEPS.length - 1))
  }

  const handleBack = () => setActive((step) => Math.max(step - 1, 0))

  // Fires the actual /benchmarks/start call from the Review & Confirm step,
  // sending the user's edited config; on success the wizard advances to the
  // Benchmark Started step.
  const handleStart = form.handleSubmit(
    (values) => {
      // modelConfig.data can go stale/undefined between fetch and submit (e.g.
      // cache eviction on a long-idle session) — merging against an
      // unavailable response would silently send every field as a raw string
      // instead of its real type, so refuse to submit rather than degrade.
      if (!modelConfig.isSuccess) {
        setValidationError(CONFIG_UNAVAILABLE_MESSAGE)
        return
      }
      // The schema alone treats an all-blank config as invalid per-field, but
      // this is a belt-and-suspenders check in case this ever runs before the
      // resolver has caught up.
      if (configFieldCount === 0) {
        setValidationError(CONFIG_UNAVAILABLE_MESSAGE)
        return
      }
      if (!isConfigComplete) {
        setValidationError(CONFIG_INCOMPLETE_MESSAGE)
        return
      }
      setValidationError(null)
      startBenchmark.mutate(
        {
          model_name: values.model,
          node_ips: [values.nodeIp],
          config: mergeConfigValues(modelConfig.data, values.config),
        },
        {
          onSuccess: (data) => {
            const runId = readTaskId(data)
            // Register the run in the shared store so its stream survives this
            // modal closing and runs alongside any other in-progress runs, then
            // hand the user straight to its live progress drawer.
            if (runId) {
              startRun({ taskId: runId, model: values.model, nodeIp: values.nodeIp })
              openDrawer(runId)
            }
            handleClose()
          },
        },
      )
    },
    () => {
      setValidationError(CONFIG_INCOMPLETE_MESSAGE)
    },
  )

  const StepIcon = STEPS[active].icon
  // Review the exact config that will be submitted — the user's edits merged
  // over the fetched response — not the untouched API response. Only computed
  // on the Review step itself, since configValues changes on every keystroke
  // in step 2 and this recomputation isn't needed until step 3 is visible.
  const configEntries =
    active === 3 ? Object.entries(mergeConfigValues(modelConfig.data, configValues)) : []

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size={32} radius="md" variant="gradient" gradient={GRADIENT}>
            <CoreIcon icon={<IconRocket stroke={1.8} />} size={18} />
          </ThemeIcon>
          <Title order={4} fw={700}>
            Start Benchmark
          </Title>
        </Group>
      }
      size={920}
      padding={0}
      radius="lg"
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      centered
    >
      <Divider />
      <FormProvider {...form}>
        <Group align="stretch" gap={0} wrap="nowrap">
          <Box w={230} p="xl">
            <Timeline active={active} bulletSize={26} lineWidth={2}>
              {STEPS.map((step, index) => (
                <Timeline.Item
                  key={step.title}
                  bullet={
                    index < active ? (
                      <CoreIcon icon={<IconCheck />} size={13} />
                    ) : (
                      <Text size="xs" fw={700}>
                        {index + 1}
                      </Text>
                    )
                  }
                  title={
                    <Text
                      size="sm"
                      fw={index === active ? 700 : 500}
                      c={index === active ? 'indigo' : undefined}
                    >
                      {step.title}
                    </Text>
                  }
                />
              ))}
            </Timeline>
          </Box>

          <Box p="xl" flex={1} miw={0}>
            <Stack gap="lg" justify="space-between" mih={420}>
              <Stack gap="lg">
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon size={38} radius="md" variant="light" color="indigo">
                    <CoreIcon icon={<StepIcon stroke={1.6} />} size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg">
                      {STEPS[active].title}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {STEPS[active].description}
                    </Text>
                  </div>
                </Group>

                {active === 0 && (
                  <Paper withBorder radius="md" p="lg" shadow="xs">
                    <Autocomplete
                      label="Node IP"
                      placeholder="Type or paste a machine IP (e.g. 10.6.12.22)"
                      description={
                        nodes.data && nodes.data.length > 0
                          ? 'Previously used machines appear as suggestions'
                          : 'Enter the IP address of your GPU machine'
                      }
                      data={nodes.data?.map((opt) => (typeof opt === 'string' ? opt : opt.value)) ?? []}
                      value={nodeIp}
                      onChange={(val) => form.setValue('nodeIp', val, { shouldValidate: true })}
                      onBlur={() => form.trigger('nodeIp')}
                      error={form.formState.errors.nodeIp?.message}
                      leftSection={<CoreIcon icon={<IconServer stroke={1.6} />} size={16} />}
                      size="md"
                    />
                  </Paper>
                )}

                {active === 1 && (
                  <Paper withBorder radius="md" p="lg" shadow="xs">
                    <CoreSelect
                      name="model"
                      label="Model"
                      leftSection={<CoreIcon icon={<IconCpu stroke={1.6} />} size={16} />}
                      placeholder={
                        models.isPending
                          ? 'Loading…'
                          : models.isError
                            ? 'Failed to load models'
                            : 'Select model'
                      }
                      data={models.data ?? []}
                      disabled={models.isPending || models.isError}
                      size="md"
                    />
                  </Paper>
                )}

                {active === 2 && (
                  <Paper withBorder radius="md" p="lg" shadow="xs">
                    {modelConfig.isFetching ? (
                      <Group gap="sm" py="md">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">
                          Fetching configuration for {model}…
                        </Text>
                      </Group>
                    ) : modelConfig.isError ? (
                      <Alert
                        icon={<CoreIcon icon={<IconAlertCircle />} size={16} />}
                        color="red"
                        title="Unable to load configuration"
                      >
                        Failed to fetch configuration for {model}. Please try again.
                      </Alert>
                    ) : modelConfig.isSuccess ? (
                      configFieldCount === 0 ? (
                        // A real model always returns >=1 config field — zero
                        // fields here means the response was malformed, not
                        // "nothing to configure." Surface it as a load error,
                        // not as a blank-field validation message.
                        <Alert
                          icon={<CoreIcon icon={<IconAlertCircle />} size={16} />}
                          color="red"
                          title="No configuration available"
                        >
                          {CONFIG_UNAVAILABLE_MESSAGE}
                        </Alert>
                      ) : (
                        <Stack gap="sm">
                          <ModelConfigFields config={modelConfig.data} />
                          {!isConfigComplete && (
                            <Text size="sm" c="red">
                              {CONFIG_INCOMPLETE_MESSAGE}
                            </Text>
                          )}
                        </Stack>
                      )
                    ) : (
                      <Text size="sm" c="dimmed">
                        Select a model in the previous step to fetch its configuration.
                      </Text>
                    )}
                  </Paper>
                )}

                {active === 3 && (
                  <Stack gap="md">
                    <Paper withBorder radius="md" p="lg" shadow="xs">
                      <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                        Configuration
                      </Text>
                      <SimpleGrid cols={2} spacing="sm">
                        <ReviewRow label="Node IP" value={nodeIp} />
                        <ReviewRow label="Model" value={model} />
                      </SimpleGrid>
                    </Paper>

                    <Paper withBorder radius="md" p="lg" shadow="xs">
                      <Text size="xs" fw={700} c="dimmed" mb="sm" tt="uppercase">
                        Model Parameters
                      </Text>
                      {configEntries.length ? (
                        <SimpleGrid cols={2} spacing="sm">
                          {configEntries.map(([key, value]) => (
                            <ReviewRow key={key} label={key} value={String(value ?? '')} />
                          ))}
                        </SimpleGrid>
                      ) : (
                        <Text size="sm" c="dimmed">
                          No configuration fetched yet.
                        </Text>
                      )}
                    </Paper>
                  </Stack>
                )}
              </Stack>

              {validationError && (
                <Alert
                  icon={<CoreIcon icon={<IconAlertCircle />} size={16} />}
                  color="red"
                  title="Validation Error"
                  mt="md"
                >
                  {validationError}
                </Alert>
              )}

              <Group
                justify="flex-end"
                pt="md"
                style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
              >
                {active > 0 && active < 4 && (
                  <Button type="button" variant="default" radius="md" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {active < 3 && (
                  <Button
                    type="button"
                    radius="md"
                    onClick={handleNext}
                    disabled={
                      (active === 0 && !nodeIp) ||
                      (active === 1 && !model) ||
                      (active === 2 && (!modelConfig.isSuccess || !isConfigComplete))
                    }
                  >
                    Next
                  </Button>
                )}
                {active === 3 && (
                  <Button
                    type="button"
                    bg="#3b5bdb"
                    c="white"
                    radius="md"
                    leftSection={<CoreIcon icon={<IconPlayerPlay stroke={1.8} />} size={16} />}
                    loading={startBenchmark.isPending}
                    onClick={handleStart}
                  >
                    Start Benchmark
                  </Button>
                )}
              </Group>
            </Stack>
          </Box>
        </Group>
      </FormProvider>
    </Modal>
  )
}
