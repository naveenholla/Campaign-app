"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Send, Loader2, Edit, Copy, Download, SettingsIcon } from "lucide-react"
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

type MessageType = {
  role: "user" | "assistant"
  content: string
  imageUrl?: string
}

type ConversationType = {
  id: string
  messages: MessageType[]
  createdAt: Date
}

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
    const savedConversations = localStorage.getItem("conversations")
    const savedTextModel = localStorage.getItem("textModel")
    const savedImageModel = localStorage.getItem("imageModel")
    
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations))
    }
    if (savedTextModel) {
      setTextModel(savedTextModel)
    }
    if (savedImageModel) {
      setImageModel(savedImageModel)
    }
  }, [])

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("conversations", JSON.stringify(conversations))
    }
  }, [conversations])

  useEffect(() => {
    localStorage.setItem("textModel", textModel)
  }, [textModel])

  useEffect(() => {
    localStorage.setItem("imageModel", imageModel)
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
        imageUrl: imageUrl,
      }

      updatedConversation.messages.push(assistantMessage)
      setCurrentConversation({ ...updatedConversation })
      setConversations((prev) => prev.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv)))
    } catch (error) {
      const errorMessage: MessageType = {
        role: "assistant",
        content: "Sorry, there was an error generating your content. Please try again.",
      }
      updatedConversation.messages.push(errorMessage)
      setCurrentConversation({ ...updatedConversation })
      setConversations((prev) => prev.map((conv) => (conv.id === updatedConversation.id ? updatedConversation : conv)))
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

  const handleDeleteConversation = (conversationToDelete: ConversationType) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationToDelete.id))
    if (currentConversation?.id === conversationToDelete.id) {
      setCurrentConversation(null)
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
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={setCurrentConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex flex-col flex-1 h-screen max-w-4xl mx-auto p-4">
        <header className="py-4 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold">Marketing Campaign Generator</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <SettingsIcon className="h-5 w-5" />
          </Button>
        </header>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          {currentConversation?.messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <CardContent className="p-4">
                  {message.role === "assistant" && message.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={message.imageUrl || "/placeholder.svg"}
                        alt="Generated marketing image"
                        className="w-full h-auto rounded-md"
                      />
                      <div className="flex mt-2 space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditingImage(true)}>
                          <Edit className="w-4 h-4 mr-2" /> Edit Prompt
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
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                  {message.role === "assistant" && (
                    <div className="flex mt-2 space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingText(true)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Prompt
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopyText(message.content)}>
                        <Copy className="w-4 h-4 mr-2" /> Copy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-center">
              <Card className="max-w-[80%] bg-muted">
                <CardContent className="p-4 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p>Generating marketing campaign content...</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your marketing campaign..."
              className="flex-1"
              disabled={isLoading}
            />

            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
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
    </div>
  )
}

