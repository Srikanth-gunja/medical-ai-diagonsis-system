"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Loader2, Heart } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()
            if (res.ok) {
                login(data.access_token, { id: data.id, role: data.role })
            } else {
                setError(data.error || 'Invalid email or password')
            }
        } catch (err) {
            setError('Unable to connect to server. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

            <Card className="w-full max-w-md relative shadow-xl shadow-primary/5 border-0 bg-card/80 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3">
                        <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
                    <CardDescription className="text-muted-foreground">Sign in to access your medical dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 border-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-12 border-input"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <Button className="w-full h-12 text-base" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                            Create one
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
