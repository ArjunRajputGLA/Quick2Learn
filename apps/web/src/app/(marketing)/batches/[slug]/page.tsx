import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBatchDetailBySlug, getBatchesWithFilters } from "@/server/data/batches";
import { getCurrentUser } from "@/server/auth/session";
import { BatchPageContent } from "@/components/batches/batch-page-content";
import type { AuthUser } from "@/server/authz";

interface BatchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const batches = await getBatchesWithFilters();
  return batches.map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({
  params,
}: BatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBatchDetailBySlug(slug);

  if (!data) {
    return { title: "Batch Not Found | Quick2Learn" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const desc =
    data.batch.subtitle ||
    data.batch.description.substring(0, 160) ||
    "Coaching batch in Mathura by Quick2Learn.";

  return {
    title: `${data.batch.title} | Quick2Learn Mathura`,
    description: desc,
    alternates: {
      canonical: `/batches/${slug}`,
    },
    openGraph: {
      title: `${data.batch.title} | Quick2Learn Mathura`,
      description: desc,
      url: `${baseUrl}/batches/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.batch.title} | Quick2Learn Mathura`,
      description: desc,
    },
  };
}

export default async function BatchDetailPage({
  params,
  searchParams,
}: BatchPageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const currentUser = await getCurrentUser();
  const authUser: AuthUser | null = currentUser
    ? {
        id: currentUser.user.id,
        email: currentUser.user.email,
        name: currentUser.user.name,
        role: currentUser.role,
      }
    : null;

  const data = await getBatchDetailBySlug(slug, {
    preview: preview === "1",
    user: authUser,
  });

  if (!data) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const primaryFee = data.feePlans[0]?.totalPaise ? (data.feePlans[0].totalPaise / 100).toFixed(2) : "0";

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: data.batch.title,
    description: data.batch.description,
    provider: {
      "@type": "Organization",
      name: "Quick2Learn",
      sameAs: "https://quick2learn.in",
    },
    offers: data.feePlans.length > 0
      ? data.feePlans.map((p) => ({
          "@type": "Offer",
          category: "Paid",
          price: (p.totalPaise / 100).toFixed(2),
          priceCurrency: "INR",
          availability:
            data.batch.status === "open"
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
          url: `${baseUrl}/batches/${data.batch.slug}`,
        }))
      : [
          {
            "@type": "Offer",
            category: "Paid",
            price: primaryFee,
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            url: `${baseUrl}/batches/${data.batch.slug}`,
          },
        ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode:
        data.batch.mode === "offline"
          ? "onsite"
          : data.batch.mode === "online"
            ? "online"
            : "blended",
      location: {
        "@type": "Place",
        name: "Quick2Learn Institute Campus",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Mathura",
          addressLocality: "Mathura",
          addressRegion: "Uttar Pradesh",
          postalCode: "281004",
          addressCountry: "IN",
        },
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
      <BatchPageContent data={data} isLoggedIn={Boolean(currentUser)} />
    </>
  );
}
