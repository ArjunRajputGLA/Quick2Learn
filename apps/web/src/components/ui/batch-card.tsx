import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatINR } from "@quick2learn/shared";
import { cn } from "@/lib/utils";

export interface BatchCardProps {
  id: string;
  title: string;
  grade: string; // e.g. "Class XII"
  board: string; // e.g. "CBSE"
  facultyName: string; // e.g. "Dinesh Singh Rajput"
  facultyAvatar?: string | null;
  schedule: string; // e.g. "Mon–Sat · 5–6 PM"
  pricePaise: number; // integer paise
  originalPricePaise?: number; // integer paise for struck-through discount
  admissionsOpen?: boolean;
  coverImageUrl?: string;
  href?: string;
  className?: string;
}

export function BatchCard({
  title,
  grade,
  board,
  facultyName,
  facultyAvatar,
  schedule,
  pricePaise,
  originalPricePaise,
  admissionsOpen = true,
  coverImageUrl,
  href = "#",
  className,
}: BatchCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200",
        className,
      )}
    >
      {/* Cover / Header section */}
      <div className="relative h-36 w-full overflow-hidden bg-surface-subtle">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-linear-to-br from-primary-soft via-surface-subtle to-surface p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                Quick2Learn Batch
              </span>
              <Calendar className="h-5 w-5 text-primary/40" />
            </div>
            <div className="h-2 w-16 bg-primary/20 rounded-full" />
          </div>
        )}

        {/* Admissions open badge on top-right */}
        {admissionsOpen && (
          <div className="absolute top-3 right-3">
            <Badge variant="accent">Admissions open</Badge>
          </div>
        )}

        {/* Grade & Board badges */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <Badge variant="primary">{grade}</Badge>
          <Badge variant="neutral">{board}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 justify-between">
        <div className="space-y-3">
          <Link href={href}>
            <h4 className="text-body font-semibold text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug">
              {title}
            </h4>
          </Link>

          {/* Teacher details */}
          <div className="flex items-center gap-2.5">
            <Avatar
              src={facultyAvatar}
              fallback={facultyName}
              size="sm"
            />
            <span className="text-small font-medium text-ink">{facultyName}</span>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-1.5 text-small text-ink-muted">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{schedule}</span>
          </div>
        </div>

        {/* Price row */}
        <div className="mt-5 pt-3.5 border-t border-border flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-h3 font-bold text-ink">
              {formatINR(pricePaise)}
            </span>
            {originalPricePaise && originalPricePaise > pricePaise && (
              <span className="text-small text-ink-muted line-through">
                {formatINR(originalPricePaise)}
              </span>
            )}
          </div>
          <Link
            href={href}
            className="text-small font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
