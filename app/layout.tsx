import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PitchKit — freelance copy shelf (portfolio project)",
  description:
    "A portfolio app for storing marketing and sales copy, tracking versions, and getting unstuck with short writing notes — built for freelancers who keep rewriting the same pitches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative isolate min-h-full">
        <ClerkProvider
          signInForceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        >
          <div className="landing-grain" aria-hidden />
          <div className="relative z-10 flex min-h-full flex-col">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
