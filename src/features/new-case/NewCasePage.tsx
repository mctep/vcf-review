import { Box, Button, Flex, HStack, List, Stack, Tabs, Text } from '@chakra-ui/react'
import { ArrowRight, Cloud, Laptop } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { formatBytes } from '../../domain/upload/fileRules'
import type { VcfSource } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { Eyebrow, GlassCard, PageTitle } from '../../ui'
import { FormatBadge, LocalDropzone } from './LocalDropzone'
import { FileBrowser } from './remote/FileBrowser'

export function NewCasePage() {
  const [tab, setTab] = useState<'local' | 'remote'>('local')
  const [local, setLocal] = useState<VcfSource | null>(null)
  const [remote, setRemote] = useState<VcfSource | null>(null)
  const createCase = useCaseStore((s) => s.createCase)
  const navigate = useNavigate()
  const source = tab === 'local' ? local : remote

  const create = () => {
    if (!source) return
    const id = createCase(source)
    navigate(`/case/${id}/details`)
  }

  return (
    <Stack gap="6" maxW="72rem">
      <Stack gap="1">
        <Eyebrow>New case</Eyebrow>
        <PageTitle>Choose an input file</PageTitle>
        <Text color="fg.muted" maxW="48rem">
          Start from a <b>VCF</b> — annotation, filtering and ranking run here — or from a <b>case export</b>{' '}
          of the analysis platform you already use: its variants are already annotated and ranked, and tumor
          type and tumor content usually come with it, so no LIMS connection is needed. The case is created as
          soon as you pick a file.
        </Text>
      </Stack>

      <Tabs.Root
        value={tab}
        onValueChange={(e) => setTab(e.value as 'local' | 'remote')}
        variant="enclosed"
        lazyMount
      >
        <Tabs.List>
          <Tabs.Trigger value="local">
            <Laptop size={16} /> Local file
          </Tabs.Trigger>
          <Tabs.Trigger value="remote">
            <Cloud size={16} /> Remote file
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="local">
          <LocalDropzone value={local} onChange={setLocal} />
        </Tabs.Content>
        <Tabs.Content value="remote">
          <FileBrowser value={remote} onChange={setRemote} />
        </Tabs.Content>
      </Tabs.Root>

      <Flex
        gap="4"
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        position="sticky"
        bottom="0"
        py="3"
        bg="bg.panel"
        borderTopWidth="1px"
        borderColor="border"
      >
        <HStack gap="2" minW="0">
          {source && <FormatBadge fileName={source.fileName} />}
          <Text fontSize="sm" color={source ? 'fg' : 'fg.subtle'} wordBreak="break-all">
            {source
              ? `${source.kind === 'local' ? source.fileName : source.fullPath} · ${formatBytes(source.sizeBytes)}`
              : 'No file selected'}
          </Text>
        </HStack>
        <Button colorPalette="brand" disabled={!source} onClick={create}>
          Create case <ArrowRight />
        </Button>
      </Flex>

      <GlassCard.Root size="sm">
        <GlassCard.AccentBar />
        <GlassCard.Eyebrow>What happens next</GlassCard.Eyebrow>
        <List.Root as="ol" gap="1" fontSize="sm" color="fg.muted" ps="4">
          <List.Item>The file is uploaded (or fetched from storage) and validated.</List.Item>
          <List.Item>
            <b>VCF:</b> variants are annotated, filtered and ranked, and the test order is fetched from the
            LIMS (tumor type mapped from the diagnosis code, tumor content from the pathology record).
          </List.Item>
          <List.Item>
            <b>Platform export:</b> ranked variants and the case context are imported as they are. The LIMS is
            optional.
          </List.Item>
          <List.Item>
            AI interpretation starts as soon as <b>tumor type</b> and <b>tumor content</b> are known. Missing
            or ambiguous values wait for you — you can enter them right away.
          </List.Item>
          <List.Item>You review, select variants and sign the report.</List.Item>
        </List.Root>
        <HStack gap="2" fontSize="xs" color="fg.subtle">
          <Box as="span">Demo tip:</Box>
          <Text>
            add <code>?fail=annotation</code> to the URL to simulate a failing step.
          </Text>
        </HStack>
      </GlassCard.Root>
    </Stack>
  )
}
