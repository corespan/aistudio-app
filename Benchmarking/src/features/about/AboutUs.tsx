import { Container, Stack } from '@mantine/core'
import { PageShell } from '@/app/layout/PageShell'
import { AboutHero } from './components/AboutHero'
import { PlatformEvolutionTimeline } from './components/PlatformEvolutionTimeline'

export const AboutUs = () => (
  <PageShell>
    <Container fluid pt="sm" px="sm" pb="xl">
      <Stack gap="xl">
        <AboutHero />
        <PlatformEvolutionTimeline />
      </Stack>
    </Container>
  </PageShell>
)
