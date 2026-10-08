"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Badge,
  Chip,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Tooltip,
  Skeleton,
  Avatar,
  Breadcrumbs,
  Pagination,
  SearchBar,
  ChipRow,
  LectureCard,
  BatchCard,
  CardCarousel,
  StatCard,
  TestimonialCard,
  SectionHeader,
  EmptyState,
} from "@/components/ui";
import { MathText } from "@/components/ui/math-text";
import {
  Sparkles,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
} from "lucide-react";

export function DevUiClient() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetSide, setSheetSide] = React.useState<"right" | "bottom">("right");
  const [selectedChipId, setSelectedChipId] = React.useState("class-12");
  const [singleChipSelected, setSingleChipSelected] = React.useState(true);
  const [checkboxValue, setCheckboxValue] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [carouselTab, setCarouselTab] = React.useState("all");

  const chipOptions = [
    { id: "all", label: "All Classes" },
    { id: "class-12", label: "Class XII (CBSE/ISC)" },
    { id: "class-11", label: "Class XI (CBSE/ISC)" },
    { id: "class-10", label: "Class X (CBSE/ICSE)" },
    { id: "class-9", label: "Class IX (Foundation)" },
  ];

  const carouselTabs = [
    { id: "all", label: "All Lectures" },
    { id: "maths", label: "Mathematics" },
    { id: "science", label: "ICSE Science" },
  ];

  const sampleLectures = [
    {
      id: "lec-1",
      title: "Definite Integrals using Substitution: $\\int_{0}^{1} x \\sqrt{1-x^2} dx$",
      duration: "28:45",
      gradeAndSubject: "Class XII · Maths",
      faculty: "Dinesh Sir",
      views: "14K views",
      publishedAt: "2 days ago",
    },
    {
      id: "lec-2",
      title: "Matrix Inversion & System of Linear Equations $AX = B$",
      duration: "34:10",
      gradeAndSubject: "Class XII · Maths",
      faculty: "Dinesh Sir",
      views: "18K views",
      publishedAt: "5 days ago",
    },
    {
      id: "lec-3",
      title: "Electrolysis & Faraday’s Laws for ICSE Board Examinations",
      duration: "22:15",
      gradeAndSubject: "Class X · Chemistry",
      faculty: "Namita Ma'am",
      views: "9.2K views",
      publishedAt: "1 week ago",
    },
    {
      id: "lec-4",
      title: "Application of Derivatives: Maxima and Minima Word Problems",
      duration: "41:20",
      gradeAndSubject: "Class XII · Maths",
      faculty: "Dinesh Sir",
      views: "21K views",
      publishedAt: "2 weeks ago",
    },
  ];

  const sampleBatches = [
    {
      id: "batch-1",
      title: "Senior Secondary Mathematics Masterclass 2026–27",
      grade: "Class XII",
      board: "CBSE",
      facultyName: "Mr. Dinesh Singh Rajput",
      schedule: "Mon–Sat · 4:30–6:00 PM IST",
      pricePaise: 1800000,
      originalPricePaise: 2400000,
      admissionsOpen: true,
    },
    {
      id: "batch-2",
      title: "ICSE Science Accelerator: Chemistry & Biology",
      grade: "Class X",
      board: "ICSE",
      facultyName: "Mrs. Namita Singh Rajput",
      schedule: "Tue, Thu, Sat · 5:00–6:30 PM IST",
      pricePaise: 1500000,
      originalPricePaise: 2000000,
      admissionsOpen: true,
    },
    {
      id: "batch-3",
      title: "Class XI Mathematics: Calculus & Coordinate Geometry",
      grade: "Class XI",
      board: "CBSE/ISC",
      facultyName: "Mr. Dinesh Singh Rajput",
      schedule: "Mon, Wed, Fri · 6:30–8:00 PM IST",
      pricePaise: 1600000,
      admissionsOpen: true,
    },
  ];

  return (
    <div className="space-y-16">
      {/* SECTION 1: COLOR TOKENS & VISUAL IDENTITY */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Color Palette & Radii"
          title="1. Design Tokens"
          description="Tailwind v4 @theme tokens. High-contrast typography, crisp borders, and calm surfaces."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-primary border border-primary" />
            <div className="text-caption font-semibold text-ink">primary</div>
            <div className="text-[11px] text-ink-muted">Main Brand Blue</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-primary-hover border border-primary-hover" />
            <div className="text-caption font-semibold text-ink">primary-hover</div>
            <div className="text-[11px] text-ink-muted">Interactive state</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-primary-soft border border-border" />
            <div className="text-caption font-semibold text-ink">primary-soft</div>
            <div className="text-[11px] text-ink-muted">Tinted backgrounds</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-accent border border-accent" />
            <div className="text-caption font-semibold text-ink">accent</div>
            <div className="text-[11px] text-ink-muted">Admissions & highlights</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-accent-soft border border-border" />
            <div className="text-caption font-semibold text-ink">accent-soft</div>
            <div className="text-[11px] text-ink-muted">Warm badge fills</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-ink border border-ink" />
            <div className="text-caption font-semibold text-ink">ink</div>
            <div className="text-[11px] text-ink-muted">High-contrast text</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-ink-muted border border-border" />
            <div className="text-caption font-semibold text-ink">ink-muted</div>
            <div className="text-[11px] text-ink-muted">Secondary text</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-surface border border-border" />
            <div className="text-caption font-semibold text-ink">surface</div>
            <div className="text-[11px] text-ink-muted">Pure white card fill</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-surface-subtle border border-border" />
            <div className="text-caption font-semibold text-ink">surface-subtle</div>
            <div className="text-[11px] text-ink-muted">Calm page background</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-border border border-border" />
            <div className="text-caption font-semibold text-ink">border</div>
            <div className="text-[11px] text-ink-muted">1px divider lines</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-success border border-success" />
            <div className="text-caption font-semibold text-ink">success</div>
            <div className="text-[11px] text-ink-muted">Badges & passes</div>
          </div>

          <div className="space-y-1.5 p-3 rounded-md border border-border bg-surface">
            <div className="h-12 w-full rounded-sm bg-danger border border-danger" />
            <div className="text-caption font-semibold text-ink">danger</div>
            <div className="text-[11px] text-ink-muted">Errors & alerts</div>
          </div>
        </div>

        {/* Shadows and Radii */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-sm border border-border bg-surface">
            <span className="text-small font-semibold text-ink">Radius: sm (6px)</span>
            <p className="text-caption text-ink-muted mt-1">Used for small tags, tooltips, and checkboxes.</p>
          </div>
          <div className="p-4 rounded-md border border-border bg-surface shadow-card">
            <span className="text-small font-semibold text-ink">Radius: md (8px) + shadow-card</span>
            <p className="text-caption text-ink-muted mt-1">Standard for cards, inputs, and primary buttons.</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface shadow-card-hover">
            <span className="text-small font-semibold text-ink">Radius: lg (12px) + shadow-card-hover</span>
            <p className="text-caption text-ink-muted mt-1">Feature tiles, modals, and hover elevations.</p>
          </div>
        </div>
      </section>

      {/* SECTION 2: TYPOGRAPHY SCALE */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Typography & Multilingual Support"
          title="2. Typographic Hierarchy"
          description="Inter font paired with Noto Sans Devanagari fallback for Hindi lectures and terminology."
        />

        <div className="rounded-md border border-border bg-surface divide-y divide-border">
          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Display (48/56)
            </span>
            <div className="text-display text-ink flex-1">
              Quick2Learn Academic Excellence
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Heading 1 (36/44)
            </span>
            <div className="text-h1 text-ink flex-1">
              Mathematics & Sciences Coaching
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Heading 2 (28/36)
            </span>
            <div className="text-h2 text-ink flex-1">
              Secondary & Senior Secondary Batches
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Heading 3 (20/28)
            </span>
            <div className="text-h3 text-ink flex-1">
              Class XII Calculus and Three-Dimensional Geometry
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Body (16/24)
            </span>
            <div className="text-body text-ink flex-1">
              Comprehensive classroom coaching designed for CBSE and ICSE students in Mathura,
              featuring weekly diagnostic problem sets and personal doubt resolution.
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Small (14/20)
            </span>
            <div className="text-small text-ink-muted flex-1">
              Timetable updates, batch seat confirmations, and assignment deadlines are displayed in Asia/Kolkata timezone.
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
            <span className="text-caption font-semibold text-ink-muted uppercase w-36 shrink-0">
              Caption (12/16)
            </span>
            <div className="text-caption text-ink-muted flex-1">
              © Quick2Learn · Mathura, Uttar Pradesh · Dinesh Singh Rajput & Namita Singh Rajput
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-2 bg-surface-subtle/50">
            <span className="text-caption font-semibold text-primary uppercase w-36 shrink-0">
              Hindi Script
            </span>
            <div className="text-h3 font-medium text-ink flex-1">
              कक्षा १२ गणित — अवकलन एवं समाकलन के महत्वपूर्ण प्रश्न (Dinesh Sir Lectures)
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: MATHEMATICS (KATEX) */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="STEM Formula Rendering"
          title="3. Server-Side Mathematics (<MathText>)"
          description="Inline $...$ and display $$...$$ rendered using KaTeX with zero client layout shift."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-md border border-border bg-surface space-y-4">
            <h4 className="text-h3 font-semibold text-ink">Inline Mathematical Expressions</h4>
            <div className="space-y-3 text-body text-ink">
              <p>
                Pythagoras Theorem: <MathText content="$a^2 + b^2 = c^2$" /> in right triangles.
              </p>
              <p>
                Mass-Energy Equivalence: <MathText content="$E = mc^2$" />.
              </p>
              <p>
                Quadratic formula: <MathText content="$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$" />.
              </p>
              <p>
                Trigonometric Identity: <MathText content="$\sin^2(\theta) + \cos^2(\theta) = 1$" />.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-md border border-border bg-surface space-y-4">
            <h4 className="text-h3 font-semibold text-ink">Display Equations ($$...$$)</h4>
            <div className="space-y-4 text-body text-ink">
              <div>
                <span className="text-caption font-semibold uppercase text-ink-muted block">Definite Integral:</span>
                <MathText content="$$\int_{0}^{\pi} \sin(x) \, dx = 2$$" />
              </div>

              <div>
                <span className="text-caption font-semibold uppercase text-ink-muted block">Matrix Determinant:</span>
                <MathText content="$$\det(A) = \begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$$" />
              </div>

              <div>
                <span className="text-caption font-semibold uppercase text-ink-muted block">Fundamental Limit:</span>
                <MathText content="$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: BASE UI CONTROLS */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Interactive Elements"
          title="4. Base UI Primitives"
          description="shadcn-compatible components restyled to the Quick2Learn token system."
        />

        {/* Buttons Gallery */}
        <div className="p-6 rounded-md border border-border bg-surface space-y-6">
          <h4 className="text-h3 font-semibold text-ink">Buttons</h4>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg">Primary LG</Button>
            <Button variant="primary" size="md">Primary MD</Button>
            <Button variant="primary" size="sm">Primary SM</Button>
            <Button variant="outline" size="md">Outline</Button>
            <Button variant="ghost" size="md">Ghost</Button>
            <Button variant="link" size="md">Link Style</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </div>
        </div>

        {/* Form Controls */}
        <div className="p-6 rounded-md border border-border bg-surface space-y-6">
          <h4 className="text-h3 font-semibold text-ink">Form Controls & Inputs</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-small font-semibold text-ink">Pill Search Bar</label>
              <SearchBar placeholder="Search math formulas or topics..." />
            </div>

            <div className="space-y-2">
              <label className="text-small font-semibold text-ink">Standard Input</label>
              <Input placeholder="Enter student phone number..." />
            </div>

            <div className="space-y-2">
              <label className="text-small font-semibold text-ink">Select Dropdown</label>
              <Select defaultValue="cbse">
                <option value="cbse">CBSE Board</option>
                <option value="icse">ICSE Board</option>
                <option value="isc">ISC Board</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-small font-semibold text-ink">Textarea</label>
              <Textarea rows={3} placeholder="Provide specific student learning goals or previous marks..." />
            </div>

            <div className="space-y-4">
              <label className="text-small font-semibold text-ink block">Checkbox</label>
              <div className="space-y-2">
                <Checkbox
                  label="Receive lecture alerts on WhatsApp"
                  checked={checkboxValue}
                  onCheckedChange={setCheckboxValue}
                />
                <Checkbox label="Opt-in to weekly Mathura offline mock test notifications" defaultChecked />
                <Checkbox label="Disabled option" disabled />
              </div>
            </div>
          </div>
        </div>

        {/* Badges & Chips */}
        <div className="p-6 rounded-md border border-border bg-surface space-y-6">
          <h4 className="text-h3 font-semibold text-ink">Badges & Selectable Chips</h4>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">neutral badge</Badge>
            <Badge variant="primary">primary badge</Badge>
            <Badge variant="accent">Admissions open</Badge>
            <Badge variant="success">98% Distinction</Badge>
          </div>

          <div className="pt-2 space-y-2">
            <span className="text-small font-semibold text-ink block">Selectable Chip Row</span>
            <ChipRow
              options={chipOptions}
              selectedId={selectedChipId}
              onSelect={setSelectedChipId}
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Chip
              selected={singleChipSelected}
              onSelectedChange={setSingleChipSelected}
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              Toggleable Chip: {singleChipSelected ? "Selected" : "Unselected"}
            </Chip>
          </div>
        </div>

        {/* Navigation & Overlays */}
        <div className="p-6 rounded-md border border-border bg-surface space-y-6">
          <h4 className="text-h3 font-semibold text-ink">Overlays, Modals, Drawers & Toasts</h4>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              Open Dialog Modal
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSheetSide("right");
                setSheetOpen(true);
              }}
            >
              Open Mobile Sheet Drawer (Right)
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setSheetSide("bottom");
                setSheetOpen(true);
              }}
            >
              Open Sheet (Bottom)
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                toast.success("Batch registration inquiry submitted successfully!", {
                  description: "Dinesh Sir's coaching staff will contact you shortly.",
                });
              }}
            >
              Trigger Sonner Toast
            </Button>

            <Tooltip content="Coaching institute located in Mathura, Uttar Pradesh">
              <Button variant="ghost">Hover for Tooltip</Button>
            </Tooltip>
          </div>

          {/* Underline Tabs */}
          <div className="pt-4 space-y-3">
            <span className="text-small font-semibold text-ink block">Underline Tabs</span>
            <Tabs defaultValue="maths">
              <TabsList>
                <TabsTrigger value="maths">Senior Mathematics (Dinesh Sir)</TabsTrigger>
                <TabsTrigger value="science">ICSE Science (Namita Ma&apos;am)</TabsTrigger>
                <TabsTrigger value="test-series">Board Test Series</TabsTrigger>
              </TabsList>
              <TabsContent value="maths">
                <p className="text-body text-ink-muted">
                  Focuses on NCERT, Exemplar, RD Sharma, and past 15 years CBSE Board questions.
                </p>
              </TabsContent>
              <TabsContent value="science">
                <p className="text-body text-ink-muted">
                  Concise ICSE Selina Chemistry & Biology chapter walkthroughs with experiment diagrams.
                </p>
              </TabsContent>
              <TabsContent value="test-series">
                <p className="text-body text-ink-muted">
                  Full-length 3-hour invigilated test series simulated for authentic board exam conditions.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Accordion */}
          <div className="pt-4 space-y-3">
            <span className="text-small font-semibold text-ink block">Accordion FAQs</span>
            <Accordion type="single" defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger>What boards and grades are mentored at Quick2Learn?</AccordionTrigger>
                <AccordionContent>
                  Quick2Learn provides dedicated mentoring for Classes IX, X, XI, and XII across both
                  CBSE and ICSE/ISC curriculum standards.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Who are the primary instructors?</AccordionTrigger>
                <AccordionContent>
                  Mr. Dinesh Singh Rajput (Senior Mathematics with 25+ years teaching legacy) and
                  Mrs. Namita Singh Rajput (Senior ICSE Chemistry and Biology specialist).
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Where is the coaching institute located?</AccordionTrigger>
                <AccordionContent>
                  The institute is located in Mathura, Uttar Pradesh, India.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Breadcrumbs & Pagination */}
          <div className="pt-4 space-y-4">
            <div>
              <span className="text-small font-semibold text-ink block mb-2">Breadcrumbs</span>
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Courses", href: "#" },
                  { label: "Class XII CBSE", href: "#" },
                  { label: "Calculus Masterclass" },
                ]}
              />
            </div>

            <div>
              <span className="text-small font-semibold text-ink block mb-2">Pagination</span>
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* Avatars & Skeletons */}
          <div className="pt-4 space-y-4">
            <div>
              <span className="text-small font-semibold text-ink block mb-2">Avatars & Skeletons</span>
              <div className="flex items-center gap-4">
                <Avatar fallback="Dinesh Singh" size="lg" />
                <Avatar fallback="Namita Singh" size="md" />
                <Avatar fallback="Quick Learn" size="sm" />
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: COMPOSITE COMPONENTS */}
      <section className="space-y-8">
        <SectionHeader
          eyebrow="Composite Components"
          title="5. Cards & Carousels"
          description="High-fidelity building blocks for learning discovery and batch enrollment."
        />

        {/* CardCarousel with Lecture Cards */}
        <div className="p-6 rounded-md border border-border bg-surface">
          <CardCarousel
            heading="Featured Video Lectures"
            tabs={carouselTabs}
            activeTabId={carouselTab}
            onTabChange={setCarouselTab}
            viewAllHref="https://www.youtube.com/@Quick2Learn"
            viewAllText="Watch on YouTube"
          >
            {sampleLectures.map((lec) => (
              <LectureCard
                key={lec.id}
                id={lec.id}
                title={lec.title}
                duration={lec.duration}
                gradeAndSubject={lec.gradeAndSubject}
                faculty={lec.faculty}
                views={lec.views}
                publishedAt={lec.publishedAt}
              />
            ))}
          </CardCarousel>
        </div>

        {/* Batch Cards Grid */}
        <div className="space-y-4">
          <h4 className="text-h3 font-semibold text-ink">Batch Cards Grid</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleBatches.map((batch) => (
              <BatchCard
                key={batch.id}
                id={batch.id}
                title={batch.title}
                grade={batch.grade}
                board={batch.board}
                facultyName={batch.facultyName}
                schedule={batch.schedule}
                pricePaise={batch.pricePaise}
                originalPricePaise={batch.originalPricePaise}
                admissionsOpen={batch.admissionsOpen}
              />
            ))}
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="space-y-4">
          <h4 className="text-h3 font-semibold text-ink">Stat Cards</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              value="25+"
              label="Years Experience"
              description="Dedicated mathematics coaching in Mathura."
              icon={<Award className="h-5 w-5" />}
            />
            <StatCard
              value="10,000+"
              label="Students Mentored"
              description="Across CBSE and ICSE/ISC boards."
              icon={<Users className="h-5 w-5" />}
              trend="↑ Consistent Toppers"
            />
            <StatCard
              value="98.4%"
              label="Distinction Rate"
              description="In Senior Secondary Board examinations."
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              value="Mathura"
              label="Institute Campus"
              description="Single dedicated physical classroom."
              icon={<GraduationCap className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-4">
          <h4 className="text-h3 font-semibold text-ink">Testimonial Cards</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard
              studentName="Aarav Sharma"
              achievement="99/100 in Class XII Maths"
              schoolOrCity="St. Dominic's, Mathura"
              quote="Dinesh Sir makes calculus feel intuitive. The way differential equations and integration were drilled gave me 100% confidence in the CBSE board exam."
              stars={5}
            />
            <TestimonialCard
              studentName="Priya Agrawal"
              achievement="98% ICSE Science"
              schoolOrCity="Sacred Heart, Mathura"
              quote="Namita Ma'am's chemistry balancing techniques and biology diagram guidelines directly matched every question that appeared in the board paper."
              stars={5}
            />
          </div>
        </div>

        {/* Empty State */}
        <div className="space-y-4">
          <h4 className="text-h3 font-semibold text-ink">Empty State</h4>
          <EmptyState
            title="No Lectures Found for Selected Filter"
            description="We couldn't find any recorded lectures matching your filter. Try choosing another grade or reset your query."
            actionLabel="Reset Filters"
            onAction={() => setSelectedChipId("all")}
          />
        </div>
      </section>

      {/* DIALOG MODAL INSTANCE */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>Quick2Learn Admission Confirmation</DialogTitle>
          <DialogDescription>
            You are registering interest for Class XII CBSE Mathematics batch with Mr. Dinesh Singh Rajput.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 text-small text-ink">
          <p>
            Batch timings: <strong>Mon–Sat · 4:30–6:00 PM IST</strong>
          </p>
          <p>
            Institute: <strong>Mathura Campus</strong>
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setDialogOpen(false);
              toast.success("Inquiry confirmed!");
            }}
          >
            Confirm Inquiry
          </Button>
        </DialogFooter>
      </Dialog>

      {/* SHEET DRAWER INSTANCE */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} side={sheetSide}>
        <SheetHeader>
          <SheetTitle>Mobile Navigation & Filter Tray</SheetTitle>
          <SheetDescription>
            Quick2Learn curriculum filtering and student portal shortcuts.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <span className="text-small font-semibold text-ink">Select Grade</span>
            <ChipRow
              options={chipOptions}
              selectedId={selectedChipId}
              onSelect={setSelectedChipId}
              wrap
            />
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setSheetOpen(false)}
            >
              Apply Filter Selection
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
