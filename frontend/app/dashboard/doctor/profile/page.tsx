"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Stethoscope, Calendar, Clock, ExternalLink } from "lucide-react"
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

interface DaySchedule {
    start: string;
    end: string;
    enabled: boolean;
}

interface Schedule {
    weeklySchedule: { [key: string]: DaySchedule };
    blockedDates: string[];
    slotDuration: number;
}

const DAY_LABELS: { [key: string]: string } = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
}

export default function DoctorProfilePage() {
    const { token, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [schedule, setSchedule] = useState<Schedule | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        specialty: "",
        location: ""
    })
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return

            try {
                // Fetch profile
                const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (profileRes.ok) {
                    const data = await profileRes.json()
                    setProfile(data)
                    setFormData({
                        name: data.name || "",
                        specialty: data.specialty || "",
                        location: data.location || ""
                    })
                }

                // Fetch schedule
                const scheduleRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schedules/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (scheduleRes.ok) {
                    const scheduleData = await scheduleRes.json()
                    setSchedule(scheduleData)
                }
            } catch (err) {
                console.error("Failed to fetch data", err)
                setError("Failed to load profile")
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            if (token) {
                fetchData()
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
                    location: formData.location
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

    // Format time from 24h to 12h
    const formatTime = (time: string) => {
        try {
            const [hours, minutes] = time.split(':')
            const h = parseInt(hours)
            const ampm = h >= 12 ? 'PM' : 'AM'
            const hour12 = h % 12 || 12
            return `${hour12}:${minutes} ${ampm}`
        } catch {
            return time
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="mb-4">
                <Link href="/dashboard/doctor" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Dashboard
                </Link>
            </div>

            {/* Profile Information Card */}
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

            {/* Schedule/Availability Card */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-foreground">Availability Schedule</CardTitle>
                                <CardDescription className="text-muted-foreground">Your working hours as shown to patients</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/doctor/schedule" className="gap-2">
                                Edit Schedule <ExternalLink className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {schedule?.weeklySchedule ? (
                        <div className="space-y-2">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                const daySchedule = schedule.weeklySchedule[day]
                                if (!daySchedule?.enabled) return null
                                return (
                                    <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                        <span className="font-medium text-foreground">{DAY_LABELS[day]}</span>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                            {Object.values(schedule.weeklySchedule).every(d => !d.enabled) && (
                                <p className="text-muted-foreground text-center py-4">No working days set</p>
                            )}
                            {schedule.slotDuration && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground">
                                        Appointment Duration: <span className="font-medium text-foreground">{schedule.slotDuration} minutes</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-muted-foreground mb-4">No schedule configured yet</p>
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/doctor/schedule">Configure Schedule</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

