import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/copy-button"

type CodeBlockProps = {
  code: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

function CodeBlock({ 
  code, 
  language = "tsx", 
  filename,
  showLineNumbers = false,
  className 
}: CodeBlockProps) {
  const lines = code.trim().split("\n")

  return (
    <div className={cn("relative rounded-lg border bg-muted/30 overflow-hidden", className)}>
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <span className="text-xs font-mono text-muted-foreground">
            {filename || language}
          </span>
          <CopyButton content={code} className="h-7 px-2" />
        </div>
      )}
      {!filename && !language && (
        <CopyButton 
          content={code} 
          className="absolute top-2 right-2 h-7 px-2 z-10" 
        />
      )}
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="font-mono">
          {showLineNumbers ? (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="pr-4 text-right text-muted-foreground/50 select-none w-8 align-top">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre">{line || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            lines.map((line, i) => (
              <div key={i} className="hover:bg-muted/20 px-2 -mx-2">
                {line || " "}
              </div>
            ))
          )}
        </code>
      </pre>
    </div>
  )
}

export { CodeBlock }
