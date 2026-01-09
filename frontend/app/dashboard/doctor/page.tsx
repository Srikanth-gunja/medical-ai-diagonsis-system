"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, X, MessageSquare, Loader2, User, Calendar, Users, Clock, Send, Mail, Phone, MapPin, Eye, CheckCircle, FileText, Pill, BarChart3, ClipboardList, Video } from "lucide-react"
import Link from "next/link"
import { VideoCallButton } from "@/components/call/VideoCallButton"

interface PatientDetails {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
}

interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

interface Analytics {
    totalAppointments: number;
    appointmentsByStatus: { pending: number; confirmed: number; completed: number; cancelled: number };
    uniquePatients: number;
    thisMonthAppointments: number;
    todayAppointments: number;
    rating: number;
    ratingCount: number;
    prescriptionsWritten: number;
}

export default function DoctorDashboard() {
    const { user, token, isLoading: authLoading } = useAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [patientCache, setPatientCache] = useState<{ [key: string]: PatientDetails }>({})
    const [loading, setLoading] = useState(true)

    // Patient details modal
    const [showPatientModal, setShowPatientModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null)
    const [loadingPatient, setLoadingPatient] = useState(false)

    // Chat state
    const [showChatModal, setShowChatModal] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [sendingMessage, setSendingMessage] = useState(false)
    const chatPollInterval = useRef<NodeJS.Timeout | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Complete appointment modal
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [completeForm, setCompleteForm] = useState({ type: 'Consultation', description: '', result: '', notes: '' })
    const [completing, setCompleting] = useState(false)

    // Prescription modal
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
    const [prescriptionAppointment, setPrescriptionAppointment] = useState<Appointment | null>(null)
    const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState('')
    const [prescriptionNotes, setPrescriptionNotes] = useState('')
    const [medications, setMedications] = useState<Medication[]>([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
    const [savingPrescription, setSavingPrescription] = useState(false)

    // Analytics
    const [analytics, setAnalytics] = useState<Analytics | null>(null)

    useEffect(() => {
        const fetchAppointments = async () => {
            if (!token) return
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setAppointments(data)

                    // Fetch patient details
                    const uniquePatientIds = [...new Set(data.map((a: Appointment) => a.patientId))]
                    const patientDetails: { [key: string]: PatientDetails } = {}

                    for (const patientId of uniquePatientIds) {
                        try {
                            const patientRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${patientId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                            if (patientRes.ok) {
                                const patientData = await patientRes.json()
                                patientDetails[patientId as string] = patientData
                            }
                        } catch (err) {
                            console.error(`Failed to fetch patient ${patientId}`, err)
                        }
                    }
                    setPatientCache(patientDetails)
                }
            } catch (error) {
                console.error("Failed to fetch appointments", error)
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && token) {
            fetchAppointments()
        }
    }, [token, authLoading])

    // Fetch analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!token) return
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/doctor`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setAnalytics(data)
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err)
            }
        }
        if (!authLoading && token) {
            fetchAnalytics()
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
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${selectedAppointment.id}`, {
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

    const updateAppointmentStatus = async (appointmentId: string, status: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${appointmentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            })
            if (res.ok) {
                setAppointments(prev =>
                    prev.map(appt =>
                        appt.id === appointmentId ? { ...appt, status: status as any } : appt
                    )
                )
            }
        } catch (error) {
            console.error("Failed to update appointment status", error)
        }
    }

    const viewPatientDetails = async (patientId: string) => {
        if (patientCache[patientId]) {
            setSelectedPatient(patientCache[patientId])
            setShowPatientModal(true)
            return
        }

        setLoadingPatient(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/patients/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setPatientCache(prev => ({ ...prev, [patientId]: data }))
                setSelectedPatient(data)
                setShowPatientModal(true)
            }
        } catch (err) {
            console.error("Failed to fetch patient details", err)
        } finally {
            setLoadingPatient(false)
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/${selectedAppointment.id}`, {
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

    const openCompleteModal = (appointment: Appointment) => {
        setSelectedAppointment(appointment)
        setCompleteForm({
            type: 'Consultation',
            description: `Consultation for: ${appointment.symptoms || 'General checkup'}`,
            result: 'Completed',
            notes: ''
        })
        setShowCompleteModal(true)
    }

    const handleCompleteAppointment = async () => {
        if (!selectedAppointment || !token) return

        setCompleting(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${selectedAppointment.id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(completeForm)
            })

            if (res.ok) {
                setAppointments(prev =>
                    prev.map(appt =>
                        appt.id === selectedAppointment.id ? { ...appt, status: 'completed' } : appt
                    )
                )
                setShowCompleteModal(false)
            }
        } catch (err) {
            console.error("Failed to complete appointment", err)
        } finally {
            setCompleting(false)
        }
    }

    const openPrescriptionModal = (appointment: Appointment) => {
        setPrescriptionAppointment(appointment)
        setPrescriptionDiagnosis('')
        setPrescriptionNotes('')
        setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
        setShowPrescriptionModal(true)
    }

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])
    }

    const removeMedication = (index: number) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index))
        }
    }

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications]
        updated[index] = { ...updated[index], [field]: value }
        setMedications(updated)
    }

    const handleSavePrescription = async () => {
        if (!prescriptionAppointment || !token) return

        // Validate at least one medication with name and dosage
        const validMeds = medications.filter(m => m.name && m.dosage)
        if (validMeds.length === 0) {
            alert('Please add at least one medication with name and dosage')
            return
        }

        setSavingPrescription(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointmentId: prescriptionAppointment.id,
                    medications: validMeds,
                    diagnosis: prescriptionDiagnosis,
                    notes: prescriptionNotes
                })
            })

            if (res.ok) {
                setShowPrescriptionModal(false)
                alert('Prescription saved successfully!')
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to save prescription')
            }
        } catch (err) {
            console.error("Failed to save prescription", err)
            alert('Failed to save prescription')
        } finally {
            setSavingPrescription(false)
        }
    }

    const getPatientName = (patientId: string) => {
        const patient = patientCache[patientId]
        return patient ? `${patient.firstName} ${patient.lastName}` : 'Loading...'
    }

    const getPatientEmail = (patientId: string) => {
        const patient = patientCache[patientId]
        return patient?.email || ''
    }

    const pendingCount = appointments.filter(a => a.status === 'pending').length
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length
    const completedCount = appointments.filter(a => a.status === 'completed').length

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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Doctor Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Manage your appointments and patients</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" asChild>
                        <Link href="/dashboard/doctor/schedule">
                            <Clock className="h-4 w-4" /> Schedule
                        </Link>
                    </Button>
                    <Button variant="outline" className="gap-2 border-slate-300 dark:border-slate-600" asChild>
                        <Link href="/dashboard/doctor/profile">
                            <User className="h-4 w-4" /> Profile
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{appointments.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
                        <Check className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{confirmedCount}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{completedCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Appointments List */}
            <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Appointments</h2>
                {appointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No appointments found.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {appointments.map((appt) => (
                            <Card key={appt.id} className="bg-muted/30 border-border">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-semibold text-foreground">
                                                    {getPatientName(appt.patientId)}
                                                </div>
                                                {getPatientEmail(appt.patientId) && (
                                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {getPatientEmail(appt.patientId)}
                                                    </div>
                                                )}
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {appt.date} at {appt.time}
                                                </div>
                                                {appt.symptoms && (
                                                    <div className="text-sm">
                                                        <span className="text-muted-foreground">Symptoms:</span>{" "}
                                                        <span className="text-foreground">{appt.symptoms}</span>
                                                    </div>
                                                )}
                                                <div className="pt-1">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${appt.status === 'confirmed' ? 'badge-success' :
                                                        appt.status === 'cancelled' ? 'badge-error' :
                                                            appt.status === 'completed' ? 'badge-info' :
                                                                'badge-warning'
                                                        }`}>
                                                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1 border-slate-300 dark:border-slate-600"
                                                onClick={() => viewPatientDetails(appt.patientId)}
                                                disabled={loadingPatient}
                                            >
                                                <Eye className="w-4 h-4" /> Profile
                                            </Button>
                                            {appt.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => updateAppointmentStatus(appt.id, 'confirmed')}
                                                    >
                                                        <Check className="w-4 h-4" /> Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1"
                                                        onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}
                                                    >
                                                        <X className="w-4 h-4" /> Decline
                                                    </Button>
                                                </>
                                            )}
                                            {appt.status === 'confirmed' && (
                                                <>
                                                    <VideoCallButton appointmentId={appt.id} />
                                                    <Button
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => openCompleteModal(appt)}
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Complete
                                                    </Button>
                                                </>
                                            )}
                                            {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1"
                                                    onClick={() => openChat(appt)}
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Chat
                                                </Button>
                                            )}
                                            {appt.status === 'completed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-primary border-primary/20 hover:bg-primary/10"
                                                    onClick={() => openPrescriptionModal(appt)}
                                                >
                                                    <Pill className="w-4 h-4" /> Prescription
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Patient Details Modal */}
            {
                showPatientModal && selectedPatient && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-card border-border">
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-foreground">Patient Profile</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setShowPatientModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-foreground">
                                            {selectedPatient.firstName} {selectedPatient.lastName}
                                        </h3>
                                        <p className="text-muted-foreground">Patient</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="text-foreground">{selectedPatient.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="text-foreground">{selectedPatient.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Address</p>
                                            <p className="text-foreground">{selectedPatient.address || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Complete Appointment Modal */}
            {
                showCompleteModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-card border-border">
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-foreground">Complete Appointment</CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            This will create a medical record for the patient
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowCompleteModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type" className="text-foreground">Record Type</Label>
                                    <Input
                                        id="type"
                                        value={completeForm.type}
                                        onChange={(e) => setCompleteForm({ ...completeForm, type: e.target.value })}
                                        placeholder="Consultation"
                                        className="border-input"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description" className="text-foreground">Description</Label>
                                    <Input
                                        id="description"
                                        value={completeForm.description}
                                        onChange={(e) => setCompleteForm({ ...completeForm, description: e.target.value })}
                                        placeholder="Brief description of the consultation"
                                        className="border-input"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="result" className="text-foreground">Result/Diagnosis</Label>
                                    <Input
                                        id="result"
                                        value={completeForm.result}
                                        onChange={(e) => setCompleteForm({ ...completeForm, result: e.target.value })}
                                        placeholder="Completed, Normal, etc."
                                        className="border-input"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="notes" className="text-foreground">Notes</Label>
                                    <Input
                                        id="notes"
                                        value={completeForm.notes}
                                        onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                                        placeholder="Prescriptions, follow-up instructions, etc."
                                        className="border-input"
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setShowCompleteModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleCompleteAppointment} disabled={completing}>
                                        {completing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Complete & Create Record
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Chat Modal */}
            {
                showChatModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg h-[500px] flex flex-col bg-card border-border">
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-foreground">
                                            Chat with {getPatientName(selectedAppointment.patientId)}
                                        </CardTitle>
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
                                            className={`flex ${msg.senderRole === 'doctor' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.senderRole === 'doctor'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-card text-foreground border border-border'
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.senderRole === 'doctor' ? 'text-primary-foreground/70' : 'text-muted-foreground'
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
                )
            }

            {/* Prescription Modal */}
            {
                showPrescriptionModal && prescriptionAppointment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <Card className="w-full max-w-2xl bg-card border-border my-8">
                            <CardHeader className="border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            <Pill className="h-5 w-5 text-purple-500" /> Write Prescription
                                        </CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            For patient: {getPatientName(prescriptionAppointment.patientId)}
                                        </CardDescription>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowPrescriptionModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                {/* Diagnosis */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">Diagnosis</Label>
                                    <Input
                                        value={prescriptionDiagnosis}
                                        onChange={(e) => setPrescriptionDiagnosis(e.target.value)}
                                        placeholder="Enter diagnosis..."
                                        className="border-input"
                                    />
                                </div>

                                {/* Medications */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-foreground">Medications</Label>
                                        <Button size="sm" variant="outline" onClick={addMedication}>
                                            + Add Medication
                                        </Button>
                                    </div>

                                    {medications.map((med, index) => (
                                        <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-muted/30">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground">Medication {index + 1}</span>
                                                {medications.length > 1 && (
                                                    <Button size="sm" variant="ghost" onClick={() => removeMedication(index)} className="text-destructive hover:text-destructive/90">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    placeholder="Medication name *"
                                                    value={med.name}
                                                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                    className="border-input"
                                                />
                                                <Input
                                                    placeholder="Dosage (e.g., 500mg) *"
                                                    value={med.dosage}
                                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                    className="border-input"
                                                />
                                                <Input
                                                    placeholder="Frequency (e.g., twice daily)"
                                                    value={med.frequency}
                                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                    className="border-input"
                                                />
                                                <Input
                                                    placeholder="Duration (e.g., 7 days)"
                                                    value={med.duration}
                                                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                    className="border-input"
                                                />
                                            </div>
                                            <Input
                                                placeholder="Special instructions..."
                                                value={med.instructions}
                                                onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                                className="border-input"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label className="text-foreground">Additional Notes</Label>
                                    <textarea
                                        value={prescriptionNotes}
                                        onChange={(e) => setPrescriptionNotes(e.target.value)}
                                        placeholder="Any additional notes or instructions..."
                                        className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </CardContent>

                            <div className="border-t border-border p-4 flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowPrescriptionModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                                    onClick={handleSavePrescription}
                                    disabled={savingPrescription}
                                >
                                    {savingPrescription && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Prescription
                                </Button>
                            </div>
                        </Card>
                    </div >
                )
            }
        </div >
    )
}

