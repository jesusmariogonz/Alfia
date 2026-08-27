import { Navbar } from "@/components/marketing/navbar";
import { TickerStrip } from "@/components/marketing/ticker-strip";
import { Hero } from "@/components/marketing/hero";
import { ShowcaseBanner } from "@/components/marketing/showcase-banner";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { Faq } from "@/components/marketing/faq";
import { Footer } from "@/components/marketing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <TickerStrip />
        <Hero />
        <ShowcaseBanner />
        <FeatureGrid />
        <PricingTeaser />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
