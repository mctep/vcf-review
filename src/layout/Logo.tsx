import { Box, HStack, Text } from '@chakra-ui/react'
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
          <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
            <path
              d="M10 7c0 6 12 6 12 12s-12 6-12 6M22 7c0 6-12 6-12 12s12 6 12 6"
              stroke="currentColor"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M12 11h8M12 21h8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity=".8"
            />
          </svg>
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
