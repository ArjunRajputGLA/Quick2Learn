import { parseIso8601Duration } from "./duration";
import {
  FIXTURE_CHANNEL_STATS,
  FIXTURE_PLAYLISTS,
  FIXTURE_VIDEOS,
} from "./fixture";
import type {
  YouTubeChannelStats,
  YouTubePlaylistItem,
  YouTubeVideoItem,
} from "./types";

interface GoogleApiResponse<T> {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo?: { totalResults: number; resultsPerPage: number };
  items: T[];
  error?: {
    code: number;
    message: string;
    errors: unknown[];
  };
}

export class YouTubeClient {
  private apiKey: string;
  private channelId: string;
  private isDummyKey: boolean;

  constructor(apiKey?: string, channelId?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "dummy_youtube_api_key";
    this.channelId =
      channelId ||
      process.env.YOUTUBE_CHANNEL_ID ||
      "UCy1XY9I1Yeyy59Y5LMgqa8g";
    this.isDummyKey =
      !this.apiKey ||
      this.apiKey === "dummy_youtube_api_key" ||
      process.env.NODE_ENV === "test";
  }

  /**
   * Fetches channel details and upload playlist ID from channels.list.
   */
  async getChannelStats(): Promise<YouTubeChannelStats> {
    if (this.isDummyKey) {
      return { ...FIXTURE_CHANNEL_STATS, updatedAt: new Date().toISOString() };
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&id=${this.channelId}&key=${this.apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as GoogleApiResponse<{
        id: string;
        snippet: { title: string };
        contentDetails: { relatedPlaylists: { uploads: string } };
        statistics: {
          subscriberCount: string;
          videoCount: string;
          viewCount: string;
        };
      }>;

      if (!data.items || data.items.length === 0) {
        throw new Error(`Channel ${this.channelId} not found on YouTube`);
      }

      const item = data.items[0];
      if (!item) {
        throw new Error(`Channel ${this.channelId} has no item details`);
      }
      return {
        channelId: this.channelId,
        title: item.snippet?.title || "Quick2Learn",
        subscriberCount: parseInt(item.statistics?.subscriberCount || "0", 10),
        videoCount: parseInt(item.statistics?.videoCount || "0", 10),
        viewCount: parseInt(item.statistics?.viewCount || "0", 10),
        uploadsPlaylistId:
          item.contentDetails?.relatedPlaylists?.uploads ||
          this.channelId.replace(/^UC/, "UU"),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("YouTube live channels.list failed, using fixture fallback:", err);
      return { ...FIXTURE_CHANNEL_STATS, updatedAt: new Date().toISOString() };
    }
  }

  /**
   * Fetches all public playlists for the channel via playlists.list.
   */
  async getPlaylists(): Promise<YouTubePlaylistItem[]> {
    if (this.isDummyKey) {
      return FIXTURE_PLAYLISTS;
    }

    try {
      const allPlaylists: YouTubePlaylistItem[] = [];
      let pageToken: string | undefined = undefined;

      do {
        const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${this.channelId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`YouTube playlists.list error: ${res.status}`);
        }
        const data = (await res.json()) as GoogleApiResponse<{
          id: string;
          snippet: {
            title: string;
            description: string;
            thumbnails?: {
              high?: { url: string };
              medium?: { url: string };
              default?: { url: string };
            };
          };
          contentDetails: { itemCount: number };
        }>;

        if (data.items) {
          for (const item of data.items) {
            allPlaylists.push({
              id: item.id,
              title: item.snippet.title,
              description: item.snippet.description || "",
              thumbnailUrl:
                item.snippet.thumbnails?.high?.url ||
                item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url ||
                null,
              itemCount: item.contentDetails?.itemCount || 0,
            });
          }
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      return allPlaylists;
    } catch (err) {
      console.warn("YouTube live playlists.list failed, using fixture fallback:", err);
      return FIXTURE_PLAYLISTS;
    }
  }

  /**
   * Fetches playlist item video IDs for a given playlist.
   */
  async getPlaylistItemVideoIds(playlistId: string): Promise<string[]> {
    if (this.isDummyKey) {
      // Find videos in this playlist from fixture
      return FIXTURE_VIDEOS.filter((v) => v.playlistIds.includes(playlistId)).map((v) => v.id);
    }

    try {
      const videoIds: string[] = [];
      let pageToken: string | undefined = undefined;

      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) break;
        const data = (await res.json()) as GoogleApiResponse<{
          contentDetails: { videoId: string };
        }>;
        if (data.items) {
          for (const item of data.items) {
            if (item.contentDetails?.videoId) {
              videoIds.push(item.contentDetails.videoId);
            }
          }
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      return videoIds;
    } catch (err) {
      console.warn(`YouTube playlistItems.list failed for ${playlistId}:`, err);
      return FIXTURE_VIDEOS.filter((v) => v.playlistIds.includes(playlistId)).map((v) => v.id);
    }
  }

  /**
   * Fetches uploads playlist video items with optional pagination control.
   */
  async getUploadsVideoIds(
    uploadsPlaylistId: string,
    options?: { stopWhenFound?: (videoId: string) => boolean; maxPages?: number },
  ): Promise<string[]> {
    if (this.isDummyKey) {
      return FIXTURE_VIDEOS.map((v) => v.id);
    }

    try {
      const videoIds: string[] = [];
      let pageToken: string | undefined = undefined;
      let pagesFetched = 0;

      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ""}&key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Uploads playlist fetch failed: ${res.status}`);

        const data = (await res.json()) as GoogleApiResponse<{
          contentDetails: { videoId: string };
        }>;

        let shouldStop = false;
        if (data.items) {
          for (const item of data.items) {
            const vid = item.contentDetails?.videoId;
            if (vid) {
              videoIds.push(vid);
              if (options?.stopWhenFound && options.stopWhenFound(vid)) {
                shouldStop = true;
              }
            }
          }
        }

        pagesFetched++;
        if (shouldStop || (options?.maxPages && pagesFetched >= options.maxPages)) {
          break;
        }

        pageToken = data.nextPageToken;
      } while (pageToken);

      return videoIds;
    } catch (err) {
      console.warn("YouTube uploads list failed, using fixture fallback:", err);
      return FIXTURE_VIDEOS.map((v) => v.id);
    }
  }

  /**
   * Fetches full video details in batches of up to 50 via videos.list.
   */
  async getVideosDetailsBatch(videoIds: string[]): Promise<YouTubeVideoItem[]> {
    if (videoIds.length === 0) return [];

    if (this.isDummyKey) {
      const idSet = new Set(videoIds);
      return FIXTURE_VIDEOS.filter((v) => idSet.has(v.id));
    }

    try {
      const results: YouTubeVideoItem[] = [];

      // Batch in chunks of 50
      for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk.join(",")}&key=${this.apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`videos.list error: ${res.status}`);

        const data = (await res.json()) as GoogleApiResponse<{
          id: string;
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            thumbnails?: {
              high?: { url: string };
              maxres?: { url: string };
              medium?: { url: string };
              default?: { url: string };
            };
          };
          contentDetails: {
            duration: string;
          };
          statistics: {
            viewCount?: string;
            likeCount?: string;
          };
        }>;

        if (data.items) {
          for (const item of data.items) {
            results.push({
              id: item.id,
              title: item.snippet.title,
              description: item.snippet.description || "",
              publishedAt: item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : null,
              durationSeconds: parseIso8601Duration(item.contentDetails?.duration),
              thumbnailUrl:
                item.snippet.thumbnails?.maxres?.url ||
                item.snippet.thumbnails?.high?.url ||
                item.snippet.thumbnails?.medium?.url ||
                item.snippet.thumbnails?.default?.url ||
                null,
              viewCount: parseInt(item.statistics?.viewCount || "0", 10),
              likeCount: parseInt(item.statistics?.likeCount || "0", 10),
              playlistIds: [],
            });
          }
        }
      }

      return results;
    } catch (err) {
      console.warn("YouTube videos.list failed, using fixture fallback:", err);
      const idSet = new Set(videoIds);
      return FIXTURE_VIDEOS.filter((v) => idSet.has(v.id));
    }
  }
}
