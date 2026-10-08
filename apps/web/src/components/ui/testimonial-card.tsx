import * as React from "react";
import { Quote, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface TestimonialCardProps {
  quote: string;
  studentName: string;
  achievement: string; // e.g. "98/100 in CBSE Class XII Maths"
  schoolOrCity?: string; // e.g. "Mathura"
  avatarSrc?: string | null;
  stars?: number;
  className?: string;
}

export function TestimonialCard({
  quote,
  studentName,
  achievement,
  schoolOrCity = "Mathura",
  avatarSrc,
  stars = 5,
  className,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-md border border-border bg-surface p-6 shadow-card hover:shadow-card-hover transition-all duration-200",
        className,
      )}
    >
      <div className="space-y-4">
        {/* Rating stars & Quote icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-accent">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-current" />
            ))}
          </div>
          <Quote className="h-5 w-5 text-border" />
        </div>

        {/* Quote text */}
        <p className="text-body text-ink leading-relaxed italic">
          “{quote}”
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar src={avatarSrc} fallback={studentName} size="sm" />
          <div>
            <h5 className="text-small font-semibold text-ink leading-tight">
              {studentName}
            </h5>
            <span className="text-caption text-ink-muted">{schoolOrCity}</span>
          </div>
        </div>
        <Badge variant="success">{achievement}</Badge>
      </div>
    </div>
  );
}
