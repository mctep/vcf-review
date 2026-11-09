import { Box, type BoxProps } from '@chakra-ui/react'

/** Square gradient tile behind an icon (layer style: `iconTile`). */
export const IconTile = (props: BoxProps) => (
  <Box
    layerStyle="iconTile"
    display="inline-flex"
    alignItems="center"
    justifyContent="center"
    boxSize="10"
    flexShrink={0}
    {...props}
  />
)
