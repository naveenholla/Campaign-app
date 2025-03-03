"use client"

import type React from "react"

import { useState } from "react"
import { Send, Loader2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { generateEmailContent, generateMarketingImage } from "@/app/actions"

type MessageType = {
  role: "user" | "assistant"
  content: string
  imageUrl?: string
}

export default function MarketingGenerator() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [textPrompt, setTextPrompt] = useState("")
  const [imagePrompt, setImagePrompt] = useState("")
  const [isEditingText, setIsEditingText] = useState(false)
  const [isEditingImage, setIsEditingImage] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setMessages((prev) => [...prev, { role: "user", content: input }])
    setIsLoading(true)
    setTextPrompt(input)
    setImagePrompt(input)

    try {
      const [emailContent, imageUrl] = await Promise.all([generateEmailContent(input), generateMarketingImage(input)])

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: emailContent,
          imageUrl: imageUrl,
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error generating your content. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

  const handleEditSubmit = async (type: "text" | "image") => {
    setIsLoading(true)
    try {
      if (type === "text") {
        const emailContent = await generateEmailContent(textPrompt)
        setMessages((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], content: emailContent }])
        setIsEditingText(false)
      } else {
        const imageUrl = await generateMarketingImage(imagePrompt)
        setMessages((prev) => [...prev.slice(0, -1), { ...prev[prev.length - 1], imageUrl: imageUrl }])
        setIsEditingImage(false)
      }
    } catch (error) {
      console.error("Error regenerating content:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <header className="py-4 border-b">
        <h1 className="text-2xl font-bold text-center">Marketing Campaign Generator</h1>
        <p className="text-center text-muted-foreground">Generate email content and images using Amazon Bedrock</p>
      </header>

      <div className="flex-1 overflow-auto py-4 space-y-4">
        {messages.map((message, index) => (
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
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsEditingImage(true)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Image Prompt
                    </Button>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.role === "assistant" && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsEditingText(true)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Text Prompt
                  </Button>
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
    </div>
  )
}

