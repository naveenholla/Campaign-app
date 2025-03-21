export type MessageType = {
  role: "user" | "assistant"
  content: string
  imageUrl?: string
}

export type ConversationType = {
  id: string
  messages: MessageType[]
  createdAt: Date
}

export interface ConversationProps {
  conversation: ConversationType
  onSelect: (conversation: ConversationType) => void
  onDelete: (conversation: ConversationType) => void
  isActive: boolean
}
