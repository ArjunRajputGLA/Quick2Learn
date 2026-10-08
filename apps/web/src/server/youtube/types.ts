export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeChannelStats {
  channelId: string;
  title: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  uploadsPlaylistId: string;
  updatedAt: string;
}

export interface YouTubePlaylistItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  itemCount: number;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  publishedAt: Date | null;
  durationSeconds: number;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  playlistIds: string[];
}

export interface SyncOptions {
  mode?: "auto" | "full" | "incremental";
  forceFull?: boolean;
}

export interface SyncResult {
  runId: string;
  mode: "full" | "incremental";
  added: number;
  updated: number;
  errors: Array<{ message: string; stack?: string; time: string }>;
  durationMs: number;
}
