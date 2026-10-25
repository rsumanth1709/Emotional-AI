"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "@/app/globals.css";

import FloatingVoiceAssistant from "@/components/layout/FloatingVoiceAssistant";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>MindCare AI — Emotional AI Support Companion</title>
        <meta name="description" content="Your safe, compassionate, and private AI space for mental health, emotional wellness, and stress tracking." />
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Toaster position="top-right" />
            {children}
            <FloatingVoiceAssistant />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
