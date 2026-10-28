"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatClassRoman } from "@quick2learn/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ExternalLink,
  Edit,
  Search,
  X,
  BookOpen,
} from "lucide-react";

export interface BatchListItem {
  batch: {
    id: string;
    title: string;
    slug: string;
    classLevel: number;
    board: string;
    mode: string;
    status: string;
    seatsTotal: number;
    isFeatured: boolean;
    joinCode?: string | null;
  };
  facultyName: string | null;
  subjectName: string | null;
  activeEnrolled: number;
}

interface BatchesClientProps {
  batches: BatchListItem[];
  userRole: string;
}

export function BatchesClient({ batches, userRole }: BatchesClientProps) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [boardFilter, setBoardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBatches = useMemo(() => {
    return batches.filter(({ batch, facultyName, subjectName }) => {
      if (classFilter !== "all" && String(batch.classLevel) !== classFilter) return false;
      if (boardFilter !== "all" && batch.board.toLowerCase() !== boardFilter.toLowerCase()) return false;
      if (statusFilter !== "all" && batch.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = batch.title.toLowerCase().includes(q);
        const matchSlug = batch.slug.toLowerCase().includes(q);
        const matchSubject = subjectName ? subjectName.toLowerCase().includes(q) : false;
        const matchFaculty = facultyName ? facultyName.toLowerCase().includes(q) : false;
        const matchJoinCode = batch.joinCode ? batch.joinCode.toLowerCase().includes(q) : false;
        const matchClass = `class ${batch.classLevel}`.includes(q) || `class ${formatClassRoman(batch.classLevel)}`.toLowerCase().includes(q);
        const matchBoard = batch.board.toLowerCase().includes(q);

        if (
          !matchTitle &&
          !matchSlug &&
          !matchSubject &&
          !matchFaculty &&
          !matchJoinCode &&
          !matchClass &&
          !matchBoard
        ) {
          return false;
        }
      }

      return true;
    });
  }, [batches, search, classFilter, boardFilter, statusFilter]);

  const hasFilters = search.trim() !== "" || classFilter !== "all" || boardFilter !== "all" || statusFilter !== "all";

  const handleResetFilters = () => {
    setSearch("");
    setClassFilter("all");
    setBoardFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-3">
      {/* Live Search and Filter Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batches by title, join code, faculty, subject... (shows live)"
              className="pl-8 pr-7 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
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
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
          >
            <option value="all">All Classes</option>
            <option value="9">Class IX (9th)</option>
            <option value="10">Class X (10th)</option>
            <option value="11">Class XI (11th)</option>
            <option value="12">Class XII (12th)</option>
          </select>

          {/* Board Filter */}
          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
          >
            <option value="all">All Boards</option>
            <option value="cbse">CBSE</option>
            <option value="icse">ICSE</option>
            <option value="isc">ISC</option>
          </select>

          {/* Status Filter & Reset */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-8 px-2.5 flex items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-0.5">
          Showing <span className="font-bold text-slate-800">{filteredBatches.length}</span> of{" "}
          <span className="font-bold text-slate-800">{batches.length}</span> batches
        </div>
      </div>

      {/* Batches Table */}
      {filteredBatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2.5">
          <BookOpen className="w-9 h-9 text-slate-400 mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-slate-900">No batches match your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or clear filters to see all available batches.
          </p>
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-7.5 px-3 text-xs rounded-lg font-medium border-slate-200"
            >
              Clear Search &amp; Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Batch Title</th>
                  <th className="py-2.5 px-3.5">Class &amp; Board</th>
                  <th className="py-2.5 px-3.5">Join Code</th>
                  <th className="py-2.5 px-3.5">Mode</th>
                  <th className="py-2.5 px-3.5">Faculty</th>
                  <th className="py-2.5 px-3.5">Seats</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(({ batch, facultyName, subjectName, activeEnrolled }) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                          {batch.title}
                        </span>
                        {batch.isFeatured && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                            title="Featured on homepage"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" /> Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        /{batch.slug} · {subjectName || "Subject"}
                      </p>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-800">
                        Class {formatClassRoman(batch.classLevel)}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5 uppercase font-medium">
                        ({batch.board})
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80">
                        {batch.joinCode || "—"}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap capitalize text-xs text-slate-600 font-medium">
                      {batch.mode}
                    </td>

                    <td className="py-2.5 px-3.5 text-xs text-slate-500">
                      {facultyName || "—"}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-xs">
                      <span className="font-bold text-slate-900">{activeEnrolled}</span>
                      <span className="text-slate-400"> / {batch.seatsTotal}</span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          batch.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : batch.status === "draft"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : batch.status === "closed"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            batch.status === "open"
                              ? "bg-emerald-500"
                              : batch.status === "draft"
                              ? "bg-slate-400"
                              : batch.status === "closed"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="capitalize">{batch.status}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/batches/${batch.slug}`}
                          target="_blank"
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {userRole === "admin" && (
                          <Link href={`/admin/batches/${batch.id}`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2.5 rounded-md border-slate-200 hover:bg-slate-50 font-semibold">
                              <Edit className="w-3 h-3" /> Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

