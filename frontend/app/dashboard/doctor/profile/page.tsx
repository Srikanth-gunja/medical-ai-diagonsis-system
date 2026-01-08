"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Stethoscope } from "lucide-react"
import Link from "next/link"

interface DoctorProfile {
    id: string;
    name: string;
    specialty: string;
    location: string;
    availability: string[];
    rating: number;
    image: string;
}

export default function DoctorProfilePage() {
    const { token, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        specialty: "",
        location: "",
        availability: ""
    })
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setProfile(data)
                    setFormData({
                        name: data.name || "",
                        specialty: data.specialty || "",
                        location: data.location || "",
                        availability: Array.isArray(data.availability) ? data.availability.join(", ") : ""
                    })
                }
            } catch (err) {
                console.error("Failed to fetch profile", err)
                setError("Failed to load profile")
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
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage("")
        setError("")

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    specialty: formData.specialty,
                    location: formData.location,
                    availability: formData.availability.split(',').map(s => s.trim()).filter(s => s)
                })
            })

            if (res.ok) {
                const data = await res.json()
                setMessage("Profile updated successfully!")
                if (data.profile) {
                    setProfile(data.profile)
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
                <Link href="/dashboard/doctor" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Stethoscope className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-foreground">Doctor Profile</CardTitle>
                            <CardDescription className="text-muted-foreground">Update your professional information.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Dr. John Doe"
                                    className="border-input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="specialty" className="text-foreground">Specialty</Label>
                                    <Input
                                        id="specialty"
                                        value={formData.specialty}
                                        onChange={handleChange}
                                        placeholder="Cardiology"
                                        className="border-input"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location" className="text-foreground">Location</Label>
                                    <Input
                                        id="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="New York, NY"
                                        className="border-input"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="availability" className="text-foreground">Availability (comma-separated)</Label>
                                <Input
                                    id="availability"
                                    value={formData.availability}
                                    onChange={handleChange}
                                    placeholder="Mon 9am-5pm, Wed 9am-12pm"
                                    className="border-input"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success text-success">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-3 rounded-lg badge-error bg-opacity-20 border border-destructive/20">
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
