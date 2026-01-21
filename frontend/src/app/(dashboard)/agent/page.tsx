"use client"

import { useEffect, useRef } from "react"
import { Bot, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/features/chat/chat-message"
import { ChatInput } from "@/components/features/chat/chat-input"
import { useChat } from "@/hooks/use-chat"

const suggestions = [
  "Como está a performance das minhas campanhas?",
  "Qual a projeção de gasto para este mês?",
  "Quais campanhas devo otimizar?",
  "Compare a performance das campanhas ativas",
]

export default function AgentPage() {
  const { messages, isLoading, sendMessage } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Agente IA</h1>
        <p className="text-muted-foreground">
          Converse com o agente para obter insights e recomendações
        </p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5" />
            Assistente de Campanhas
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Como posso ajudar?
                </h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  Sou seu assistente especializado em campanhas Meta Ads. Posso
                  analisar performance, otimizar orçamentos e fornecer insights
                  valiosos.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full border bg-background px-4 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder="Pergunte sobre suas campanhas..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
