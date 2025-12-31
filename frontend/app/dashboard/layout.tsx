"use client"

import { Navbar } from "@/components/shared/Navbar";
import { RequireAuth } from "@/lib/auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RequireAuth>
            <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 bg-background">
                    <div className="container py-6 mx-auto px-4">
                        {children}
                    </div>
                </main>
            </div>
        </RequireAuth>
    );
}
