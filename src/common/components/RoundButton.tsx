// RoundButton.tsx
import React from 'react'

export type RoundButtonProps = {
  testId?: string
  onClick?: () => void
  title?: string
  disabled?: boolean
  // ⬇️ hinzufügen:
  children?: React.ReactNode
}

const RoundButton: React.FC<RoundButtonProps> = ({
  testId,
  onClick,
  title,
  disabled,
  children, // ⬅️ hinzufügen
}) => {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="sn-icon-button"
    >
      {children} {/* ⬅️ rendern */}
    </button>
  )
}

export default RoundButton
