import {
  Box,
  Checkbox,
  createSlotRecipeContext,
  HStack,
  NativeSelect,
  Text,
  type HTMLChakraProps,
  type RecipeVariantProps,
} from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { FLAG_LABEL, ONCOGENICITY_LABEL, ONCOGENICITY_PALETTE, tierRank } from '../../domain/labels'
import type { Case, Variant } from '../../domain/types'
import { useCaseStore } from '../../store/caseStore'
import { variantListItemRecipe } from '../../theme/slotRecipes/variantListItem'
import { Mono } from '../../ui'

const { withProvider, withContext } = createSlotRecipeContext({ key: 'variantListItem' })
const Item = {
  Root: withProvider<
    HTMLDivElement,
    HTMLChakraProps<'div'> & RecipeVariantProps<typeof variantListItemRecipe>
  >('div', 'root'),
  Control: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'control'),
  Body: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'body'),
  Title: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'title'),
  Meta: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'meta'),
  Dot: withContext<HTMLSpanElement, HTMLChakraProps<'span'>>('span', 'dot'),
}

type Sort = 'rank' | 'gene' | 'tier'

export function VariantNotation({ v, size = 'sm' }: { v: Variant; size?: 'sm' | 'lg' }) {
  return (
    <>
      <Text as="span" fontWeight="700">
        {v.gene}
      </Text>
      <Mono size={size}>{v.notation}</Mono>
    </>
  )
}

interface Props {
  c: Case
  activeId: string
  onActivate: (id: string) => void
}

/** Ranked variant list. Checkbox = include in report; click = open details. */
export function VariantList({ c, activeId, onActivate }: Props) {
  const [sort, setSort] = useState<Sort>('rank')
  const toggle = useCaseStore((s) => s.toggleVariant)
  const setSelection = useCaseStore((s) => s.setSelection)
  const locked = c.report.status === 'signed'

  const variants = useMemo(() => {
    const list = [...c.variants]
    if (sort === 'gene') list.sort((a, b) => a.gene.localeCompare(b.gene))
    if (sort === 'tier') list.sort((a, b) => tierRank(a.tier) - tierRank(b.tier))
    return list
  }, [c.variants, sort])

  const all = c.selected.length === c.variants.length
  const some = c.selected.length > 0 && !all

  return (
    <Box layerStyle="card" overflow="hidden" alignSelf="start" position={{ lg: 'sticky' }} top={{ lg: '4' }}>
      <HStack justify="space-between" px="3" py="2.5" gap="3" borderBottomWidth="1px" borderColor="border">
        <Text textStyle="eyebrow" color="fg.muted">
          Variants · {c.variants.length}
        </Text>
        <NativeSelect.Root size="sm" maxW="9rem">
          <NativeSelect.Field
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort variants"
          >
            <option value="rank">Ranking</option>
            <option value="tier">Tier</option>
            <option value="gene">Gene name</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>

      <HStack
        justify="space-between"
        px="3"
        py="2"
        borderBottomWidth="1px"
        borderColor="border"
        fontSize="sm"
      >
        <Checkbox.Root
          size="sm"
          checked={all ? true : some ? 'indeterminate' : false}
          disabled={locked}
          onCheckedChange={() => setSelection(c.id, all ? [] : c.variants.map((v) => v.id))}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Select all</Checkbox.Label>
        </Checkbox.Root>
        <Text color="fg.muted" fontSize="xs">
          {c.selected.length} in report
        </Text>
      </HStack>

      {c.funnel && (
        <Text
          px="3"
          py="1.5"
          fontSize="xs"
          color="fg.subtle"
          bg="bg.subtle"
          borderBottomWidth="1px"
          borderColor="border"
        >
          {c.funnel.total.toLocaleString('en')} called → {c.funnel.passQc} pass QC → {c.funnel.reportable}{' '}
          reportable
        </Text>
      )}

      <Box role="listbox" aria-label="Variants">
        {variants.map((v) => {
          const active = v.id === activeId
          return (
            <Item.Root
              key={v.id}
              selected={active}
              role="option"
              aria-selected={active}
              tabIndex={0}
              onClick={() => onActivate(v.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onActivate(v.id)
              }}
            >
              <Item.Control onClick={(e) => e.stopPropagation()}>
                <Checkbox.Root
                  size="sm"
                  checked={c.selected.includes(v.id)}
                  disabled={locked}
                  onCheckedChange={() => toggle(c.id, v.id)}
                  aria-label={`Include ${v.gene} ${v.notation} in report`}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Item.Control>
              <Item.Body>
                <Item.Title>
                  <VariantNotation v={v} />
                </Item.Title>
                <Item.Meta colorPalette={ONCOGENICITY_PALETTE[v.oncogenicity]}>
                  <Item.Dot />
                  {ONCOGENICITY_LABEL[v.oncogenicity]}
                  <Text as="span" color="fg.subtle">
                    ·
                  </Text>
                  <Text
                    as="span"
                    color={v.tier === 'I' ? 'tier1.fg' : undefined}
                    fontWeight={v.tier === 'I' ? '600' : undefined}
                  >
                    Tier {v.tier === 'III' || v.tier === 'IV' ? v.tier : v.tierLevel}
                  </Text>
                </Item.Meta>
                {v.flags.length > 0 && (
                  <Text fontSize="2xs" color="accent.fg" fontWeight="600">
                    {v.flags.map((f) => FLAG_LABEL[f]).join(' · ')}
                  </Text>
                )}
              </Item.Body>
            </Item.Root>
          )
        })}
      </Box>
    </Box>
  )
}
