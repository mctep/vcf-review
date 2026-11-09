import { Combobox, HStack, Portal, Text, useFilter, useListCollection } from '@chakra-ui/react'
import type { TumorType } from '../../domain/types'
import { ONCOTREE } from '../../mocks/oncotree'
import { Mono } from '../../ui'

interface Props {
  value?: TumorType
  onChange: (value: TumorType | undefined) => void
  invalid?: boolean
  disabled?: boolean
  /** Extra attributes for the search input (e.g. a focus target marker). */
  inputProps?: Record<string, string>
}

/** Tumor type picker backed by a local OncoTree subset (structured, codes drive evidence levels). */
export function OncoTreeCombobox({ value, onChange, invalid, disabled, inputProps }: Props) {
  const { contains } = useFilter({ sensitivity: 'base' })
  const { collection, filter } = useListCollection({
    initialItems: ONCOTREE,
    itemToString: (t) => `${t.name} (${t.code})`,
    itemToValue: (t) => t.code,
    filter: (itemText, query) => contains(itemText, query),
  })

  return (
    <Combobox.Root
      collection={collection}
      value={value ? [value.code] : []}
      defaultInputValue={value ? `${value.name} (${value.code})` : ''}
      onInputValueChange={(e) => filter(e.inputValue)}
      onValueChange={(e) => onChange(ONCOTREE.find((t) => t.code === e.value[0]))}
      invalid={invalid}
      disabled={disabled}
      openOnClick
    >
      <Combobox.Control>
        <Combobox.Input placeholder="Search OncoTree, e.g. lung adenocarcinoma or LUAD" {...inputProps} />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content maxH="18rem">
            <Combobox.Empty>No tumor types found</Combobox.Empty>
            {collection.items.map((t) => (
              <Combobox.Item item={t} key={t.code}>
                <HStack justify="space-between" w="full" gap="3">
                  <Text>
                    {t.name}{' '}
                    <Text as="span" color="fg.subtle" fontSize="xs">
                      {t.tissue}
                    </Text>
                  </Text>
                  <Mono tone="muted" size="xs">
                    {t.code}
                  </Mono>
                </HStack>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  )
}
