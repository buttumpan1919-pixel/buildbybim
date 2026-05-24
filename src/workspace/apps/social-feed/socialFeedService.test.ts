import { describe, expect, it } from "vitest";
import { MemoryAdapter } from "../../../storageAdapter";
import {
  SOCIAL_FEED_STORAGE_KEY,
  createDefaultSocialFeedData,
  createInitialSocialProfile,
  createSocialPost,
  formatSocialPostTime,
  getPostImageTone,
  getSocialFeedStats,
  getSocialSearchText,
  loadSocialFeedData,
  normalizeSocialCategory,
  normalizeSocialPost,
  saveSocialFeedData,
  socialPostCategories
} from "./socialFeedService";

describe("socialFeedService", () => {
  it("loads default feed data when storage is empty", () => {
    const data = loadSocialFeedData(new MemoryAdapter());

    expect(data.profile.company).toBe("Build By BIM Contractor");
    expect(data.posts).toHaveLength(3);
    expect(data.connectedIds).toEqual(["net-structure"]);
  });

  it("normalizes saved feed data through the storage adapter", () => {
    const adapter = new MemoryAdapter();
    const fallback = createDefaultSocialFeedData();

    saveSocialFeedData(
      {
        profile: {
          ...createInitialSocialProfile(),
          followers: -8,
          specialties: ["", " BOQ ", " รีโนเวท "]
        },
        posts: [
          {
            ...fallback.posts[0],
            category: "unknown" as never,
            likes: -10,
            comments: [
              {
                id: "comment-1",
                authorName: "",
                authorRole: "",
                content: "",
                createdAt: "bad-date"
              }
            ],
            commentCount: 0
          }
        ],
        connectedIds: ["net-mep", 123 as never]
      },
      adapter
    );

    const raw = adapter.read(SOCIAL_FEED_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const loaded = loadSocialFeedData(adapter);
    expect(loaded.profile.followers).toBe(0);
    expect(loaded.profile.specialties).toEqual(["BOQ", "รีโนเวท"]);
    expect(loaded.posts[0].category).toBe(socialPostCategories[0]);
    expect(loaded.posts[0].likes).toBe(0);
    expect(loaded.posts[0].commentCount).toBe(1);
    expect(loaded.connectedIds).toEqual(["net-mep"]);
  });

  it("maps categories to visual tones", () => {
    expect(getPostImageTone("ถามราคา/วัสดุ")).toBe("materials");
    expect(getPostImageTone("หาทีมงาน")).toBe("team");
    expect(getPostImageTone("หาเครื่องมือ")).toBe("none");
    expect(getPostImageTone("โชว์ผลงาน")).toBe("site");
  });

  it("creates posts and searchable text from profile context", () => {
    const profile = createInitialSocialProfile();
    const post = createSocialPost(profile, " ต้องการทีม MEP ", "หาทีมงาน", " งานระบบ ", null);

    expect(post.authorName).toBe(profile.name);
    expect(post.content).toBe("ต้องการทีม MEP");
    expect(post.project).toBe("งานระบบ");
    expect(post.imageTone).toBe("team");
    expect(getSocialSearchText(post)).toContain("mep");
  });

  it("normalizes unknown categories and invalid dates safely", () => {
    expect(normalizeSocialCategory("bad")).toBe(socialPostCategories[0]);
    expect(normalizeSocialPost({ commentCount: -2 }, 0).commentCount).toBeGreaterThanOrEqual(0);
    expect(formatSocialPostTime("not-a-date")).toBe("เมื่อสักครู่");
  });

  it("summarizes stored social feed stats", () => {
    const adapter = new MemoryAdapter();
    const data = createDefaultSocialFeedData();
    saveSocialFeedData(data, adapter);

    expect(getSocialFeedStats(adapter)).toEqual({
      posts: 3,
      connections: 1,
      followers: 248,
      hiringPosts: 1
    });
  });
});
