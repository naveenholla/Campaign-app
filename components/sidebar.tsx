import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"

type ConversationType = {
  id: string
  messages: { role: string; content: string }[]
  createdAt: Date
}

type SidebarProps = {
  conversations: ConversationType[]
  currentConversation: ConversationType | null
  onSelectConversation: (conversation: ConversationType) => void
  onNewChat: () => void
}

export function Sidebar({ conversations, currentConversation, onSelectConversation, onNewChat }: SidebarProps) {
  return (
    <div className="w-64 bg-secondary p-4 flex flex-col h-screen">
      <Button onClick={onNewChat} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> New Chat
      </Button>
      <ScrollArea className="flex-1">
        {conversations.map((conversation) => (
          <Button
            key={conversation.id}
            variant={currentConversation?.id === conversation.id ? "secondary" : "ghost"}
            className="w-full justify-start mb-2"
            onClick={() => onSelectConversation(conversation)}
          >
            {conversation.messages[0].content.slice(0, 20)}...
          </Button>
        ))}
      </ScrollArea>
    </div>
  )
}

