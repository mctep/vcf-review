import { Badge, Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { FileCheck2, FileJson, FlaskConical, UploadCloud } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import {
  checkInputFile,
  detectInputFormat,
  formatBytes,
  INPUT_FORMAT_LABEL,
} from '../../domain/upload/fileRules'
import type { VcfSource } from '../../domain/types'
import { IconTile } from '../../ui/IconTile'

const SAMPLE: VcfSource = { kind: 'local', fileName: 'S26-1201_nsclc-demo.vcf', sizeBytes: 1313 }
const SAMPLE_EXPORT: VcfSource = {
  kind: 'local',
  fileName: 'S26-1220_lung_case-export.json',
  sizeBytes: 412_000,
}

interface Props {
  value: VcfSource | null
  onChange: (source: VcfSource | null) => void
}

/**
 * Drag & drop or browse for a local VCF or analysis platform export.
 * The file content is never read in the prototype; the format is detected from the file name.
 */
export function LocalDropzone({ value, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accept = (file: File | undefined) => {
    if (!file) return
    const check = checkInputFile(file.name, file.size)
    if (!check.ok) {
      setError(check.reason)
      onChange(null)
      return
    }
    setError(null)
    onChange({ kind: 'local', fileName: file.name, sizeBytes: file.size })
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    accept(e.dataTransfer.files[0])
  }

  return (
    <Stack gap="3">
      <Box
        asChild
        layerStyle="glass"
        borderRadius="l3"
        borderStyle="dashed"
        borderWidth="2px"
        borderColor={dragging ? 'brand.solid' : error ? 'red.emphasized' : 'border.emphasized'}
        bg={dragging ? 'brand.subtle' : undefined}
        p={{ base: '6', md: '10' }}
        textAlign="center"
        cursor="pointer"
        transition="border-color 120ms, background 120ms"
        _hover={{ borderColor: 'brand.solid' }}
        _focusWithin={{ outline: '2px solid', outlineColor: 'brand.focusRing', outlineOffset: '2px' }}
        onDragOver={(e: DragEvent) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <label htmlFor="vcf-input">
          <input
            id="vcf-input"
            ref={input}
            type="file"
            accept=".vcf,.gz,.json,.xml"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
            onChange={(e) => accept(e.target.files?.[0])}
          />
          <Stack align="center" gap="3">
            <IconTile boxSize="12">{value ? <FileCheck2 /> : <UploadCloud />}</IconTile>
            {value?.kind === 'local' ? (
              <>
                <Text fontWeight="700">{value.fileName}</Text>
                <HStack gap="2" fontSize="sm" color="fg.muted">
                  <FormatBadge fileName={value.fileName} />
                  <Text>{formatBytes(value.sizeBytes)} · ready to create a case</Text>
                </HStack>
              </>
            ) : (
              <>
                <Text fontWeight="700">Drop a file here or click to browse</Text>
                <Text fontSize="sm" color="fg.muted">
                  VCF (.vcf, .vcf.gz) of a single tumor sample, or a case export from an analysis platform
                  (.json, .xml)
                </Text>
              </>
            )}
            {error && (
              <Text fontSize="sm" color="red.fg" role="alert">
                {error}
              </Text>
            )}
          </Stack>
        </label>
      </Box>
      <HStack gap="3" justify="center" fontSize="sm" color="fg.muted" flexWrap="wrap">
        <Text>No file at hand?</Text>
        <Button size="xs" variant="outline" onClick={() => (setError(null), onChange(SAMPLE))}>
          <FlaskConical /> Use sample VCF
        </Button>
        <Button size="xs" variant="outline" onClick={() => (setError(null), onChange(SAMPLE_EXPORT))}>
          <FileJson /> Use sample export
        </Button>
        <Button size="xs" variant="ghostLink" asChild>
          <a href={`${import.meta.env.BASE_URL}samples/nsclc-demo.vcf`} download>
            Download sample VCF
          </a>
        </Button>
      </HStack>
    </Stack>
  )
}

/** "VCF" or "Analysis platform export", detected from the file name. */
export function FormatBadge({ fileName }: { fileName: string }) {
  const format = detectInputFormat(fileName)
  if (!format) return null
  return (
    <Badge size="sm" variant="subtle" colorPalette={format === 'vcf' ? 'aqua' : 'accent'}>
      {INPUT_FORMAT_LABEL[format]}
    </Badge>
  )
}
