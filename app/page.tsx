"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Send, Loader2, Edit, Copy, Download, SettingsIcon, PlusCircle, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar } from "@/components/sidebar"
import { Settings } from "@/components/settings"
import { generateEmailContent, generateMarketingImage } from "@/app/actions"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { setItem, getItem, deleteItem } from "@/utils/db"
import { MessageType, ConversationType, ConversationProps } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

const Conversation: React.FC<ConversationProps> = ({
  conversation,
  onSelect,
  onDelete,
  isActive,
}) => {
  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(conversation);
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const content = conversation.messages.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}${msg.imageUrl ? '\nImage: ' + msg.imageUrl : ''}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${conversation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          onClick={() => onSelect(conversation)}
          className={`p-4 cursor-pointer border-b hover:bg-accent transition-colors ${
            isActive ? "bg-accent" : ""
          }`}
        >
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground truncate">
                {conversation.messages[0]?.content.substring(0, 30)}...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(conversation.createdAt).toLocaleDateString()}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Save Chat
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Save Chat
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Chat
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default function MarketingGenerator() {
  const [conversations, setConversations] = useState<ConversationType[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationType | null>(null)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [textPrompt, setTextPrompt] = useState("")
  const [imagePrompt, setImagePrompt] = useState("")
  const [isEditingText, setIsEditingText] = useState(false)
  const [isEditingImage, setIsEditingImage] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [textModel, setTextModel] = useState("amazon.titan-text-lite-v1")
  const [imageModel, setImageModel] = useState("amazon.titan-image-generator-v1")
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedConversations = await getItem<ConversationType[]>("conversations")
        const savedTextModel = await getItem<string>("textModel")
        const savedImageModel = await getItem<string>("imageModel")
        
        if (savedConversations) {
          setConversations(savedConversations)
        }
        if (savedTextModel) {
          setTextModel(savedTextModel)
        }
        if (savedImageModel) {
          setImageModel(savedImageModel)
        }
      } catch (error) {
        console.error("Error loading initial data:", error)
      }
    }
    
    loadInitialData()
  }, [])

  useEffect(() => {
    if (conversations.length > 0) {
      setItem("conversations", conversations).catch(error => 
        console.error("Error saving conversations:", error)
      )
    }
  }, [conversations])

  useEffect(() => {
    setItem("textModel", textModel).catch(error => 
      console.error("Error saving text model:", error)
    )
  }, [textModel])

  useEffect(() => {
    setItem("imageModel", imageModel).catch(error => 
      console.error("Error saving image model:", error)
    )
  }, [imageModel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage: MessageType = { role: "user", content: input }
    let updatedConversation: ConversationType

    if (currentConversation) {
      updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, newMessage],
      }
      setCurrentConversation(updatedConversation)
    } else {
      updatedConversation = {
        id: Date.now().toString(),
        messages: [newMessage],
        createdAt: new Date(),
      }
      setCurrentConversation(updatedConversation)
      setConversations((prev) => [updatedConversation, ...prev])
    }

    setIsLoading(true)
    setTextPrompt(input)
    setImagePrompt(input)
    setInput("")

    try {
      const [emailContent, imageUrl] = await Promise.all([
        generateEmailContent(input, textModel),
        generateMarketingImage(input, imageModel)
      ])

      const assistantMessage: MessageType = {
        role: "assistant",
        content: emailContent,
        imageUrl: imageUrl
      }
      
      const updatedMessages = [...updatedConversation.messages, assistantMessage]
      const finalConversation: ConversationType = {
        ...updatedConversation,
        messages: updatedMessages
      }
      
      setCurrentConversation(finalConversation)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === finalConversation.id ? finalConversation : conv
        )
      )
    } catch (error) {
      console.error("Error generating content:", error)
      const errorMessage: MessageType = {
        role: "assistant",
        content: "Sorry, there was an error generating your content. Please try again."
      }
      
      const updatedMessages = [...updatedConversation.messages, errorMessage]
      const finalConversation: ConversationType = {
        ...updatedConversation,
        messages: updatedMessages
      }
      
      setCurrentConversation(finalConversation)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === finalConversation.id ? finalConversation : conv
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSubmit = async (type: "text" | "image") => {
    if (!currentConversation) return

    setIsLoading(true)
    try {
      if (type === "text") {
        const emailContent = await generateEmailContent(textPrompt, textModel)
        const updatedMessages = [...currentConversation.messages]
        updatedMessages[updatedMessages.length - 1] = {
          ...updatedMessages[updatedMessages.length - 1],
          content: emailContent,
        }
        setCurrentConversation({ ...currentConversation, messages: updatedMessages })
        setIsEditingText(false)
      } else {
        const imageUrl = await generateMarketingImage(imagePrompt, imageModel)
        const updatedMessages = [...currentConversation.messages]
        updatedMessages[updatedMessages.length - 1] = {
          ...updatedMessages[updatedMessages.length - 1],
          imageUrl: imageUrl,
        }
        setCurrentConversation({ ...currentConversation, messages: updatedMessages })
        setIsEditingImage(false)
      }
    } catch (error) {
      console.error("Error regenerating content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setCurrentConversation(null)
    setInput("")
    setTextPrompt("")
    setImagePrompt("")
  }

  const handleSelectConversation = (conversation: ConversationType) => {
    setCurrentConversation(conversation)
  }

  const handleDeleteConversation = async (conversation: ConversationType) => {
    try {
      // Delete from IndexedDB
      await deleteItem('conversations', conversation.id);
      
      // Update local state
      const updatedConversations = conversations.filter(c => c.id !== conversation.id);
      setConversations(updatedConversations);
      
      // If current conversation is deleted, clear it
      if (currentConversation?.id === conversation.id) {
        setCurrentConversation(null);
        setInput('');
      }
      
      // Update the conversations list in IndexedDB
      await setItem('conversationsList', updatedConversations);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCopyImage = (imageUrl: string) => {
    // This is a simplified version. In a real app, you'd need to fetch the image and create a Blob
    navigator.clipboard.writeText(imageUrl)
  }

  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = "marketing-image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">Marketing Assistant</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          <div className="p-4">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start"
              variant="outline"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>
          
          <div className="space-y-2 px-2">
            {conversations.map((conversation) => (
              <Conversation
                key={conversation.id}
                conversation={conversation}
                onSelect={handleSelectConversation}
                onDelete={handleDeleteConversation}
                isActive={currentConversation?.id === conversation.id}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-foreground">Chat</h1>
            {currentConversation && (
              <span className="text-sm text-muted-foreground">
                {new Date(currentConversation.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {currentConversation?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-start gap-3 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
                      {message.role === "user" ? "U" : "A"}
                    </div>
                    <div className={`rounded-lg p-4 ${
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card border shadow-sm"
                    }`}>
                      {message.role === "assistant" && message.imageUrl && (
                        <div className="mb-4">
                          <img
                            src={message.imageUrl}
                            alt="Generated marketing image"
                            className="w-full h-auto rounded-lg"
                          />
                          <div className="flex mt-2 space-x-2 flex-wrap gap-y-2">
                            <Button variant="outline" size="sm" onClick={() => setIsEditingImage(true)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleCopyImage(message.imageUrl!)}>
                              <Copy className="w-4 h-4 mr-2" /> Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownloadImage(message.imageUrl!)}>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className={`prose prose-sm max-w-none ${message.role === "assistant" ? "text-foreground" : "prose-invert"}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      {message.role === "assistant" && (
                        <div className="flex mt-2 space-x-2 flex-wrap gap-y-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditingText(true)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCopyText(message.content)}>
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-card border shadow-sm rounded-lg p-4 text-foreground">
                      Generating response...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-card">
            <div className="max-w-3xl mx-auto p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={isEditingText} onOpenChange={setIsEditingText}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Text Prompt</DialogTitle>
          </DialogHeader>
          <Textarea
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Edit your text prompt here..."
            rows={5}
          />
          <Button onClick={() => handleEditSubmit("text")} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Regenerate Text
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingImage} onOpenChange={setIsEditingImage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Prompt</DialogTitle>
          </DialogHeader>
          <Textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Edit your image prompt here..."
            rows={5}
          />
          <Button onClick={() => handleEditSubmit("image")} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Regenerate Image
          </Button>
        </DialogContent>
      </Dialog>

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        textModel={textModel}
        imageModel={imageModel}
        onTextModelChange={setTextModel}
        onImageModelChange={setImageModel}
      />
    </div>
  )
}
