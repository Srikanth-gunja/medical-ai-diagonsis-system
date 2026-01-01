"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { DoctorChatbot } from "@/components/shared/DoctorChatbot"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Calendar, MapPin, Star, X, Loader2, Clock, CheckCircle, FileText, User, MessageSquare, Send, Search, Filter, XCircle } from "lucide-react"
import Link from "next/link"

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    location: string;
    availability: string[];
    image: string;
    rating: number;
    rating_count: number;
    isAvailable?: boolean;
    availabilityStatus?: string;
}

interface Appointment {
    id: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: string;
    symptoms: string;
    rated?: boolean;
}

interface ChatMessage {
    id: string;
    appointmentId: string;
    senderId: string;
    senderRole: 'doctor' | 'patient';
    content: string;
    createdAt: string;
    read: boolean;
}

const TIME_SLOTS = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
]

export default function PatientDashboard() {
    const { user, token, isLoading: authLoading } = useAuth()
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    // Booking modal state
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [bookingDate, setBookingDate] = useState("")
    const [bookingTime, setBookingTime] = useState("")
    const [bookingSymptoms, setBookingSymptoms] = useState("")
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const [bookingError, setBookingError] = useState("")

    // Chat state
    const [showChatModal, setShowChatModal] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [sendingMessage, setSendingMessage] = useState(false)
    const chatPollInterval = useRef<NodeJS.Timeout | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Rating state
    const [showRatingModal, setShowRatingModal] = useState(false)
    const [ratingAppointment, setRatingAppointment] = useState<Appointment | null>(null)
    const [ratingScore, setRatingScore] = useState(0)
    const [ratingHover, setRatingHover] = useState(0)
    const [ratingComment, setRatingComment] = useState("")
    const [ratingLoading, setRatingLoading] = useState(false)

    // Revoke state
    const [revokingId, setRevokingId] = useState<string | null>(null)

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSpecialty, setSelectedSpecialty] = useState('')
    const [minRating, setMinRating] = useState(0)
    const [sortBy, setSortBy] = useState<'name' | 'rating'>('rating')

    useEffect(() => {
        fetch('http://localhost:5000/api/doctors/')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDoctors(data)
                }
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!token) return
            try {
                const res = await fetch('http://localhost:5000/api/appointments/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data)) {
                        setAppointments(data)
                    }
                }
            } catch (err) {
                console.error("Failed to fetch appointments", err)
            }
        }

        if (!authLoading && token) {
            fetchAppointments()
        }
    }, [token, authLoading])

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // Poll for new messages when chat is open
    useEffect(() => {
        if (showChatModal && selectedAppointment && token) {
            const pollMessages = async () => {
                try {
                    const res = await fetch(`http://localhost:5000/api/messages/${selectedAppointment.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setChatMessages(data)
                    }
                } catch (err) {
                    console.error("Failed to fetch messages", err)
                }
            }

            pollMessages()
            chatPollInterval.current = setInterval(pollMessages, 2000) // Poll every 2 seconds

            return () => {
                if (chatPollInterval.current) {
                    clearInterval(chatPollInterval.current)
                }
            }
        }
    }, [showChatModal, selectedAppointment, token])

    const openBookingModal = (doctor: Doctor) => {
        setSelectedDoctor(doctor)
        setBookingDate("")
        setBookingTime("")
        setBookingSymptoms("")
        setBookingSuccess(false)
        setBookingError("")
        setShowBookingModal(true)
    }

    const handleBookAppointment = async () => {
        if (!selectedDoctor || !bookingDate || !bookingTime || !token) {
            setBookingError("Please fill in all required fields")
            return
        }

        setBookingLoading(true)
        setBookingError("")

        try {
            const res = await fetch('http://localhost:5000/api/appointments/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    doctorId: selectedDoctor.id,
                    doctorName: selectedDoctor.name,
                    date: bookingDate,
                    time: bookingTime,
                    symptoms: bookingSymptoms
                })
            })

            if (res.ok) {
                const newAppt = await res.json()
                setAppointments(prev => [...prev, newAppt])
                setBookingSuccess(true)
                setTimeout(() => {
                    setShowBookingModal(false)
                    setBookingSuccess(false)
                }, 2000)
            } else {
                const data = await res.json()
                setBookingError(data.error || "Failed to book appointment")
            }
        } catch (error) {
            console.error("Failed to book appointment", error)
            setBookingError("Network error. Please try again.")
        } finally {
            setBookingLoading(false)
        }
    }

    const openChat = (appointment: Appointment) => {
        setSelectedAppointment(appointment)
        setChatMessages([])
        setShowChatModal(true)
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedAppointment || !token) return

        setSendingMessage(true)
        try {
            const res = await fetch(`http://localhost:5000/api/messages/${selectedAppointment.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newMessage })
            })

            if (res.ok) {
                const msg = await res.json()
                setChatMessages(prev => [...prev, msg])
                setNewMessage("")
            }
        } catch (err) {
            console.error("Failed to send message", err)
        } finally {
            setSendingMessage(false)
        }
    }

    const getMinDate = () => {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'badge-success'
            case 'cancelled':
                return 'badge-error'
            case 'completed':
                return 'badge-info'
            default:
                return 'badge-warning'
        }
    }

    const isChatAvailable = (appt: Appointment): { available: boolean; message: string } => {
        // Chat only available for confirmed appointments during appointment time
        if (appt.status !== 'confirmed') {
            return { available: false, message: 'Chat only available for confirmed appointments' }
        }

        const now = new Date()
        const apptDate = appt.date // Format: "YYYY-MM-DD"
        const apptTime = appt.time // Format: "H:MM AM/PM"

        // Parse appointment datetime
        const [time, period] = apptTime.split(' ')
        const [hourStr, minuteStr] = time.split(':')
        let hour = parseInt(hourStr)
        const minute = parseInt(minuteStr)

        if (period?.toUpperCase() === 'PM' && hour !== 12) {
            hour += 12
        } else if (period?.toUpperCase() === 'AM' && hour === 12) {
            hour = 0
        }

        const apptDateTime = new Date(`${apptDate}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`)
        const endTime = new Date(apptDateTime.getTime() + 30 * 60 * 1000) // 30-minute window

        if (now < apptDateTime) {
            return {
                available: false,
                message: `Chat available from ${apptDateTime.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`
            }
        } else if (now > endTime) {
            return { available: false, message: 'Appointment time has ended' }
        }

        return { available: true, message: '' }
    }

    const handleRevokeAppointment = async (apptId: string) => {
        if (!token) return

        setRevokingId(apptId)
        try {
            const res = await fetch(`http://localhost:5000/api/appointments/${apptId}/revoke`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.ok) {
                setAppointments(prev =>
                    prev.map(appt =>
                        appt.id === apptId ? { ...appt, status: 'cancelled' } : appt
                    )
                )
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to revoke appointment')
            }
        } catch (err) {
            console.error("Failed to revoke appointment", err)
            alert('Failed to revoke appointment')
        } finally {
            setRevokingId(null)
        }
    }

    const openRatingModal = (appointment: Appointment) => {
        setRatingAppointment(appointment)
        setRatingScore(0)
        setRatingHover(0)
        setRatingComment("")
        setShowRatingModal(true)
    }

    const submitRating = async () => {
        if (!ratingAppointment || !token || ratingScore === 0) return

        setRatingLoading(true)
        try {
            const res = await fetch('http://localhost:5000/api/ratings/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointmentId: ratingAppointment.id,
                    score: ratingScore,
                    comment: ratingComment
                })
            })

            if (res.ok) {
                // Update appointment to mark as rated in local state
                setAppointments(prev => prev.map(appt =>
                    appt.id === ratingAppointment.id ? { ...appt, rated: true } : appt
                ))
                setShowRatingModal(false)
                // Refresh doctors to update ratings
                fetch('http://localhost:5000/api/doctors/')
                    .then(r => r.json())
                    .then(data => { if (Array.isArray(data)) setDoctors(data) })
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to submit rating')
            }
        } catch (err) {
            console.error("Failed to submit rating", err)
        } finally {
            setRatingLoading(false)
        }
    }

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Get unique specialties from doctors
    const specialties = [...new Set(doctors.map(d => d.specialty))].sort()

    // Filter and sort doctors
    const filteredDoctors = doctors
        .filter(doctor => {
            const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doctor.location.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty
            const matchesRating = doctor.rating >= minRating
            return matchesSearch && matchesSpecialty && matchesRating
        })
        .sort((a, b) => {
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
            return a.name.localeCompare(b.name)
        })

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Patient Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your health and appointments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-border" asChild>
                        <Link href="/dashboard/patient/history">
                            <FileText className="h-4 w-4" />
                            Medical History
                        </Link>
                    </Button>
                    <Button variant="outline" className="gap-2 border-border" asChild>
                        <Link href="/dashboard/patient/profile">
                            <User className="h-4 w-4" />
                            My Profile
                        </Link>
                    </Button>
                </div>
            </div>

            {/* My Appointments Section */}
            {appointments.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">My Appointments</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {appointments.map((appt) => (
                            <Card key={appt.id} className={`border-l-4 bg-muted/30 border-border ${appt.status === 'completed' ? 'border-l-blue-500' : 'border-l-primary'
                                }`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-foreground">{appt.doctorName}</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(appt.status)}`}>
                                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {appt.date} at {appt.time}
                                    </div>
                                    {appt.symptoms && (
                                        <p className="text-sm mt-2">
                                            <span className="text-muted-foreground">Symptoms:</span>{" "}
                                            <span className="text-foreground">{appt.symptoms}</span>
                                        </p>
                                    )}
                                    {/* Pending: Show Revoke button */}
                                    {appt.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-3 gap-1 w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleRevokeAppointment(appt.id)}
                                            disabled={revokingId === appt.id}
                                        >
                                            {revokingId === appt.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <XCircle className="h-4 w-4" />
                                            )}
                                            Revoke Appointment
                                        </Button>
                                    )}
                                    {/* Confirmed: Show Chat button with time-based availability */}
                                    {appt.status === 'confirmed' && (() => {
                                        const chatStatus = isChatAvailable(appt)
                                        return chatStatus.available ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-3 gap-1 w-full border-slate-300 dark:border-slate-600"
                                                onClick={() => openChat(appt)}
                                            >
                                                <MessageSquare className="h-4 w-4" /> Chat with Doctor
                                            </Button>
                                        ) : (
                                            <div className="mt-3 p-2 bg-muted/50 rounded-lg text-center">
                                                <span className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {chatStatus.message}
                                                </span>
                                            </div>
                                        )
                                    })()}
                                    {appt.status === 'completed' && (
                                        <div className="mt-3 space-y-2">
                                            <div className="p-2 bg-secondary/50 rounded-lg text-center">
                                                <span className="text-sm text-secondary-foreground flex items-center justify-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Consultation completed - Check Medical History
                                                </span>
                                            </div>
                                            {!appt.rated && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full gap-1 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => openRatingModal(appt)}
                                                >
                                                    <Star className="h-4 w-4" /> Rate Doctor
                                                </Button>
                                            )}
                                            {appt.rated && (
                                                <div className="text-center text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                                    <CheckCircle className="h-4 w-4" /> Rated
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Doctors */}
            <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                    <h2 className="text-xl font-semibold text-foreground">Available Doctors</h2>
                    <span className="text-sm text-muted-foreground">{filteredDoctors.length} of {doctors.length} doctors</span>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-card rounded-xl border border-border p-4 mb-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search doctors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 border-input"
                            />
                        </div>

                        {/* Specialty Filter */}
                        <Select
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            className="border-input"
                        >
                            <option value="">All Specialties</option>
                            {specialties.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </Select>

                        {/* Rating Filter */}
                        <Select
                            value={minRating.toString()}
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className="border-input"
                        >
                            <option value="0">Any Rating</option>
                            <option value="3">3+ Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                        </Select>

                        {/* Sort */}
                        <Select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'rating')}
                            className="border-input"
                        >
                            <option value="rating">Sort by Rating</option>
                            <option value="name">Sort by Name</option>
                        </Select>
                    </div>
                </div>

                {filteredDoctors.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="py-8 text-center text-muted-foreground">
                            {doctors.length === 0 ? 'No doctors available at the moment.' : 'No doctors match your search criteria.'}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredDoctors.map((doctor: Doctor) => (
                            <Card key={doctor.id} className="hover:shadow-lg transition-all hover:-translate-y-1 bg-card border-border">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex-shrink-0 ring-2 ring-ring/20">
                                        <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="grid gap-1 min-w-0">
                                        <CardTitle className="text-lg truncate text-foreground">{doctor.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 flex-wrap">
                                            <span className="text-primary font-medium">{doctor.specialty}</span>
                                            {doctor.rating > 0 && (
                                                <span className="flex items-center ml-2 text-amber-500">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    <span className="ml-0.5 text-xs">{doctor.rating}</span>
                                                    {doctor.rating_count > 0 && (
                                                        <span className="ml-1 text-xs text-muted-foreground">({doctor.rating_count} {doctor.rating_count === 1 ? 'review' : 'reviews'})</span>
                                                    )}
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-primary/60" />
                                        <span className="truncate">{doctor.location}</span>
                                    </div>
                                    {/* Availability Status */}
                                    <div className={`flex items-center text-sm ${doctor.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        <span className={`mr-2 h-2 w-2 rounded-full ${doctor.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                        <span>{doctor.availabilityStatus || (doctor.isAvailable ? 'Available' : 'Not available')}</span>
                                    </div>
                                    <div className="flex items-start text-sm text-muted-foreground">
                                        <Clock className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0 text-primary/60" />
                                        <div>
                                            {doctor.availability.slice(0, 2).map((slot: string, i: number) => (
                                                <div key={i}>{slot}</div>
                                            ))}
                                            {doctor.availability.length > 2 && (
                                                <div className="text-xs text-primary">+{doctor.availability.length - 2} more</div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full" onClick={() => openBookingModal(doctor)}>
                                        Book Appointment
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedDoctor && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-card border-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-foreground">Book Appointment</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowBookingModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardDescription className="text-slate-500 dark:text-slate-400">Schedule an appointment with {selectedDoctor.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {bookingSuccess ? (
                                <div className="flex flex-col items-center py-8">
                                    <CheckCircle className="h-16 w-16 text-emerald-500 mb-4" />
                                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Appointment Booked!</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-center mt-2">
                                        Your appointment with {selectedDoctor.name} has been scheduled.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                                            <img src={selectedDoctor.image} alt={selectedDoctor.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{selectedDoctor.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedDoctor.specialty}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="date" className="text-foreground">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            min={getMinDate()}
                                            className="border-input"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="time" className="text-foreground">Time *</Label>
                                        <Select
                                            id="time"
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            className="border-input"
                                        >
                                            <option value="">Select a time slot</option>
                                            {TIME_SLOTS.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="symptoms" className="text-slate-900 dark:text-white">Symptoms (optional)</Label>
                                        <Input
                                            id="symptoms"
                                            placeholder="Describe your symptoms..."
                                            value={bookingSymptoms}
                                            onChange={(e) => setBookingSymptoms(e.target.value)}
                                            className="border-slate-300 dark:border-slate-600"
                                        />
                                    </div>

                                    {bookingError && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{bookingError}</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        {!bookingSuccess && (
                            <CardFooter className="flex gap-2">
                                <Button variant="outline" className="flex-1 border-slate-300 dark:border-slate-600" onClick={() => setShowBookingModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleBookAppointment}
                                    disabled={!bookingDate || !bookingTime || bookingLoading}
                                >
                                    {bookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm Booking
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            )}

            {/* Chat Modal */}
            {showChatModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg h-[500px] flex flex-col bg-card border-border">
                        <CardHeader className="border-b border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-foreground">Chat with {selectedAppointment.doctorName}</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Messages are synced in real-time
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowChatModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                            {chatMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.senderRole === 'patient' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.senderRole === 'patient'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card text-foreground border border-border'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.senderRole === 'patient' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                                }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <div className="border-t border-border p-4 bg-card">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
                                    className="flex-1 border-input"
                                    disabled={sendingMessage}
                                />
                                <Button onClick={sendMessage} disabled={sendingMessage || !newMessage.trim()}>
                                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Rating Modal */}
            {showRatingModal && ratingAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-card border-border">
                        <CardHeader className="border-b border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-foreground">Rate Your Visit</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        How was your experience with {ratingAppointment.doctorName}?
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowRatingModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Star Rating */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRatingScore(star)}
                                            onMouseEnter={() => setRatingHover(star)}
                                            onMouseLeave={() => setRatingHover(0)}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`h-10 w-10 transition-colors ${star <= (ratingHover || ratingScore)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-muted'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {ratingScore > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingScore] : 'Select a rating'}
                                </span>
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <Label htmlFor="ratingComment" className="text-foreground">Comment (optional)</Label>
                                <textarea
                                    id="ratingComment"
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    placeholder="Share your experience..."
                                    className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowRatingModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                                    onClick={submitRating}
                                    disabled={ratingLoading || ratingScore === 0}
                                >
                                    {ratingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Rating
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* AI Doctor Chatbot */}
            <DoctorChatbot />
        </div>
    )
}
