"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Heart, Stethoscope, Calendar, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDoctor = user?.role === 'doctor';
  const dashboardPath = isDoctor ? '/dashboard/doctor' : '/dashboard/patient';

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 pb-16 pt-12 md:pb-24 md:pt-20 lg:py-32">
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="container relative mx-auto px-4 flex max-w-[64rem] flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Heart className="mr-2 h-4 w-4" />
              Your Health, Our Priority
            </div>
            <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
              <span className="gradient-text">AI-Enhanced</span> Medical
              <br />
              Diagnosis & Patient Care
            </h1>
            <p className="max-w-[42rem] leading-relaxed text-muted-foreground text-lg sm:text-xl">
              Experience the future of healthcare. Instant AI triage, seamless appointment booking, and secure doctor-patient communication — all in one platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {!mounted || isLoading ? (
                <div className="h-14 w-48 animate-pulse bg-muted rounded-lg" />
              ) : isAuthenticated ? (
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                  <Link href={dashboardPath}>
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                    <Link href="/auth/register">
                      Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <span>Verified Doctors</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center mb-16">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              Features
            </span>
            <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl">
              Everything you need for
              <br />
              <span className="gradient-text">better healthcare</span>
            </h2>
            <p className="max-w-[85%] leading-relaxed text-muted-foreground text-lg">
              Modern tools designed for patients and healthcare providers alike.
            </p>
          </div>

          <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">AI Triage</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get instant specialist recommendations based on your symptoms using advanced AI technology.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/30 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-accent p-3">
                  <Calendar className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Smart Booking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Find available doctors and book appointments in seconds with our intuitive scheduling system.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="mb-4 inline-flex rounded-xl bg-secondary p-3">
                  <ShieldCheck className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Secure Records</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your medical history is encrypted and accessible only to you and your authorized doctors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-primary/80 dark:from-primary/20 dark:to-primary/5 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground dark:text-foreground mb-4">
              {isAuthenticated ? 'Your health journey continues!' : 'Ready to take control of your health?'}
            </h2>
            <p className="text-primary-foreground/80 dark:text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              {isAuthenticated
                ? 'Access your dashboard to manage appointments and connect with doctors.'
                : 'Join thousands of patients who are already experiencing better healthcare.'}
            </p>
            {mounted && !isLoading && (
              isAuthenticated ? (
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" asChild>
                  <Link href={dashboardPath}>
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" asChild>
                  <Link href="/auth/register">
                    Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )
            )}
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="font-semibold">MediCare</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 MediCare. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
