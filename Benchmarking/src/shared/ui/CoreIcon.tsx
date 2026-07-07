import { cloneElement, isValidElement, ReactElement } from 'react'
import { Flex } from '@mantine/core'

type CoreIconProps = {
  icon: ReactElement
  size?: number
  color?: string
  stroke?: number
  className?: string
}

export const CoreIcon = ({ icon, size = 16, color, stroke }: CoreIconProps) => {
  if (!isValidElement(icon)) return null

  const isTabler = (icon.type as any)?.displayName?.startsWith('Icon')
  const defaultStroke = isTabler ? 1.5 : 2
  const finalStroke = stroke ?? defaultStroke

  return (
    <Flex c={color}>
      {cloneElement(icon, {
        size,
        strokeWidth: finalStroke,
        ...(isTabler ? { stroke: finalStroke } : {}),
      } as any)}
    </Flex>
  )
}
