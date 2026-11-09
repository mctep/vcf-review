import { createSlotRecipeContext, type HTMLChakraProps, type RecipeVariantProps } from '@chakra-ui/react'
import { glassCardRecipe } from '../theme/slotRecipes/glassCard'

const { withProvider, withContext } = createSlotRecipeContext({ key: 'glassCard' })

type Variants = RecipeVariantProps<typeof glassCardRecipe>

/**
 * Marketing-style translucent card.
 * @example
 * <GlassCard.Root size="md"><GlassCard.AccentBar /><GlassCard.Eyebrow>Today</GlassCard.Eyebrow>…</GlassCard.Root>
 */
export const GlassCard = {
  Root: withProvider<HTMLDivElement, HTMLChakraProps<'div'> & Variants>('div', 'root'),
  AccentBar: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'accentBar'),
  Eyebrow: withContext<HTMLParagraphElement, HTMLChakraProps<'p'>>('p', 'eyebrow'),
  Title: withContext<HTMLHeadingElement, HTMLChakraProps<'h3'>>('h3', 'title'),
  Body: withContext<HTMLDivElement, HTMLChakraProps<'div'>>('div', 'body'),
}
