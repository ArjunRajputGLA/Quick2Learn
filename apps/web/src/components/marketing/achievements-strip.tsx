import * as React from "react";
import {
  Award,
  Medal,
  Lightbulb,
  GraduationCap,
  Star,
  CheckCircle2,
  Trophy,
} from "lucide-react";

export interface AchievementItem {
  icon?: string;
  text: string;
}

export interface AchievementsStripProps {
  items?: AchievementItem[] | null;
}

function getIconComponent(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case "award":
      return Award;
    case "medal":
      return Medal;
    case "lightbulb":
      return Lightbulb;
    case "graduationcap":
    case "graduation_cap":
      return GraduationCap;
    case "trophy":
      return Trophy;
    case "star":
      return Star;
    default:
      return CheckCircle2;
  }
}

export function AchievementsStrip({ items }: AchievementsStripProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="bg-surface-subtle border-y border-border py-8 md:py-10">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 items-center">
          {items.map((item, index) => {
            const Icon = getIconComponent(item.icon);
            return (
              <div
                key={index}
                className="group flex items-center gap-3.5 p-3.5 rounded-xl bg-surface/80 border border-border/80 shadow-xs hover:bg-surface hover:shadow-card hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 ease-out cursor-default"
              >
                <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-2xs">
                  <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                </div>
                <p className="text-small font-semibold text-ink leading-snug group-hover:text-primary transition-colors">
                  {item.text?.replace(/\s*\[PLACEHOLDER\]/gi, "")}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
