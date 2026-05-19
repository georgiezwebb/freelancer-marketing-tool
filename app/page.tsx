import {
  Navbar,
  Hero,
  Features,
  FAQ,
  Footer,
  SignedInDashboardRedirect,
} from "@/components/landing"

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SignedInDashboardRedirect />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
