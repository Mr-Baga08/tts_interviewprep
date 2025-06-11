import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean
  }
>(({ className, required, children, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(
        error && "text-destructive",
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// Enhanced FormItem with better layout options
interface FormItemLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  layout?: 'vertical' | 'horizontal'
  labelWidth?: string
}

const FormItemLayout = React.forwardRef<HTMLDivElement, FormItemLayoutProps>(
  ({ className, layout = 'vertical', labelWidth = '120px', children, ...props }, ref) => {
    if (layout === 'horizontal') {
      return (
        <div 
          ref={ref} 
          className={cn("flex items-start space-x-4", className)} 
          {...props}
        >
          <div style={{ width: labelWidth, flexShrink: 0 }}>
            {React.Children.toArray(children).find(
              child => React.isValidElement(child) && child.type === FormLabel
            )}
          </div>
          <div className="flex-1 space-y-2">
            {React.Children.toArray(children).filter(
              child => React.isValidElement(child) && child.type !== FormLabel
            )}
          </div>
        </div>
      )
    }

    return (
      <FormItem ref={ref} className={className} {...props}>
        {children}
      </FormItem>
    )
  }
)
FormItemLayout.displayName = "FormItemLayout"

// Form group for organizing related fields
const FormGroup = React.forwardRef<
  HTMLFieldSetElement,
  React.HTMLAttributes<HTMLFieldSetElement> & {
    title?: string
    description?: string
  }
>(({ className, title, description, children, ...props }, ref) => {
  return (
    <fieldset
      ref={ref}
      className={cn("space-y-6 rounded-lg border p-4", className)}
      {...props}
    >
      {title && (
        <legend className="text-lg font-semibold text-foreground px-2">
          {title}
        </legend>
      )}
      {description && (
        <p className="text-sm text-muted-foreground -mt-2">
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  )
})
FormGroup.displayName = "FormGroup"

// Form section for larger forms
interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, collapsible = false, defaultOpen = true, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div className="space-y-1">
          {collapsible ? (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex w-full items-center justify-between text-left"
            >
              <h3 className="text-lg font-semibold">{title}</h3>
              <span className="text-muted-foreground">
                {isOpen ? '−' : '+'}
              </span>
            </button>
          ) : (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        {(!collapsible || isOpen) && (
          <div className="space-y-4">
            {children}
          </div>
        )}
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

// Form buttons container
const FormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right' | 'between'
    sticky?: boolean
  }
>(({ className, align = 'right', sticky = false, ...props }, ref) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 pt-6",
        alignClasses[align],
        sticky && "sticky bottom-0 bg-background border-t py-4 -mx-6 px-6 mt-8",
        className
      )}
      {...props}
    />
  )
})
FormActions.displayName = "FormActions"

// Submit button with loading state
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ loading, loadingText = "Submitting...", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="submit"
        disabled={disabled || loading}
        {...props}
      >
        {loading ? loadingText : children}
      </button>
    )
  }
)
SubmitButton.displayName = "SubmitButton"

// Error summary component
interface FormErrorSummaryProps {
  errors: Record<string, any>
  className?: string
}

const FormErrorSummary = ({ errors, className }: FormErrorSummaryProps) => {
  const errorList = Object.entries(errors).filter(([, error]) => error?.message)

  if (errorList.length === 0) return null

  return (
    <div className={cn(
      "rounded-md border border-destructive/50 bg-destructive/10 p-4",
      className
    )}>
      <h4 className="text-sm font-medium text-destructive mb-2">
        Please fix the following errors:
      </h4>
      <ul className="list-disc list-inside space-y-1">
        {errorList.map(([field, error]) => (
          <li key={field} className="text-sm text-destructive">
            {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Form progress indicator
interface FormProgressProps {
  currentStep: number
  totalSteps: number
  steps?: string[]
  className?: string
}

const FormProgress = ({ currentStep, totalSteps, steps, className }: FormProgressProps) => {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {steps && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((step, index) => (
            <span
              key={index}
              className={cn(
                index < currentStep && "text-primary font-medium",
                index === currentStep - 1 && "text-foreground font-medium"
              )}
            >
              {step}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormItemLayout,
  FormGroup,
  FormSection,
  FormActions,
  SubmitButton,
  FormErrorSummary,
  FormProgress,
}