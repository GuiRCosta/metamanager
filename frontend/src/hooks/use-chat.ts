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

const CONFIRMATION_WORDS = ["confirmar", "confirm", "sim", "yes"]

export function useChat(options?: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const pendingActionRef = useRef<string | null>(null)

  const sendMessage = useCallback(
    async (content: string, context?: MessageContext) => {
      const contentLower = content.toLowerCase().trim()
      const hasPendingAction = pendingActionRef.current !== null
      const isConfirmation = hasPendingAction && CONFIRMATION_WORDS.includes(contentLower)
      const isCancellation = hasPendingAction && !isConfirmation

      // Capturar a ação pendente antes de limpar
      const pendingAction = isConfirmation ? pendingActionRef.current : null

      // Só limpar pending action se cancelou (enviou outra mensagem não-confirmatória)
      if (isCancellation) {
        pendingActionRef.current = null
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
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
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            ad_account_id: context?.ad_account_id,
            context: { history },
            // Enviar ação pendente explicitamente quando confirmando
            confirmed_action: pendingAction,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to send message")
        }

        const data = await response.json()

        // Limpar pending action após confirmação bem-sucedida
        if (isConfirmation) {
          pendingActionRef.current = null
        }

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
