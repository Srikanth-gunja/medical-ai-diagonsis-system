import { Navbar } from "@/components/shared/Navbar";

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container py-12 max-w-4xl">
                <h1 className="text-4xl font-bold tracking-tight mb-6">About MediCare</h1>
                <div className="prose dark:prose-invert max-w-none">
                    <p className="text-xl text-muted-foreground mb-8">
                        Revolutionizing healthcare access with AI-powered diagnostics and seamless patient-doctor connection.
                    </p>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                            <p>
                                To accessible, efficient, and intelligent healthcare solutions to everyone, everywhere.
                                We believe in empowering patients with knowledge and tools to manage their health better.
                            </p>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold mb-4">Technology</h2>
                            <p>
                                Built with cutting-edge technologies including Advanced AI for triage,
                                secure real-time communication, and a robust platform ensuring privacy and reliability.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 p-6 bg-muted rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Disclaimer</h3>
                        <p className="text-sm text-muted-foreground">
                            The AI triage features provided by this application are for informational purposes only
                            and do not constitute professional medical advice, diagnosis, or treatment.
                            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
