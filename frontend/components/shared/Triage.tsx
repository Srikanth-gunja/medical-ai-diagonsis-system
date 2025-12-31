"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Brain } from "lucide-react"

interface TriageProps {
    onTriageComplete: (specialties: string[]) => void;
}

export function Triage({ onTriageComplete }: TriageProps) {
    const [symptoms, setSymptoms] = useState("")
    const [loading, setLoading] = useState(false)

    const handleTriage = async () => {
        if (!symptoms) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/ai/triage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms }),
            })
            const data = await res.json()
            if (data.suggested_specialties) {
                onTriageComplete(data.suggested_specialties);
            }
        } catch (error) {
            console.error("Triage failed", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 dark:from-primary/10 dark:to-primary/20">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-foreground">AI Symptom Triage</CardTitle>
                        <CardDescription className="text-muted-foreground">Describe your symptoms to get a specialist recommendation.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g. I have a severe headache and dizziness"
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTriage()}
                        className="flex-1"
                    />
                    <Button onClick={handleTriage} disabled={loading || !symptoms} className="gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Analyze
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
