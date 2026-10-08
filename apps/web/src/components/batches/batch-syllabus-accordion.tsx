import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Play, BookOpen, ArrowRight } from "lucide-react";
import type { EnrichedSyllabusModule } from "@/server/data/batches";

interface BatchSyllabusAccordionProps {
  syllabus: EnrichedSyllabusModule[];
}

export function BatchSyllabusAccordion({ syllabus }: BatchSyllabusAccordionProps) {
  if (!syllabus || syllabus.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-ink-muted">
        Detailed modular syllabus will be uploaded shortly for this session.
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue="module-0" className="border rounded-xl bg-surface">
      {syllabus.map((mod, idx) => (
        <AccordionItem key={idx} value={`module-${idx}`} className="px-5">
          <AccordionTrigger className="text-body font-bold text-ink">
            <div className="flex flex-wrap items-center gap-2.5 text-left">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-primary text-caption font-bold shrink-0">
                {idx + 1}
              </span>
              <span>{mod.module}</span>
              {mod.chapters && mod.chapters.length > 0 && (
                <span className="text-caption font-normal text-ink-muted">
                  ({mod.chapters.length} {mod.chapters.length === 1 ? "topic" : "topics"})
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="space-y-3 pt-2">
            {mod.notes && (
              <p className="text-small text-ink-muted leading-relaxed pb-2 border-b border-border/50">
                {mod.notes}
              </p>
            )}

            {mod.chapters && mod.chapters.length > 0 && (
              <div className="divide-y divide-border/60 rounded-lg border border-border/70 bg-surface-subtle overflow-hidden">
                {mod.chapters.map((ch, chIdx) => (
                  <div
                    key={chIdx}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="h-4 w-4 text-ink-muted shrink-0" />
                      <span className="text-small font-medium text-ink truncate">
                        {ch.title}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {ch.hasFreePreview && ch.previewUrl ? (
                        <Link
                          href={ch.previewUrl}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-primary hover:bg-primary hover:text-surface transition-colors text-caption font-semibold group cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Free preview</span>
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <span className="text-caption text-ink-muted">
                          In-class module
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
