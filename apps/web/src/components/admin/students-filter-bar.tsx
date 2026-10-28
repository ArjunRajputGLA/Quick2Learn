"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2, RotateCcw } from "lucide-react";

interface StudentsFilterBarProps {
  initialSearch?: string;
  initialClass?: number;
  initialBoard?: string;
  initialDues?: boolean;
}

export function StudentsFilterBar({
  initialSearch = "",
  initialClass,
  initialBoard = "",
  initialDues,
}: StudentsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [classFilter, setClassFilter] = useState(initialClass ? String(initialClass) : "");
  const [boardFilter, setBoardFilter] = useState(initialBoard || "");
  const [duesFilter, setDuesFilter] = useState(
    initialDues === true ? "true" : initialDues === false ? "false" : ""
  );

  // Sync internal state if URL parameters change externally
  useEffect(() => {
    setSearchTerm(searchParams.get("q") || "");
    setClassFilter(searchParams.get("class") || "");
    setBoardFilter(searchParams.get("board") || "");
    setDuesFilter(searchParams.get("dues") || "");
  }, [searchParams]);

  const updateFilters = (newQ?: string, newClass?: string, newBoard?: string, newDues?: string) => {
    const qVal = newQ !== undefined ? newQ : searchTerm;
    const classVal = newClass !== undefined ? newClass : classFilter;
    const boardVal = newBoard !== undefined ? newBoard : boardFilter;
    const duesVal = newDues !== undefined ? newDues : duesFilter;

    const params = new URLSearchParams();
    if (qVal.trim()) params.set("q", qVal.trim());
    if (classVal) params.set("class", classVal);
    if (boardVal) params.set("board", boardVal);
    if (duesVal) params.set("dues", duesVal);

    startTransition(() => {
      const url = params.toString() ? `/admin/students?${params.toString()}` : "/admin/students";
      router.replace(url, { scroll: false });
    });
  };

  // Debounced search on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (searchTerm.trim() !== currentQ.trim()) {
        updateFilters(searchTerm);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClearSearch = () => {
    setSearchTerm("");
    updateFilters("");
  };

  const handleResetAll = () => {
    setSearchTerm("");
    setClassFilter("");
    setBoardFilter("");
    setDuesFilter("");
    startTransition(() => {
      router.replace("/admin/students", { scroll: false });
    });
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || classFilter || boardFilter || duesFilter
  );

  return (
    <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateFilters(searchTerm);
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5"
      >
        {/* Real-time Search Input */}
        <div className="relative lg:col-span-2">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone... (shows live)"
            className="w-full pl-8 pr-7 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Class Filter */}
        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            updateFilters(undefined, e.target.value);
          }}
          className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        >
          <option value="">All Classes (IX–XII)</option>
          <option value="9">Class IX (9th)</option>
          <option value="10">Class X (10th)</option>
          <option value="11">Class XI (11th)</option>
          <option value="12">Class XII (12th)</option>
        </select>

        {/* Board Filter */}
        <select
          value={boardFilter}
          onChange={(e) => {
            setBoardFilter(e.target.value);
            updateFilters(undefined, undefined, e.target.value);
          }}
          className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
        >
          <option value="">All Boards</option>
          <option value="cbse">CBSE</option>
          <option value="icse">ICSE</option>
          <option value="isc">ISC</option>
        </select>

        {/* Dues Filter & Reset Action */}
        <div className="flex items-center gap-2">
          <select
            value={duesFilter}
            onChange={(e) => {
              setDuesFilter(e.target.value);
              updateFilters(undefined, undefined, undefined, e.target.value);
            }}
            className="flex-1 px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          >
            <option value="">All Fee Statuses</option>
            <option value="true">Has Overdue Dues</option>
            <option value="false">All Fees Paid Up</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAll}
              className="h-8 px-2.5 flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

