"use client"

import { useState, useCallback, useRef } from "react"
import type { ChatMessage } from "@/types"

interface UseChatOptions {
  onError?: (error: Error) => void
}

interface MessageContext {
  ad_account_id?: string
  ad_account_name?: string
}

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const pendingActionRef = useRef<string | null>(null)

  const sendMessage = useCallback(
    async (content: string, context?: MessageContext) => {
      // Se o usuário confirmou uma ação pendente, reenviar a ação original
      const isConfirmation = pendingActionRef.current &&
        ["confirmar", "confirm", "sim", "yes"].includes(content.toLowerCase().trim())

      const actualMessage = isConfirmation ? pendingActionRef.current! : content
      const displayContent = content

      // Limpar pending action ao confirmar ou ao enviar nova mensagem
      pendingActionRef.current = null

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: displayContent,
        timestamp: new Date(),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setIsLoading(true)

      const history = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      try {
        const messageToSend = isConfirmation
          ? `CONFIRMAR: ${actualMessage}`
          : actualMessage

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageToSend,
            ad_account_id: context?.ad_account_id,
            context: { history },
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to send message")
        }

        const data = await response.json()

        // Se a resposta requer confirmação, armazenar a ação pendente
        if (data.requires_confirmation && data.pending_action) {
          pendingActionRef.current = data.pending_action
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          agentType: data.agent_type,
          suggestions: data.suggestions,
          requiresConfirmation: data.requires_confirmation,
          pendingAction: data.pending_action,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        options?.onError?.(error as Error)

        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, options]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    pendingActionRef.current = null
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  }
}
