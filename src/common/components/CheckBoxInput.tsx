import React from 'react'

type CheckBoxInputProps = {
  checked?: boolean
  disabled?: boolean
  testId?: string
  onChange?: (event: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * Superfeine, quadratische Checkbox:
 * - 11x11 px, leicht abgerundet
 * - Border als SVG für echte Subpixel-Präzision (1.6 px)
 * - Haken steht alleine, wenn aktiv
 */
export const CheckBoxInput: React.FC<CheckBoxInputProps> = ({
  checked = false,
  disabled = false,
  testId,
  onChange,
}) => {
  return (
    <div
      data-testid={testId}
      onClick={(e) => {
        if (!disabled && onChange) onChange(e)
      }}
      style={{
        width: '11px',
        height: '11px',
        minWidth: '11px',
        minHeight: '11px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.15s ease, opacity 0.2s ease',
        position: 'relative',
        lineHeight: 0,
      }}
    >
      {/* 🟪 SVG-Quadrat als Border */}
      {!checked && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 11 11"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: '3px',
            overflow: 'visible',
          }}
        >
          <rect
            x="0.8"
            y="0.8"
            width="9.4"
            height="9.4"
            rx="2"
            ry="2"
            stroke="var(--sn-stylekit-foreground-color)"
            strokeWidth="1.6"
            fill="none"
          />
        </svg>
      )}

      {/* 🟣 Lila Haken */}
      <svg
        width="9"
        height="7"
        viewBox="0 0 10 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          stroke: checked ? '#b366ff' : 'transparent',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          transition: 'stroke 0.25s ease, transform 0.2s ease',
          transform: checked ? 'scale(1)' : 'scale(0.4)',
        }}
      >
        <polyline points="1 4.3 3.8 7 9 1" />
      </svg>

      {/* ✨ Puls-Effekt */}
      {checked && (
        <div
          style={{
            position: 'absolute',
            width: '13px',
            height: '13px',
            borderRadius: '50%',
            background: 'rgba(179, 102, 255, 0.25)',
            animation: 'checkbox-pulse 0.35s ease-out forwards',
            zIndex: -1,
          }}
        />
      )}

      <style>
        {`
          @keyframes checkbox-pulse {
            0% { transform: scale(0.6); opacity: 0.9; }
            100% { transform: scale(1.3); opacity: 0; }
          }
        `}
      </style>
    </div>
  )
}
