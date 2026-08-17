import * as Select from "@radix-ui/react-select"
import { CaretDown, CaretUp, Check } from "@phosphor-icons/react"
import type { ReactNode } from "react"

export type AppSelectOption = {
  value: string
  label: string
  description?: string
  icon?: ReactNode
}

export function AppSelect({ value, options, onValueChange, id, ariaLabel, placeholder, disabled = false, compact = false, className = "" }: {
  value: string
  options: AppSelectOption[]
  onValueChange(value: string): void
  id?: string
  ariaLabel?: string
  placeholder?: string
  disabled?: boolean
  compact?: boolean
  className?: string
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger id={id} className={`app-select-trigger ${compact ? "compact" : ""} ${className}`.trim()} aria-label={ariaLabel}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="app-select-caret"><CaretDown size={14} weight="bold" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="app-select-content" position="popper" sideOffset={6} collisionPadding={12}>
          <Select.ScrollUpButton className="app-select-scroll"><CaretUp size={14} /></Select.ScrollUpButton>
          <Select.Viewport className="app-select-viewport">
            {options.map((option) => (
              <Select.Item className="app-select-item" key={option.value} value={option.value}>
                <span className="app-select-item-icon">{option.icon}</span>
                <span className="app-select-item-copy">
                  <Select.ItemText>{option.label}</Select.ItemText>
                  {option.description && <small>{option.description}</small>}
                </span>
                <Select.ItemIndicator className="app-select-check"><Check size={14} weight="bold" /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="app-select-scroll"><CaretDown size={14} /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
