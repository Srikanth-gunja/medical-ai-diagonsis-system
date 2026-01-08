"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import Link from "next/link"
import { Loader2, Stethoscope, MapPin, Clock, X } from "lucide-react"

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function DoctorRegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        specialty: "",
        location: "",
        image: ""
    })
    const [availability, setAvailability] = useState<string[]>([])
    const [specialties, setSpecialties] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        // Fetch specialties from API
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/specialties`)
            .then(res => res.json())
            .then(data => {
                if (data.specialties) {
                    setSpecialties(data.specialties)
                }
            })
            .catch(err => console.error("Failed to fetch specialties", err))
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const toggleDay = (day: string) => {
        if (availability.includes(day)) {
            setAvailability(availability.filter(d => d !== day))
        } else {
            setAvailability([...availability, day])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        // Validate password strength
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long")
            setLoading(false)
            return
        }

        if (!/\d/.test(formData.password)) {
            setError("Password must contain at least one number")
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    role: 'doctor',
                    name: formData.name,
                    specialty: formData.specialty,
                    location: formData.location,
                    availability: availability.map(day => `${day} 9:00 AM - 5:00 PM`),
                    image: formData.image || undefined
                }),
            })

            const data = await res.json()
            if (res.ok) {
                router.push('/auth/login?registered=true')
            } else {
                setError(data.error || 'Registration failed. Please try again.')
            }
        } catch (err) {
            setError('Unable to connect to server. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
            {/* Decorative elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

            <Card className="w-full max-w-lg relative shadow-xl shadow-primary/5 border-0 bg-card/80 backdrop-blur">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 inline-flex rounded-full bg-primary/10 p-3">
                        <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Doctor Registration</CardTitle>
                    <CardDescription>Join our platform to help patients</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name (as displayed to patients)</Label>
                            <Input
                                id="name"
                                placeholder="Dr. John Smith"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="doctor@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Password fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className="h-11"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">Password must be 8+ characters with at least one number</p>

                        {/* Specialty */}
                        <div className="space-y-2">
                            <Label htmlFor="specialty">Specialty</Label>
                            <Select
                                id="specialty"
                                value={formData.specialty}
                                onChange={handleChange}
                                className="h-11"
                                required
                            >
                                <option value="">Select your specialty</option>
                                {specialties.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </Select>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Location
                            </Label>
                            <Input
                                id="location"
                                placeholder="City, State or Address"
                                value={formData.location}
                                onChange={handleChange}
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Availability */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Availability
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`px-3 py-1.5 text-sm rounded-full border transition-all ${availability.includes(day)
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-primary/50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                            }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500">Select the days you&apos;re available</p>
                        </div>

                        {/* Profile Image URL (optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="image">Profile Image URL (optional)</Label>
                            <Input
                                id="image"
                                type="url"
                                placeholder="https://example.com/your-photo.jpg"
                                value={formData.image}
                                onChange={handleChange}
                                className="h-11"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm dark:bg-red-900/20 dark:text-red-400">
                                {error}
                            </div>
                        )}

                        <Button className="w-full h-12 text-base" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Create Doctor Account
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t pt-6">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Are you a patient?{" "}
                        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                            Register as patient
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
