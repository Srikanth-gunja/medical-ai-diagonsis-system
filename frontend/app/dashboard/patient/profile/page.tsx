"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, User } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
    const { token, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: ""
    })
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setProfile({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        address: data.address || ""
                    })
                }
            } catch (err) {
                console.error("Failed to fetch profile", err)
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            if (token) {
                fetchProfile()
            } else {
                setLoading(false)
            }
        }
    }, [token, authLoading])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile({ ...profile, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage("")
        setError("")

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessage("Profile updated successfully!")
                if (data.profile) {
                    setProfile({
                        firstName: data.profile.firstName || "",
                        lastName: data.profile.lastName || "",
                        email: data.profile.email || "",
                        phone: data.profile.phone || "",
                        address: data.profile.address || ""
                    })
                }
                setTimeout(() => setMessage(""), 3000)
            } else {
                const data = await res.json()
                setError(data.error || "Failed to update profile")
            }
        } catch (err) {
            setError("Error updating profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-4">
                <Link href="/dashboard/patient" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>
            <Card className="bg-card border">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-foreground">My Profile</CardTitle>
                            <CardDescription>Update your personal information.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={profile.firstName}
                                        onChange={handleChange}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={profile.lastName}
                                        onChange={handleChange}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-foreground">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone" className="text-foreground">Phone</Label>
                                <Input
                                    id="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    placeholder="123-456-7890"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address" className="text-foreground">Address</Label>
                                <Input
                                    id="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    placeholder="123 Main St, City, State"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="mt-6 w-full" disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
