import { ConversationType } from "@/types"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface SidebarProps {
  conversations: ConversationType[]
  currentConversation: ConversationType | null
  onSelectConversation: (conversation: ConversationType) => void
  onDeleteConversation: (conversation: ConversationType) => void
  onNewChat: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  currentConversation,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
}) => {
  return (
    <div className="w-64 bg-muted/50 h-screen p-4 flex flex-col">
      <Button
        onClick={onNewChat}
        className="w-full mb-4"
        variant="outline"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        New Chat
      </Button>
      <div className="flex-1 overflow-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 cursor-pointer border-b hover:bg-muted ${
              currentConversation?.id === conversation.id ? "bg-muted" : ""
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <p className="font-medium">
              {conversation.messages[0]?.content.substring(0, 30)}...
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(conversation.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
