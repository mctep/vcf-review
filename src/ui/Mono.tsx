import { chakra, useRecipe, type HTMLChakraProps } from '@chakra-ui/react'

interface MonoProps extends HTMLChakraProps<'span'> {
  tone?: 'brand' | 'muted' | 'default'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

/** Genomic notation in JetBrains Mono (recipe: `monoNotation`). */
export function Mono({ tone, size, ...rest }: MonoProps) {
  const recipe = useRecipe({ key: 'monoNotation' })
  return <chakra.span css={recipe({ tone, size })} {...rest} />
}
