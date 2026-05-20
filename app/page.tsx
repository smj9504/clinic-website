import Hero from "@/components/sections/Hero";
import EventsSection from "@/components/sections/EventsSection";
import TreatmentsSection from "@/components/sections/TreatmentsSection";
import DirectorFeature from "@/components/sections/DirectorFeature";
import NoticeSection from "@/components/sections/NoticeSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <EventsSection />
      <TreatmentsSection />
      <DirectorFeature />
      <NoticeSection />
    </>
  );
}
