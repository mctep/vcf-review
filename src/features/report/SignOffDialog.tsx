import { Button, Checkbox, Dialog, Portal, Stack, Text } from '@chakra-ui/react'
import { PenLine } from 'lucide-react'
import { useState } from 'react'
import { CURRENT_USER } from '../../domain/case/factory'
import type { CaseMetadata, MetadataOrigin } from '../../domain/types'

const SOURCE: Record<MetadataOrigin, string> = {
  lims: 'from LIMS',
  user: 'entered manually',
  vcf: 'from VCF',
}

/** Final expert approval. Locks the report and creates version 1.0. */
export function SignOffDialog({
  disabled,
  reason,
  metadata: m,
  onSign,
}: {
  disabled: boolean
  reason?: string
  metadata: CaseMetadata
  onSign: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [contextConfirmed, setContextConfirmed] = useState(false)
  const source = (o?: MetadataOrigin) => (o ? ` (${SOURCE[o]})` : '')
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => (setOpen(e.open), setConfirmed(false), setContextConfirmed(false))}
    >
      <Dialog.Trigger asChild>
        <Button colorPalette="brand" disabled={disabled} title={reason}>
          <PenLine /> Sign & release
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Sign and release report</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4" fontSize="sm">
                <Text color="fg.muted">
                  Signing creates version 1.0, locks variant selection and text, and records the signature in
                  the audit log.
                </Text>
                {/* Interpretation inputs may have been pre-filled automatically — a person confirms them here. */}
                <Checkbox.Root
                  checked={contextConfirmed}
                  onCheckedChange={(e) => setContextConfirmed(!!e.checked)}
                  alignItems="flex-start"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control mt="0.5" />
                  <Checkbox.Label>
                    The interpretation context is correct: tumor type{' '}
                    <b>
                      {m.tumorType?.name} ({m.tumorType?.code})
                    </b>
                    {source(m.origin.tumorType)} and tumor content <b>{m.tumorContent}%</b>
                    {source(m.origin.tumorContent)}.
                  </Checkbox.Label>
                </Checkbox.Root>
                <Checkbox.Root
                  checked={confirmed}
                  onCheckedChange={(e) => setConfirmed(!!e.checked)}
                  alignItems="flex-start"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control mt="0.5" />
                  <Checkbox.Label>
                    I, {CURRENT_USER}, have reviewed every included variant and the report text, and approve
                    this report for clinical release.
                  </Checkbox.Label>
                </Checkbox.Root>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="ghost">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                disabled={!confirmed || !contextConfirmed}
                onClick={() => {
                  onSign()
                  setOpen(false)
                }}
              >
                Sign report
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
