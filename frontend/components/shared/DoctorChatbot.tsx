"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageCircle, X, Send, Loader2, Trash2, Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp?: string
}

export function DoctorChatbot() {
    const { token } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [error, setError] = useState("")
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Load chat history when opened
    useEffect(() => {
        if (isOpen && token) {
            loadChatHistory()
        }
    }, [isOpen, token])

    const loadChatHistory = async () => {
        if (!token) return

        setIsLoadingHistory(true)
        try {
            const res = await fetch('http://localhost:5000/api/chatbot/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                if (data.history && Array.isArray(data.history)) {
                    setMessages(data.history)
                }
            }
        } catch (err) {
            console.error("Failed to load chat history", err)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const sendMessage = async () => {
        if (!inputMessage.trim() || !token || isLoading) return

        const userMessage = inputMessage.trim()
        setInputMessage("")
        setError("")

        // Add user message to UI immediately
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setIsLoading(true)

        try {
            const res = await fetch('http://localhost:5000/api/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: userMessage })
            })

            const data = await res.json()

            if (res.ok && data.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
            } else {
                setError(data.error || "Failed to get response")
                // Remove the user message if there was an error
                setMessages(prev => prev.slice(0, -1))
            }
        } catch (err) {
            console.error("Failed to send message", err)
            setError("Network error. Please try again.")
            // Remove the user message if there was an error
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setIsLoading(false)
        }
    }

    const clearHistory = async () => {
        if (!token) return

        try {
            const res = await fetch('http://localhost:5000/api/chatbot/history', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.ok) {
                setMessages([])
            }
        } catch (err) {
            console.error("Failed to clear history", err)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    if (!token) return null

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-110 group"
                    aria-label="Open AI Doctor Assistant"
                >
                    <MessageCircle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5 animate-pulse">
                        AI
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[550px] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-border">
                    <Card className="flex flex-col h-full bg-card border-0">
                        {/* Header */}
                        <CardHeader className="bg-primary text-primary-foreground px-4 py-3 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-foreground/20 rounded-full p-2">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">AI Doctor Assistant</CardTitle>
                                        <CardDescription className="text-white/80 text-xs">
                                            Describe your symptoms for recommendations
                                        </CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearHistory}
                                        className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                                        title="Clear chat history"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsOpen(false)}
                                        className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Messages */}
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                    <div className="bg-primary/10 rounded-full p-4 mb-4">
                                        <Bot className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-2">
                                        How can I help you today?
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Describe your symptoms and I&apos;ll recommend the best doctors for you.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex-shrink-0 rounded-full p-1.5 ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                                            </div>
                                            <div className={`rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-md'
                                                : 'bg-card text-card-foreground border border-border rounded-tl-md'
                                                }`}>
                                                {msg.role === 'assistant' ? (
                                                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-strong:text-inherit">
                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-muted rounded-full p-1.5">
                                            <Bot className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </CardContent>

                        {/* Error message */}
                        {error && (
                            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Input */}
                        <div className="border-t border-border p-3 bg-card flex-shrink-0">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Describe your symptoms..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isLoading}
                                    className="flex-1 border-input focus:ring-primary"
                                />
                                <Button
                                    onClick={sendMessage}
                                    disabled={isLoading || !inputMessage.trim()}
                                    className="bg-primary hover:bg-primary/90 px-3"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    )
}
