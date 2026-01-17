'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { schedulesApi, type Schedule } from '@/lib/api';

interface ScheduleManageModalProps {
    onClose: () => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ScheduleManageModal({ onClose }: ScheduleManageModalProps) {
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'weekly' | 'blocked'>('weekly');
    const [blockedDate, setBlockedDate] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const data = await schedulesApi.getMySchedule();
            setSchedule(data);
        } catch (err) {
            console.error('Failed to fetch schedule:', err);
            setError(err instanceof Error ? err.message : 'Failed to load schedule');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeChange = (day: string, field: 'start' | 'end', value: string) => {
        if (!schedule) return;
        setSchedule({
            ...schedule,
            weeklySchedule: {
                ...schedule.weeklySchedule,
                [day]: {
                    ...schedule.weeklySchedule[day],
                    [field]: value
                }
            }
        });
    };

    const handleToggleDay = (day: string) => {
        if (!schedule) return;
        setSchedule({
            ...schedule,
            weeklySchedule: {
                ...schedule.weeklySchedule,
                [day]: {
                    ...schedule.weeklySchedule[day],
                    enabled: !schedule.weeklySchedule[day]?.enabled
                }
            }
        });
    };

    const handleSlotDurationChange = (value: number) => {
        if (!schedule) return;
        setSchedule({
            ...schedule,
            slotDuration: value
        });
    };

    const handleSave = async () => {
        if (!schedule) return;
        setIsSaving(true);
        setError(null);
        try {
            await schedulesApi.update({
                weeklySchedule: schedule.weeklySchedule,
                slotDuration: schedule.slotDuration,
                blockedDates: schedule.blockedDates
            });
            onClose();
        } catch (err) {
            console.error('Failed to save schedule:', err);
            setError('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddBlockedDate = async () => {
        if (!blockedDate) return;
        try {
            await schedulesApi.addBlockedDate(blockedDate);
            setBlockedDate('');
            fetchSchedule(); // Refresh to ensure sync
        } catch (err) {
            console.error('Failed to block date:', err);
            setError('Failed to block date');
        }
    };

    const handleRemoveBlockedDate = async (date: string) => {
        try {
            await schedulesApi.removeBlockedDate(date);
            fetchSchedule(); // Refresh
        } catch (err) {
            console.error('Failed to unblock date:', err);
            setError('Failed to unblock date');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-text-primary">Manage Schedule</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-base"
                        aria-label="Close modal"
                    >
                        <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex items-center gap-4 px-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`py-4 font-medium relative ${activeTab === 'weekly' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Weekly Hours
                        {activeTab === 'weekly' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        className={`py-4 font-medium relative ${activeTab === 'blocked' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        Blocked Dates
                        {activeTab === 'blocked' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-center mb-4">
                            {error}
                        </div>
                    ) : schedule ? (
                        activeTab === 'weekly' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <label className="font-medium text-text-primary">Appointment Duration</label>
                                    <select
                                        value={schedule.slotDuration}
                                        onChange={(e) => handleSlotDurationChange(parseInt(e.target.value))}
                                        className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm"
                                    >
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={45}>45 minutes</option>
                                        <option value={60}>60 minutes</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    {DAYS.map((day) => {
                                        const config = schedule.weeklySchedule[day] || { start: '09:00', end: '17:00', enabled: false };
                                        return (
                                            <div key={day} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={config.enabled}
                                                        onChange={() => handleToggleDay(day)}
                                                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                                                    />
                                                    <span className="capitalize font-medium text-text-primary w-24">{day}</span>
                                                </div>

                                                <div className={`flex items-center gap-2 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    <input
                                                        type="time"
                                                        value={config.start}
                                                        onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                                        className="px-3 py-1.5 bg-muted rounded-lg text-sm"
                                                    />
                                                    <span className="text-text-secondary">to</span>
                                                    <input
                                                        type="time"
                                                        value={config.end}
                                                        onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                                        className="px-3 py-1.5 bg-muted rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-primary">Add Blocked Date</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={blockedDate}
                                            onChange={(e) => setBlockedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="flex-1 px-4 py-2 bg-card border border-border rounded-lg"
                                        />
                                        <button
                                            onClick={handleAddBlockedDate}
                                            disabled={!blockedDate}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                                        >
                                            Block Date
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-medium text-text-primary">Blocked Dates</h3>
                                    {schedule.blockedDates.length === 0 ? (
                                        <p className="text-sm text-text-secondary italic">No blocked dates</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {schedule.blockedDates.map((date) => (
                                                <div key={date} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                    <span className="text-sm font-medium">{new Date(date).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => handleRemoveBlockedDate(date)}
                                                        className="p-1 text-error hover:bg-error/10 rounded"
                                                        aria-label="Remove blocked date"
                                                    >
                                                        <Icon name="TrashIcon" size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    ) : null}
                </div>

                <div className="p-6 border-t border-border flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !schedule}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-elevation-2 transition-base font-medium disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
