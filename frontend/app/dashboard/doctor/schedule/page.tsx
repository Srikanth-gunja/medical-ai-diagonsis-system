"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Loader2, Calendar, Clock, X, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: { [key: string]: string } = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
}

interface DaySchedule {
    start: string
    end: string
    enabled: boolean
}

interface Schedule {
    weeklySchedule: { [key: string]: DaySchedule }
    blockedDates: string[]
    slotDuration: number
}

export default function ScheduleManagementPage() {
    const { token, isLoading: authLoading } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [schedule, setSchedule] = useState<Schedule>({
        weeklySchedule: {
            monday: { start: '09:00', end: '17:00', enabled: true },
            tuesday: { start: '09:00', end: '17:00', enabled: true },
            wednesday: { start: '09:00', end: '17:00', enabled: true },
            thursday: { start: '09:00', end: '17:00', enabled: true },
            friday: { start: '09:00', end: '17:00', enabled: true },
            saturday: { start: '09:00', end: '13:00', enabled: false },
            sunday: { start: '09:00', end: '13:00', enabled: false }
        },
        blockedDates: [],
        slotDuration: 30
    })
    const [newBlockedDate, setNewBlockedDate] = useState('')
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!token) return
            try {
                const res = await fetch('http://localhost:5000/api/schedules/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setSchedule({
                        weeklySchedule: data.weeklySchedule || schedule.weeklySchedule,
                        blockedDates: data.blockedDates || [],
                        slotDuration: data.slotDuration || 30
                    })
                }
            } catch (err) {
                console.error("Failed to fetch schedule", err)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading && token) {
            fetchSchedule()
        }
    }, [token, authLoading])

    const updateDaySchedule = (day: string, field: keyof DaySchedule, value: string | boolean) => {
        setSchedule(prev => ({
            ...prev,
            weeklySchedule: {
                ...prev.weeklySchedule,
                [day]: {
                    ...prev.weeklySchedule[day],
                    [field]: value
                }
            }
        }))
    }

    const toggleDay = (day: string) => {
        updateDaySchedule(day, 'enabled', !schedule.weeklySchedule[day].enabled)
    }

    const addBlockedDate = () => {
        if (newBlockedDate && !schedule.blockedDates.includes(newBlockedDate)) {
            setSchedule(prev => ({
                ...prev,
                blockedDates: [...prev.blockedDates, newBlockedDate].sort()
            }))
            setNewBlockedDate('')
        }
    }

    const removeBlockedDate = (date: string) => {
        setSchedule(prev => ({
            ...prev,
            blockedDates: prev.blockedDates.filter(d => d !== date)
        }))
    }

    const saveSchedule = async () => {
        if (!token) return
        setSaving(true)
        setSaveSuccess(false)

        try {
            const res = await fetch('http://localhost:5000/api/schedules/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(schedule)
            })

            if (res.ok) {
                setSaveSuccess(true)
                setTimeout(() => setSaveSuccess(false), 3000)
            }
        } catch (err) {
            console.error("Failed to save schedule", err)
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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/doctor">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Schedule Management</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your availability and appointment slots</p>
                    </div>
                </div>
                <Button onClick={saveSchedule} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {saveSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-emerald-700 dark:text-emerald-300">
                    Schedule saved successfully!
                </div>
            )}

            {/* Slot Duration */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" /> Appointment Duration
                    </CardTitle>
                    <CardDescription>Set the default duration for each appointment slot</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select
                        value={schedule.slotDuration.toString()}
                        onChange={(e) => setSchedule(prev => ({ ...prev, slotDuration: Number(e.target.value) }))}
                        className="max-w-xs border-slate-300 dark:border-slate-600"
                    >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                    </Select>
                </CardContent>
            </Card>

            {/* Weekly Schedule */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" /> Weekly Schedule
                    </CardTitle>
                    <CardDescription>Set your working hours for each day of the week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {DAYS.map(day => (
                        <div key={day} className={`p-4 rounded-lg border ${schedule.weeklySchedule[day].enabled
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => toggleDay(day)}
                                        className={`w-12 h-6 rounded-full transition-colors p-1 ${schedule.weeklySchedule[day].enabled
                                                ? 'bg-primary'
                                                : 'bg-slate-300 dark:bg-slate-600'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${schedule.weeklySchedule[day].enabled ? 'translate-x-6' : 'translate-x-0'
                                            }`} />
                                    </button>
                                    <span className={`font-medium ${schedule.weeklySchedule[day].enabled
                                            ? 'text-slate-900 dark:text-white'
                                            : 'text-slate-400'
                                        }`}>
                                        {DAY_LABELS[day]}
                                    </span>
                                </div>

                                {schedule.weeklySchedule[day].enabled && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={schedule.weeklySchedule[day].start}
                                            onChange={(e) => updateDaySchedule(day, 'start', e.target.value)}
                                            className="w-32 border-slate-300 dark:border-slate-600"
                                        />
                                        <span className="text-slate-500">to</span>
                                        <Input
                                            type="time"
                                            value={schedule.weeklySchedule[day].end}
                                            onChange={(e) => updateDaySchedule(day, 'end', e.target.value)}
                                            className="w-32 border-slate-300 dark:border-slate-600"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Blocked Dates */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                        <X className="h-5 w-5 text-red-500" /> Blocked Dates
                    </CardTitle>
                    <CardDescription>Block specific dates when you&apos;re not available (vacations, holidays, etc.)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={newBlockedDate}
                            onChange={(e) => setNewBlockedDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="max-w-xs border-slate-300 dark:border-slate-600"
                        />
                        <Button onClick={addBlockedDate} variant="outline">
                            Block Date
                        </Button>
                    </div>

                    {schedule.blockedDates.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {schedule.blockedDates.map(date => (
                                <div key={date} className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm">
                                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    <button onClick={() => removeBlockedDate(date)} className="hover:text-red-900">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No blocked dates. Add dates when you won&apos;t be available.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
