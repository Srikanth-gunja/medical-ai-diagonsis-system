"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { Triage } from "@/components/shared/Triage"
import { DoctorChatbot } from "@/components/shared/DoctorChatbot"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Calendar, MapPin, Star, X, Loader2, Clock, CheckCircle, FileText, User, MessageSquare, Send } from "lucide-react"
import Link from "next/link"

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    location: string;
    availability: string[];
    image: string;
    rating: number;
}

interface Appointment {
    id: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: string;
    symptoms: string;
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
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
    const [suggestedSpecialties, setSuggestedSpecialties] = useState<string[]>([])
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

    useEffect(() => {
        fetch('http://localhost:5000/api/doctors/')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDoctors(data)
                    setFilteredDoctors(data)
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

    useEffect(() => {
        if (suggestedSpecialties.length > 0) {
            const filtered = doctors.filter(doc => suggestedSpecialties.includes(doc.specialty));
            setFilteredDoctors(filtered.length > 0 ? filtered : doctors);
        } else {
            setFilteredDoctors(doctors);
        }
    }, [suggestedSpecialties, doctors])

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
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            case 'completed':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            default:
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Patient Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your health and appointments</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-600" asChild>
                        <Link href="/dashboard/patient/history">
                            <FileText className="h-4 w-4" />
                            Medical History
                        </Link>
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-600" asChild>
                        <Link href="/dashboard/patient/profile">
                            <User className="h-4 w-4" />
                            My Profile
                        </Link>
                    </Button>
                </div>
            </div>

            {/* My Appointments Section */}
            {appointments.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">My Appointments</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {appointments.map((appt) => (
                            <Card key={appt.id} className={`border-l-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 ${appt.status === 'completed' ? 'border-l-blue-500' : 'border-l-primary'
                                }`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-slate-900 dark:text-white">{appt.doctorName}</span>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(appt.status)}`}>
                                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {appt.date} at {appt.time}
                                    </div>
                                    {appt.symptoms && (
                                        <p className="text-sm mt-2">
                                            <span className="text-slate-500 dark:text-slate-400">Symptoms:</span>{" "}
                                            <span className="text-slate-700 dark:text-slate-300">{appt.symptoms}</span>
                                        </p>
                                    )}
                                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-3 gap-1 w-full border-slate-300 dark:border-slate-600"
                                            onClick={() => openChat(appt)}
                                        >
                                            <MessageSquare className="h-4 w-4" /> Chat with Doctor
                                        </Button>
                                    )}
                                    {appt.status === 'completed' && (
                                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                                            <span className="text-sm text-blue-700 dark:text-blue-300 flex items-center justify-center gap-1">
                                                <CheckCircle className="h-4 w-4" />
                                                Consultation completed - Check Medical History
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Triage */}
            <div>
                <Triage onTriageComplete={setSuggestedSpecialties} />
                {suggestedSpecialties.length > 0 && (
                    <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                        <strong className="text-slate-900 dark:text-white">AI Suggestion:</strong>{" "}
                        <span className="text-slate-700 dark:text-slate-300">Based on your symptoms, we recommend seeing a specialist in: {suggestedSpecialties.join(", ")}.</span>
                        <Button variant="link" onClick={() => setSuggestedSpecialties([])} className="h-auto p-0 ml-2 text-primary">
                            Clear filter
                        </Button>
                    </div>
                )}
            </div>

            {/* Available Doctors */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Available Doctors</h2>
                {filteredDoctors.length === 0 ? (
                    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardContent className="py-8 text-center text-slate-500 dark:text-slate-400">
                            No doctors available at the moment.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredDoctors.map((doctor) => (
                            <Card key={doctor.id} className="hover:shadow-lg transition-all hover:-translate-y-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
                                        <img src={doctor.image} alt={doctor.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="grid gap-1 min-w-0">
                                        <CardTitle className="text-lg truncate text-slate-900 dark:text-white">{doctor.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <span className="text-primary font-medium">{doctor.specialty}</span>
                                            {doctor.rating && (
                                                <span className="flex items-center ml-2 text-amber-500">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    <span className="ml-0.5 text-xs">{doctor.rating}</span>
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin className="mr-2 h-4 w-4 flex-shrink-0 text-primary/60" />
                                        <span className="truncate">{doctor.location}</span>
                                    </div>
                                    <div className="flex items-start text-sm text-slate-600 dark:text-slate-400">
                                        <Clock className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0 text-primary/60" />
                                        <div>
                                            {doctor.availability.slice(0, 2).map((slot, i) => (
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-slate-900 dark:text-white">Book Appointment</CardTitle>
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
                                    <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                            <img src={selectedDoctor.image} alt={selectedDoctor.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{selectedDoctor.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedDoctor.specialty}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="date" className="text-slate-900 dark:text-white">Date *</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            value={bookingDate}
                                            onChange={(e) => setBookingDate(e.target.value)}
                                            min={getMinDate()}
                                            className="border-slate-300 dark:border-slate-600"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="time" className="text-slate-900 dark:text-white">Time *</Label>
                                        <Select
                                            id="time"
                                            value={bookingTime}
                                            onChange={(e) => setBookingTime(e.target.value)}
                                            className="border-slate-300 dark:border-slate-600"
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
                    <Card className="w-full max-w-lg h-[500px] flex flex-col bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 dark:text-white">Chat with {selectedAppointment.doctorName}</CardTitle>
                                    <CardDescription className="text-slate-500 dark:text-slate-400">
                                        Messages are synced in real-time
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setShowChatModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                            {chatMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                chatMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.senderRole === 'patient' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.senderRole === 'patient'
                                            ? 'bg-primary text-white'
                                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.senderRole === 'patient' ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
                                    className="flex-1 border-slate-300 dark:border-slate-600"
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

            {/* AI Doctor Chatbot */}
            <DoctorChatbot />
        </div>
    )
}
