import { Bot, User, AlertTriangle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { ChatMessage as ChatMessageType } from "@/types"

interface ChatMessageProps {
  message: ChatMessageType
  onSuggestionClick?: (suggestion: string) => void
}

const agentLabels: Record<string, string> = {
  campaign_optimizer: "Otimizador",
  budget_advisor: "Consultor de Orçamento",
  performance_analyst: "Analista de Performance",
  "Confirmação Necessária": "Confirmação Necessária",
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isConfirmation = message.requiresConfirmation

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : isConfirmation
              ? "bg-amber-500 text-white"
              : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isConfirmation ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {!isUser && message.agentType && (
          <Badge
            variant={isConfirmation ? "destructive" : "secondary"}
            className="text-xs"
          >
            {agentLabels[message.agentType] || message.agentType}
          </Badge>
        )}

        <div
          className={cn(
            "rounded-xl px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground"
              : isConfirmation
                ? "border-2 border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                : "bg-card-subtle text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant={isConfirmation && index === 0 ? "destructive" : "outline"}
                className="cursor-pointer hover:bg-muted"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  )
}
