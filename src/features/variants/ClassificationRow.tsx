import { Collapsible, createSlotRecipeContext, type HTMLChakraProps } from '@chakra-ui/react'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { InfoTip } from '../../ui'

const { withProvider, withContext } = createSlotRecipeContext({ key: 'classificationRow' })
const Row = {
  Root: withProvider<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'root'),
  Header: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'header'),
  Label: withContext<HTMLSpanElement, HTMLChakraProps<'span'>>('span', 'label'),
  Value: withContext<HTMLSpanElement, HTMLChakraProps<'span'>>('span', 'value'),
  Trigger: withContext<HTMLButtonElement, HTMLChakraProps<'button'>>('button', 'trigger'),
  Content: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'content'),
}

interface Props {
  label: string
  value: ReactNode
  info: ReactNode
  triggerLabel?: string
  children?: ReactNode
}

/** "ONCOGENICITY  [VUS] ⓘ  ⌄ Show criteria" with an expandable explanation. */
export function ClassificationRow({ label, value, info, triggerLabel, children }: Props) {
  return (
    <Collapsible.Root asChild>
      <Row.Root>
        <Row.Header>
          <Row.Label>{label}</Row.Label>
          <Row.Value>
            {value}
            <InfoTip content={info} label={`About ${label.toLowerCase()}`} />
          </Row.Value>
          {children && triggerLabel && (
            <Collapsible.Trigger asChild>
              <Row.Trigger>
                <ChevronDown />
                {triggerLabel}
              </Row.Trigger>
            </Collapsible.Trigger>
          )}
        </Row.Header>
        {children && (
          <Collapsible.Content>
            <Row.Content>{children}</Row.Content>
          </Collapsible.Content>
        )}
      </Row.Root>
    </Collapsible.Root>
  )
}
