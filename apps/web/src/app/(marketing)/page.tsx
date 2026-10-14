import type { Metadata } from "next";
import {
  getCachedSiteSettings,
  getCachedPopularVideos,
  getCachedOpenBatches,
  getCachedPickYourClassData,
  getCachedFacultyList,
  getCachedResults,
  getCachedTestimonials,
} from "@/server/data/cached-home";
import {
  HeroBannerCarousel,
  type HeroBannerSlide,
  type HeroPromotionalCard,
} from "@/components/marketing/hero-banner-carousel";
import { AchievementsStrip, type AchievementItem } from "@/components/marketing/achievements-strip";
import { NewAndPopularGrid } from "@/components/marketing/new-and-popular-grid";
import { AdmissionsOpenCarousel } from "@/components/marketing/admissions-open-carousel";
import { PickYourClass } from "@/components/marketing/pick-your-class";
import { ExploreTopicsChips, type PopularTopicItem } from "@/components/marketing/explore-topics-chips";
import { CurriculumGoals, type GoalConfig } from "@/components/marketing/curriculum-goals";
import { ResultsShowcase, type ResultsShowcaseProps } from "@/components/marketing/results-showcase";
import { TeachersGrid } from "@/components/marketing/teachers-grid";
import { TestimonialsCarousel } from "@/components/marketing/testimonials-carousel";
import { FaqAccordion, type FaqItem } from "@/components/marketing/faq-accordion";
import { ClosingBand } from "@/components/marketing/closing-band";

export const metadata: Metadata = {
  title: "Quick2Learn — Mathematics & Science Coaching in Mathura | Classes IX–XII CBSE & ICSE",
  description:
    "Mathura's premier coaching institute for CBSE & ICSE/ISC Classes 9 to 12. Founded by Dinesh Singh Rajput (25+ years teaching Mathematics). Proven 100/100 board results, dedicated doubt clearing, and offline & online batches.",
  keywords: [
    "maths coaching Mathura",
    "Quick2Learn",
    "Dinesh Singh Rajput",
    "Class 12 integrals lecture Hindi",
    "Class 12 Maths Coaching Mathura",
    "Class 10 CBSE Maths Mathura",
    "ICSE Chemistry Biology Mathura",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Quick2Learn — Mathematics & Science Coaching in Mathura",
    description:
      "Mathura's premier coaching institute for CBSE & ICSE/ISC Classes 9 to 12. Founded by Dinesh Singh Rajput (25+ years teaching Mathematics).",
    url: "https://quick2learn.in",
  },
};

interface ClosingBandConfig {
  title?: string;
  subtitle?: string;
  enquire_button_text?: string;
  whatsapp_button_text?: string;
}

interface ContactConfig {
  whatsapp?: string;
  phone?: string;
  email?: string;
}

/* ------------------------------------------------------------------ */
/*  Default hero banner slides (Coursera-style)                        */
/* ------------------------------------------------------------------ */

const defaultHeroBannerSlides: HeroBannerSlide[] = [
  {
    id: "slide-maths",
    headline: "Master Mathematics with 25+ years of teaching legacy",
    description:
      "Courses and coaching from Dinesh Sir — for every board, every class, every chapter. CBSE & ICSE Classes IX–XII.",
    ctaText: "Explore lectures",
    ctaHref: "/lectures",
    imageUrl: "/images/hero/banner-math.jpg",
    imageAlt:
      "Dinesh Sir teaching mathematics on a whiteboard with equations and geometric diagrams",
  },
  {
    id: "slide-science",
    headline: "Chemistry & Biology made crystal clear",
    description:
      "Concept-first approach by Namita Ma'am. Lab demonstrations, structured notes, and board-ready question practice.",
    ctaText: "Explore science lectures",
    ctaHref: "/lectures?subject=chemistry",
    imageUrl: "/images/hero/banner-science.jpg",
    imageAlt:
      "Namita Ma'am demonstrating chemistry experiments with molecular models in the lab",
  },
];

const defaultPromoCard: HeroPromotionalCard = {
  eyebrow: "Quick2Learn Results",
  title: "100/100 in Board Maths — proven year after year",
  description:
    "Join the institute that has produced top ranks in Mathura for over two decades. Reserve your seat for the 2026–27 session.",
  ctaText: "Reserve seat",
  ctaHref: "/batches",
  imageUrl: "/images/hero/promo-results.jpg",
  imageAlt: "Happy students celebrating outstanding board exam results",
};

export default async function MarketingHomePage() {
  // Fetch all cached data concurrently on the server
  const [
    allSettings,
    latestVideos,
    mostWatchedVideos,
    boardExamVideos,
    openBatches,
    pickYourClassData,
    facultyList,
    results,
    testimonials,
  ] = await Promise.all([
    getCachedSiteSettings(),
    getCachedPopularVideos("latest", 8),
    getCachedPopularVideos("most_watched", 8),
    getCachedPopularVideos("board_exam", 8),
    getCachedOpenBatches(),
    getCachedPickYourClassData(),
    getCachedFacultyList(),
    getCachedResults(),
    getCachedTestimonials(),
  ]);

  const achievements = (allSettings.achievements as AchievementItem[]) || null;
  const popularTopics = (allSettings.popular_topics as PopularTopicItem[]) || null;
  const whatBringsYouHere = (allSettings.what_brings_you_here as GoalConfig[]) || null;
  const headlineResult = (allSettings.headline_result as ResultsShowcaseProps["headlineResult"]) || null;
  const faqs = (allSettings.faqs as FaqItem[]) || null;
  const closingBand = (allSettings.closing_band as ClosingBandConfig) || null;
  const contact = (allSettings.contact as ContactConfig) || null;

  // Build hero banner slides from site_settings or use defaults
  const heroBannerSlides =
    (allSettings.hero_banner_slides as HeroBannerSlide[]) || defaultHeroBannerSlides;
  const heroPromoCard =
    (allSettings.hero_promo_card as HeroPromotionalCard) || defaultPromoCard;


  const organizationLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["EducationalOrganization", "LocalBusiness"],
        "@id": "https://quick2learn.in/#organization",
        name: "Quick2Learn",
        alternateName: "Quick2Learn Coaching Institute Mathura",
        url: "https://quick2learn.in",
        description:
          "Mathura's premier coaching institute for CBSE & ICSE/ISC Classes 9 to 12. Founded by Dinesh Singh Rajput (25+ years experience in Mathematics).",
        telephone: contact?.phone || "+91 76688 75809",
        email: contact?.email || "quick2learn23203@gmail.com",
        priceRange: "₹₹",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Mathura",
          addressLocality: "Mathura",
          addressRegion: "Uttar Pradesh",
          postalCode: "281004",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 27.4924,
          longitude: 77.6737,
        },
        founder: {
          "@type": "Person",
          name: "Dinesh Singh Rajput",
          jobTitle: "Senior Mathematics Educator & Director",
        },
        sameAs: [
          "https://www.youtube.com/@Quick2Learn",
          "https://facebook.com/quick2learn.in",
          "https://instagram.com/quick2learn.in",
          "https://twitter.com/Quick2Learn",
        ],
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      {/* 1. Hero: Coursera-style banner carousel (left) + promo card (right) */}
      <HeroBannerCarousel
        slides={heroBannerSlides}
        promoCard={heroPromoCard}
      />

      {/* 2. Achievements strip from site_settings.achievements (bg-surface-subtle) */}
      <AchievementsStrip items={achievements} />

      {/* 3. "New and popular": Coursera-style 3-column grid (bg-surface) */}
      <NewAndPopularGrid
        latestVideos={latestVideos}
        mostWatchedVideos={mostWatchedVideos}
        boardExamVideos={boardExamVideos}
        openBatches={openBatches}
      />

      {/* 4. "Admissions open": CardCarousel of BatchCards where status = open (bg-surface-subtle) */}
      <AdmissionsOpenCarousel
        batches={openBatches}
      />

      {/* 5. "Pick your class": chips IX, X, XI, XII and CBSE/ICSE toggle (bg-surface) */}
      <PickYourClass
        data={pickYourClassData}
      />

      {/* 6. "Explore subjects" chips & "Popular topics" chips (bg-surface-subtle) */}
      <ExploreTopicsChips
        popularTopics={popularTopics}
      />

      {/* 7. "What brings you here today?": 4 goals with recommended playlist & matching batch (bg-surface) */}
      <CurriculumGoals
        goals={whatBringsYouHere}
        batches={openBatches}
      />

      {/* 8. Results: StatCard with headline result & carousel/grid of featured results (bg-surface-subtle) */}
      <ResultsShowcase
        headlineResult={headlineResult}
        results={results}
      />

      {/* 9. "Meet your teachers": faculty cards linking to /faculty/[slug] (bg-surface) */}
      <TeachersGrid
        facultyList={facultyList}
      />

      {/* 10. Testimonials: TestimonialCards in a carousel (bg-surface-subtle) */}
      <TestimonialsCarousel
        testimonials={testimonials}
      />

      {/* 11. FAQ accordion from site_settings.faqs (bg-surface) */}
      <FaqAccordion
        faqs={faqs}
      />

      {/* 12. Closing band: "Admissions open for [2026–27]", "Enquire now", "Chat on WhatsApp" (bg-surface-subtle) */}
      <ClosingBand
        title={closingBand?.title}
        subtitle={closingBand?.subtitle}
        enquireButtonText={closingBand?.enquire_button_text}
        whatsappButtonText={closingBand?.whatsapp_button_text}
        whatsappPhone={contact?.whatsapp || "+91 76688 75809"}
      />
    </div>
  );
}
