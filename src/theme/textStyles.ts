import { defineTextStyles } from '@chakra-ui/react'

export const textStyles = defineTextStyles({
  /** Hero numbers and empty-state headlines. */
  display: {
    value: { fontSize: 'display', fontWeight: '800', letterSpacing: 'display', lineHeight: '1.06' },
  },
  /** Page title, e.g. "Case 4f2a…". */
  h1: {
    value: {
      fontSize: { base: '2xl', md: '3xl' },
      fontWeight: '800',
      letterSpacing: 'title',
      lineHeight: '1.1',
    },
  },
  /** Card / section title. */
  h2: { value: { fontSize: 'xl', fontWeight: '800', letterSpacing: 'heading', lineHeight: '1.3' } },
  /** Small heading inside panels. */
  h3: { value: { fontSize: 'md', fontWeight: '700', letterSpacing: 'heading', lineHeight: '1.4' } },
  /** Uppercase label above sections and nav groups. */
  eyebrow: {
    value: {
      fontSize: 'xs',
      fontWeight: '700',
      letterSpacing: 'eyebrow',
      textTransform: 'uppercase',
      lineHeight: '1rem',
    },
  },
  /** Uppercase title of a detail section ("CLASSIFICATIONS"). */
  sectionTitle: {
    value: {
      fontSize: 'sm',
      fontWeight: '700',
      letterSpacing: 'caps',
      textTransform: 'uppercase',
      lineHeight: '1.25rem',
    },
  },
  /** Uppercase row label inside key/value lists ("ONCOGENICITY"). */
  label: {
    value: { fontSize: 'sm', fontWeight: '500', letterSpacing: 'caps', textTransform: 'uppercase' },
  },
  body: { value: { fontSize: 'sm', lineHeight: '1.65' } },
  bodyLg: { value: { fontSize: 'md', lineHeight: '1.75' } },
  /** Genomic notation, coordinates, transcripts. */
  mono: { value: { fontFamily: 'mono', fontSize: 'sm', letterSpacing: '-0.01em' } },
  monoSm: { value: { fontFamily: 'mono', fontSize: 'xs', letterSpacing: '-0.01em' } },
  caption: { value: { fontSize: 'xs', lineHeight: '1.4' } },
})
