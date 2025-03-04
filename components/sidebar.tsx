import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Download, Trash2 } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

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
  onDeleteConversation: (conversation: ConversationType) => void
}

export function Sidebar({ 
  conversations, 
  currentConversation, 
  onSelectConversation, 
  onNewChat,
  onDeleteConversation 
}: SidebarProps) {
  const handleDownloadConversation = (conversation: ConversationType) => {
    const conversationData = JSON.stringify(conversation, null, 2)
    const blob = new Blob([conversationData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conversation-${conversation.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-64 bg-secondary p-4 flex flex-col h-screen">
      <Button onClick={onNewChat} className="mb-4">
        <Plus className="mr-2 h-4 w-4" /> New Chat
      </Button>
      <ScrollArea className="flex-1">
        {conversations.map((conversation) => (
          <ContextMenu key={conversation.id}>
            <ContextMenuTrigger asChild>
              <Button
                variant={currentConversation?.id === conversation.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-2"
                onClick={() => onSelectConversation(conversation)}
              >
                {conversation.messages[0].content.slice(0, 20)}...
              </Button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleDownloadConversation(conversation)}>
                <Download className="mr-2 h-4 w-4" />
                Download Conversation
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDeleteConversation(conversation)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Conversation
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </ScrollArea>
    </div>
  )
}

