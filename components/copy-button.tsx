"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

type CopyButtonProps = React.ComponentProps<"button"> & {
  content: string
  onCopied?: () => void
}

function CopyButton({ content, onCopied, className, ...props }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [content, onCopied])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
        "bg-muted/50 hover:bg-muted border border-border/50 hover:border-border",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-1",
        copied && "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        className
      )}
      {...props}
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export { CopyButton }
