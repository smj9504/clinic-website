"use client";

import Hero from "@/components/sections/Hero";
import StatsSection from "@/components/sections/StatsSection";
import SignatureServiceSection from "@/components/sections/SignatureServiceSection";
import EventsSection from "@/components/sections/EventsSection";
import TreatmentsSection from "@/components/sections/TreatmentsSection";
import DirectorFeature from "@/components/sections/DirectorFeature";
import NoticeSection from "@/components/sections/NoticeSection";
import { useSiteData } from "@/lib/useSiteData";
import { defaultHomeSections } from "@/lib/storage";
import type { HomeSectionId } from "@/lib/data";

const SECTION_COMPONENTS: Record<HomeSectionId, React.ComponentType> = {
  stats: StatsSection,
  signature: SignatureServiceSection,
  events: EventsSection,
  treatments: TreatmentsSection,
  director: DirectorFeature,
  notice: NoticeSection,
};

export default function HomePage() {
  const { homeSections } = useSiteData();
  const sections = (homeSections && homeSections.length > 0 ? homeSections : defaultHomeSections)
    .filter((s) => !s.isHidden)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <Hero />
      {sections.map((s) => {
        const Component = SECTION_COMPONENTS[s.id];
        return Component ? <Component key={s.id} /> : null;
      })}
    </>
  );
}
