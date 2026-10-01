"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils" // use @ pra não quebrar o path

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded border border-white/20 bg-white/5 shadow-xs transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-[#FFD700] focus-visible:border-[#FFD700]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#CF0921] data-[state=checked]:to-[#FFD700] data-[state=checked]:border-transparent",
        "data-[state=checked]:text-black",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
