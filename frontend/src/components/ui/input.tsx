import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-9 px-3 py-2",
        lg: "h-11 px-4 py-2",
      },
      variant: {
        default: "",
        ghost: "border-0 bg-transparent",
        filled: "bg-muted border-transparent",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, variant, startIcon, endIcon, clearable, onClear, ...props }, ref) => {
    const hasIcons = startIcon || endIcon || clearable

    return (
      <div className="relative">
        {startIcon && (
          <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
            {startIcon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ size, variant }),
            startIcon && "pl-9",
            (endIcon || clearable) && "pr-9",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {clearable && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {endIcon && !clearable && (
          <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
            {endIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// Password Input Component
interface PasswordInputProps extends Omit<InputProps, 'type' | 'endIcon'> {
  showPasswordToggle?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPasswordToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? "text" : "password"}
        endIcon={
          showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          ) : undefined
        }
      />
    )
  }
)
PasswordInput.displayName = "PasswordInput"

// Search Input Component
interface SearchInputProps extends Omit<InputProps, 'startIcon' | 'type'> {
  onSearch?: (value: string) => void
  debounceMs?: number
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, debounceMs = 300, clearable = true, ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || "")
    
    React.useEffect(() => {
      if (onSearch && debounceMs > 0) {
        const timer = setTimeout(() => {
          onSearch(value as string)
        }, debounceMs)
        
        return () => clearTimeout(timer)
      }
    }, [value, onSearch, debounceMs])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      props.onChange?.(e)
      
      if (onSearch && debounceMs === 0) {
        onSearch(newValue)
      }
    }

    const handleClear = () => {
      setValue("")
      onSearch?.("")
      props.onClear?.()
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="search"
        value={value}
        onChange={handleChange}
        startIcon={<Search className="h-4 w-4" />}
        clearable={clearable}
        onClear={handleClear}
        data-search-input
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

// Textarea Component
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  resize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, resize = true, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !resize && "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

// Auto-resize Textarea
interface AutoResizeTextareaProps extends TextareaProps {
  minRows?: number
  maxRows?: number
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ minRows = 3, maxRows = 10, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>()
    const combinedRef = React.useMemo(
      () => ref || textareaRef,
      [ref]
    ) as React.RefObject<HTMLTextAreaElement>

    const adjustHeight = React.useCallback(() => {
      const textarea = combinedRef.current
      if (!textarea) return

      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight)
      const minHeight = lineHeight * minRows
      const maxHeight = lineHeight * maxRows

      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
    }, [combinedRef, minRows, maxRows])

    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])

    return (
      <Textarea
        {...props}
        ref={combinedRef}
        resize={false}
        onChange={(e) => {
          props.onChange?.(e)
          adjustHeight()
        }}
        style={{
          minHeight: `${minRows * 1.5}rem`,
          maxHeight: `${maxRows * 1.5}rem`,
          ...props.style,
        }}
      />
    )
  }
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

// File Input Component
interface FileInputProps extends Omit<InputProps, 'type'> {
  accept?: string
  multiple?: boolean
  onFileSelect?: (files: FileList | null) => void
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ onFileSelect, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelect?.(e.target.files)
      props.onChange?.(e)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="file"
        onChange={handleChange}
      />
    )
  }
)
FileInput.displayName = "FileInput"

// Number Input with increment/decrement buttons
interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number
  max?: number
  step?: number
  showControls?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ min, max, step = 1, showControls = true, ...props }, ref) => {
    const [value, setValue] = React.useState(Number(props.value) || 0)

    const increment = () => {
      const newValue = value + step
      if (max === undefined || newValue <= max) {
        setValue(newValue)
        props.onChange?.({
          target: { value: newValue.toString() }
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }

    const decrement = () => {
      const newValue = value - step
      if (min === undefined || newValue >= min) {
        setValue(newValue)
        props.onChange?.({
          target: { value: newValue.toString() }
        } as React.ChangeEvent<HTMLInputElement>)
      }
    }

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            setValue(Number(e.target.value))
            props.onChange?.(e)
          }}
          className={cn(
            showControls && "pr-16",
            props.className
          )}
        />
        
        {showControls && (
          <div className="absolute right-1 top-1 flex flex-col">
            <button
              type="button"
              onClick={increment}
              disabled={max !== undefined && value >= max}
              className="h-4 px-2 text-xs hover:bg-muted disabled:opacity-50"
            >
              +
            </button>
            <button
              type="button"
              onClick={decrement}
              disabled={min !== undefined && value <= min}
              className="h-4 px-2 text-xs hover:bg-muted disabled:opacity-50"
            >
              -
            </button>
          </div>
        )}
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { 
  Input, 
  PasswordInput, 
  SearchInput, 
  Textarea, 
  AutoResizeTextarea, 
  FileInput, 
  NumberInput,
  inputVariants 
}