import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getAdminPlaylistMapData } from "@/server/data/admin";
import { PlaylistMapForm } from "@/components/admin/playlist-map-form";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Playlist Mapping · Admin · Quick2Learn",
};

export default async function AdminPlaylistMapPage() {
  const current = await requireRole(["admin", "teacher"]);

  const { playlists, subjects, chapters } = await getAdminPlaylistMapData(current.user);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/admin/lectures"
          className="p-2 rounded-lg border border-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
          title="Back to lectures"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-display-xs font-bold text-ink">Map YouTube Playlist</h1>
          <p className="text-body-xs text-ink-muted">
            Map an entire YouTube playlist to a syllabus chapter and automatically update all its constituent videos.
          </p>
        </div>
      </div>

      <PlaylistMapForm
        playlists={playlists}
        subjects={subjects}
        chapters={chapters}
      />
    </div>
  );
}
