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
    <Accordion type="multiple" defaultValue={["module-0", "module-1"]} className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100 shadow-xs overflow-hidden">
      {syllabus.map((mod, idx) => (
        <AccordionItem key={idx} value={`module-${idx}`} className="px-6 py-1 border-none">
          <AccordionTrigger className="text-base font-bold text-slate-900 hover:text-primary py-4">
            <div className="flex flex-wrap items-center gap-3 text-left">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black shrink-0 border border-primary/20">
                0{idx + 1}
              </span>
              <span className="text-base sm:text-lg">{mod.module}</span>
              {mod.chapters && mod.chapters.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {mod.chapters.length} {mod.chapters.length === 1 ? "Chapter" : "Chapters"}
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="space-y-4 pt-1 pb-5">
            {mod.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-small text-slate-600 leading-relaxed font-medium">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1">
                  Core Topics Covered:
                </span>
                {mod.notes}
              </div>
            )}

            {mod.chapters && mod.chapters.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                {mod.chapters.map((ch, chIdx) => (
                  <div
                    key={chIdx}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="text-xs sm:text-small font-semibold text-slate-900 truncate">
                        {ch.title}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {ch.hasFreePreview && ch.previewUrl ? (
                        <Link
                          href={ch.previewUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold group cursor-pointer shadow-2xs"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Free preview</span>
                          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          In-class classroom module
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
