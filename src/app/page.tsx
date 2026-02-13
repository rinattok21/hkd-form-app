import Image from "next/image";
import { KarateDojoForm } from "@/components/karate-form";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-125 w-125 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-125 w-125 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-150 w-150 rounded-full bg-primary/2 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="HSTU Karate Dojo Logo"
                width={44}
                height={44}
                className="rounded-full"
                priority
              />
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-foreground leading-tight">
                  HSTU Karate Dojo
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  Registration Form
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-700 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                100% Client-side
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="sm:hidden mb-4">
            <Image
              src="/logo.png"
              alt="HSTU Karate Dojo Logo"
              width={72}
              height={72}
              className="mx-auto rounded-full"
              priority
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Student Registration Form
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Fill out the form below and download your completed PDF registration form.
            All data stays on your device — nothing is sent to any server.
          </p>
        </div>

        {/* Form */}
        <KarateDojoForm />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 mt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={20}
                height={20}
                className="rounded-full opacity-60"
              />
              <span>© {new Date().getFullYear()} HSTU Karate Dojo. Est. 2023</span>
            </div>
            <p>Your data never leaves your browser.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
