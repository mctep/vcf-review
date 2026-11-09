import { Heading, Text, type HeadingProps, type TextProps } from '@chakra-ui/react'

/** Uppercase brand label above sections, nav groups and cards. */
export const Eyebrow = (props: TextProps) => <Text textStyle="eyebrow" color="brand.fg" {...props} />

/** Uppercase title of a detail section, e.g. "CLASSIFICATIONS". */
export const SectionTitle = (props: HeadingProps) => (
  <Heading as="h3" textStyle="sectionTitle" color="brand.fg" {...props} />
)

/** Page title, e.g. "Case 4f2a…". */
export const PageTitle = (props: HeadingProps) => <Heading as="h1" textStyle="h1" {...props} />

/** Gradient text — use at most once per screen. */
export const Highlight = (props: TextProps) => (
  <Text as="span" bgImage="highlightText" bgClip="text" color="transparent" {...props} />
)
