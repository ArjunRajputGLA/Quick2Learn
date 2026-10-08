import Link from "next/link";
import { AuthNav } from "./auth-nav";
import { MegaMenu } from "./mega-menu";
import { SearchTypeahead } from "./search-typeahead";
import { MobileNav } from "./mobile-nav";
import { type MegaMenuData } from "@/server/data/catalog";

interface HeaderProps {
  megaMenuData: MegaMenuData;
}

export function Header({ megaMenuData }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/98 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Wordmark Logo & Explore Mega-Menu Button */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 group select-none"
              aria-label="Quick2Learn Home"
            >
              <span className="font-extrabold text-h3 tracking-tight text-ink group-hover:opacity-95 transition-opacity">
                Quick<span className="text-primary">2</span>Learn
              </span>
            </Link>

            {/* Desktop Explore Mega-Menu */}
            <div className="hidden lg:block">
              <MegaMenu data={megaMenuData} />
            </div>
          </div>

          {/* Centre: Pill-shaped Search Input with Typeahead (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center max-w-lg mx-4">
            <SearchTypeahead className="w-full" />
          </div>

          {/* Right: Navigation Links & Auth State */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Desktop Quick Nav Links */}
            <nav className="hidden lg:flex items-center gap-5">
              <Link
                href="/batches"
                className="text-small font-medium text-ink hover:text-primary transition-colors"
              >
                Batches
              </Link>
              <Link
                href="/lectures"
                className="text-small font-medium text-ink hover:text-primary transition-colors"
              >
                Free Lectures
              </Link>
            </nav>

            {/* Desktop Auth State */}
            <div className="hidden lg:block">
              <AuthNav />
            </div>

            {/* Mobile Actions: Search Trigger & Hamburger Sheet (< 1024px) */}
            <MobileNav data={megaMenuData} />
          </div>
        </div>
      </div>
    </header>
  );
}
