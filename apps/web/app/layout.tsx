import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { NavBar } from "../components/NavBar";
import { FeedbackProvider } from "../components/feedback/FeedbackContext";
import { ChatProvider } from "../lib/chatbot/chat-context";
import { ChatWidget } from "../components/chat/ChatWidget";
import { Toaster } from "@/components/ui/sonner";
import Footer from "./components/homepage/Footer";
import CookieConsentComponent from "./components/CookieConsent";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans"});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono"});

export const metadata: Metadata = {
  title: "Preset - Creative Collaboration Platform",
  description: "Connect creatives for shoots. Contributors post gigs, Talent applies. Free to start, subscription-based platform.",
  icons: {
    icon: [
      { url: '/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/logo.png'},
  manifest: '/manifest.json'};

export default function RootLayout({
  children}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground`}>
        <FeedbackProvider>
          <AuthProvider>
            <ChatProvider>
              <NavBar />
              <main className="min-h-screen bg-background">
                {children}
              </main>
              <Footer />
              <CookieConsentComponent />
              <ChatWidget />
              <Toaster />
            </ChatProvider>
          </AuthProvider>
        </FeedbackProvider>
      </body>
    </html>
  );
}
