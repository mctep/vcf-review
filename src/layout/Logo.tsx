import { Box, HStack, Text } from '@chakra-ui/react'
import { Dna } from 'lucide-react'
import { Link } from 'react-router'

/** Neutral product mark: gradient tile + wordmark. */
export function Logo() {
  return (
    <HStack
      asChild
      gap="2.5"
      px="3"
      py="1"
      borderRadius="l2"
      _focusVisible={{ outline: '2px solid', outlineColor: 'brand.focusRing' }}
    >
      <Link to="/" aria-label="VCF Review home">
        <Box
          as="span"
          boxSize="8"
          borderRadius="l2"
          bgImage="logoTile"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          flexShrink={0}
        >
          <Dna size={20} strokeWidth={2.2} aria-hidden />
        </Box>
        <Text fontWeight="800" fontSize="lg" letterSpacing="heading" lineHeight="1">
          vcf
          <Text as="span" color="brand.fg">
            review
          </Text>
        </Text>
      </Link>
    </HStack>
  )
}
