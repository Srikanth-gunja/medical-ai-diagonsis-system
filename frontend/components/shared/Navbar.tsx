"use client"

import { ModeToggle } from "@/components/mode-toggle"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, LogOut, Stethoscope, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useEffect, useState } from "react"

export function Navbar() {
    const { user, logout, isLoading, isAuthenticated } = useAuth()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const isDoctor = user?.role === 'doctor'

    return (
        <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center mx-auto px-4">
                <Link href="/" className="mr-8 flex items-center space-x-2 group">
                    <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <span className="hidden font-bold text-lg sm:inline-block">
                        Medi<span className="text-primary">Care</span>
                    </span>
                </Link>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        {/* Only show Find Doctors for patients or non-logged in users */}
                        {(!mounted || !isDoctor) && (
                            <Link
                                href="/dashboard/patient"
                                className="hidden md:flex items-center gap-1.5 transition-colors hover:text-primary text-foreground/70"
                            >
                                <Stethoscope className="h-4 w-4" />
                                Find Doctors
                            </Link>
                        )}
                        <Link
                            href="/about"
                            className="transition-colors hover:text-primary text-foreground/70"
                        >
                            About
                        </Link>
                    </nav>

                    <div className="flex items-center space-x-3 ml-6">
                        <ModeToggle />
                        {!mounted || isLoading ? (
                            <div className="h-10 w-24 animate-pulse bg-muted rounded-lg" />
                        ) : isAuthenticated ? (
                            <>
                                <Button variant="ghost" className="gap-2" asChild>
                                    <Link href={isDoctor ? '/dashboard/doctor' : '/dashboard/patient'}>
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span className="hidden sm:inline">Dashboard</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={logout}
                                    className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild>
                                    <Link href="/auth/login">Sign In</Link>
                                </Button>
                                <Button className="shadow-lg shadow-primary/25" asChild>
                                    <Link href="/auth/register">Get Started</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

