import { getStorageAdapter, readJson, writeJson, type StorageAdapter } from "../../../storageAdapter";

export const SOCIAL_FEED_STORAGE_KEY = "contractor-feed.workspace.v1";

export const socialPostCategories = [
  "อัปเดตไซต์งาน",
  "หาทีมงาน",
  "ถามราคา/วัสดุ",
  "หาเครื่องมือ",
  "โชว์ผลงาน"
] as const;

export type SocialPostCategory = (typeof socialPostCategories)[number];
export type SocialFeedTab = "feed" | "network" | "profile";
export type SocialImageTone = "site" | "materials" | "team" | "none";

export type SocialPostImage = {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
};

export type SocialProfile = {
  name: string;
  role: string;
  company: string;
  location: string;
  phone: string;
  bio: string;
  avatarImage: SocialPostImage | null;
  coverImage: SocialPostImage | null;
  specialties: string[];
  followers: number;
  following: number;
};

export type SocialComment = {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
};

export type SocialPost = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorImage: SocialPostImage | null;
  content: string;
  category: SocialPostCategory;
  project: string;
  createdAt: string;
  likes: number;
  commentCount: number;
  comments: SocialComment[];
  shares: number;
  liked: boolean;
  imageTone: SocialImageTone;
  image: SocialPostImage | null;
};

export type SocialFeedData = {
  profile: SocialProfile;
  posts: SocialPost[];
  connectedIds: string[];
};

export type NetworkMember = {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  specialty: string;
  mutual: string;
};

export type SocialFeedStats = {
  posts: number;
  connections: number;
  followers: number;
  hiringPosts: number;
};

export const socialNetworkMembers: NetworkMember[] = [
  {
    id: "net-structure",
    name: "ทีมโครงสร้างอีสาน",
    role: "ผู้รับเหมางานโครงสร้าง",
    company: "Isan Structure Crew",
    location: "ขอนแก่น",
    specialty: "คอนกรีต / เหล็กเสริม",
    mutual: "รู้จักร่วมกัน 12 คน"
  },
  {
    id: "net-mep",
    name: "ช่างระบบพร้อมลงไซต์",
    role: "ทีม MEP",
    company: "MEP Fast Service",
    location: "นนทบุรี",
    specialty: "ไฟฟ้า / สุขาภิบาล",
    mutual: "ร่วมงานกับผู้รับเหมาบ้านพัก"
  },
  {
    id: "net-material",
    name: "วัสดุหน้างาน 24 ชม.",
    role: "ซัพพลายเออร์",
    company: "Site Supply Hub",
    location: "กรุงเทพฯ",
    specialty: "ปูน / อิฐ / ทราย",
    mutual: "ตอบใบเสนอราคาไว"
  }
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createInitialSocialProfile(): SocialProfile {
  return {
    name: "สมชาย วงศ์ก่อสร้าง",
    role: "ผู้รับเหมาหลัก",
    company: "Build By BIM Contractor",
    location: "กรุงเทพฯ และปริมณฑล",
    phone: "081-234-5678",
    bio: "รับงานรีโนเวท บ้านพัก และอาคารพาณิชย์ พร้อมทีมโครงสร้าง งานระบบ และเอกสาร BOQ ครบชุด",
    avatarImage: null,
    coverImage: null,
    specialties: ["รีโนเวท", "งานโครงสร้าง", "BOQ", "ส่งมอบงาน"],
    followers: 248,
    following: 76
  };
}

export function createInitialSocialPosts(): SocialPost[] {
  return [
    {
      id: "post-site-update",
      authorId: "community-site",
      authorName: "ทีมช่างเมืองนนท์",
      authorRole: "ผู้รับเหมางานรีโนเวท",
      authorCompany: "Nont Builder Crew",
      authorImage: null,
      content:
        "อัปเดตไซต์บ้านพัก 2 ชั้น งานโครงสร้างชั้นล่างเสร็จแล้ว กำลังเช็คคิวช่างระบบสำหรับสัปดาห์หน้า ใครมีทีม MEP พร้อมลงพื้นที่ทักได้ครับ",
      category: "อัปเดตไซต์งาน",
      project: "รีโนเวทบ้านพัก 2 ชั้น",
      createdAt: "2026-05-22T08:15:00.000+07:00",
      likes: 42,
      commentCount: 8,
      comments: [
        {
          id: "comment-site-mep",
          authorName: "ช่างระบบพร้อมลงไซต์",
          authorRole: "ทีม MEP",
          content: "มีทีมว่างวันอังคาร ส่งแบบระบบมาเช็คคิวได้ครับ",
          createdAt: "2026-05-22T09:05:00.000+07:00"
        }
      ],
      shares: 5,
      liked: false,
      imageTone: "site",
      image: null
    },
    {
      id: "post-material-price",
      authorId: "community-material",
      authorName: "บ้านวัสดุ 24 ชม.",
      authorRole: "ซัพพลายเออร์วัสดุ",
      authorCompany: "Site Supply Hub",
      authorImage: null,
      content:
        "มีคิวส่งคอนกรีต 240 ksc และเหล็ก SD40 สำหรับไซต์โซนตะวันออก ราคาอัปเดตวันนี้ ส่งใบเสนอราคาได้ภายใน 30 นาที",
      category: "ถามราคา/วัสดุ",
      project: "วัสดุโครงสร้าง",
      createdAt: "2026-05-21T16:40:00.000+07:00",
      likes: 31,
      commentCount: 12,
      comments: [
        {
          id: "comment-material-price",
          authorName: "ทีมโครงสร้างอีสาน",
          authorRole: "ผู้รับเหมางานโครงสร้าง",
          content: "ขอราคาเหล็ก SD40 ส่งขอนแก่น 2 ตันครับ",
          createdAt: "2026-05-21T17:12:00.000+07:00"
        }
      ],
      shares: 9,
      liked: false,
      imageTone: "materials",
      image: null
    },
    {
      id: "post-team-request",
      authorId: "community-foreman",
      authorName: "Foreman โจ",
      authorRole: "หัวหน้าช่างหน้างาน",
      authorCompany: "Job Ready Team",
      authorImage: null,
      content:
        "ต้องการทีมช่างปูกระเบื้อง 4 คน ลงไซต์ต่อเติมครัว 6 วัน มีแบบและ BOQ พร้อม จ่ายเป็นงวดงานหลังตรวจรับ",
      category: "หาทีมงาน",
      project: "ต่อเติมครัวหลังบ้าน",
      createdAt: "2026-05-20T19:20:00.000+07:00",
      likes: 58,
      commentCount: 17,
      comments: [
        {
          id: "comment-team-ready",
          authorName: "อนันต์ ช่างปูน",
          authorRole: "ช่างประจำไซต์",
          content: "มีทีม 3 คนพร้อมเริ่ม 2 วันแรกก่อน ถ้าหน้างานพร้อมแจ้งได้ครับ",
          createdAt: "2026-05-20T20:02:00.000+07:00"
        }
      ],
      shares: 11,
      liked: true,
      imageTone: "team",
      image: null
    }
  ];
}

export function createDefaultSocialFeedData(): SocialFeedData {
  return {
    profile: createInitialSocialProfile(),
    posts: createInitialSocialPosts(),
    connectedIds: ["net-structure"]
  };
}

export function normalizeSocialCategory(value: unknown): SocialPostCategory {
  return socialPostCategories.includes(value as SocialPostCategory)
    ? (value as SocialPostCategory)
    : "อัปเดตไซต์งาน";
}

export function normalizeSocialPostImage(record: Partial<SocialPostImage> | null | undefined): SocialPostImage | null {
  if (!record?.dataUrl || typeof record.dataUrl !== "string" || !record.dataUrl.startsWith("data:image/")) {
    return null;
  }

  return {
    id: record.id ?? `social-image-${Date.now()}`,
    name: record.name?.trim() || "site-photo.jpg",
    dataUrl: record.dataUrl,
    mimeType: record.mimeType?.startsWith("image/") ? record.mimeType : "image/jpeg",
    size: typeof record.size === "number" ? Math.max(0, record.size) : 0,
    width: typeof record.width === "number" ? Math.max(0, Math.round(record.width)) : 0,
    height: typeof record.height === "number" ? Math.max(0, Math.round(record.height)) : 0
  };
}

export function normalizeSocialProfile(record: Partial<SocialProfile> = {}): SocialProfile {
  const fallback = createInitialSocialProfile();
  const specialties = Array.isArray(record.specialties)
    ? record.specialties.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : fallback.specialties;

  return {
    name: typeof record.name === "string" ? record.name : fallback.name,
    role: typeof record.role === "string" ? record.role : fallback.role,
    company: typeof record.company === "string" ? record.company : fallback.company,
    location: typeof record.location === "string" ? record.location : fallback.location,
    phone: typeof record.phone === "string" ? record.phone : fallback.phone,
    bio: typeof record.bio === "string" ? record.bio : fallback.bio,
    avatarImage: normalizeSocialPostImage(record.avatarImage),
    coverImage: normalizeSocialPostImage(record.coverImage),
    specialties: specialties.map((item) => item.trim()).slice(0, 6),
    followers: typeof record.followers === "number" ? Math.max(0, record.followers) : fallback.followers,
    following: typeof record.following === "number" ? Math.max(0, record.following) : fallback.following
  };
}

export function normalizeSocialComment(record: Partial<SocialComment>, index = 0): SocialComment {
  return {
    id: record.id ?? `comment-${Date.now()}-${index}`,
    authorName: record.authorName?.trim() || "สมาชิกเครือข่าย",
    authorRole: record.authorRole?.trim() || "ผู้รับเหมา",
    content: record.content?.trim() || "สนใจรายละเอียดงานนี้ครับ",
    createdAt: record.createdAt ?? new Date().toISOString()
  };
}

export function normalizeSocialPost(record: Partial<SocialPost>, index = 0): SocialPost {
  const fallback = createInitialSocialPosts()[index] ?? createInitialSocialPosts()[0];
  const rawRecord = record as Partial<SocialPost> & {
    comments?: unknown;
    commentCount?: unknown;
  };
  const comments = Array.isArray(rawRecord.comments)
    ? rawRecord.comments.map((comment, commentIndex) =>
        normalizeSocialComment(comment as Partial<SocialComment>, commentIndex)
      )
    : [];
  const legacyCommentCount =
    typeof rawRecord.commentCount === "number"
      ? rawRecord.commentCount
      : typeof rawRecord.comments === "number"
      ? rawRecord.comments
      : fallback.commentCount;
  const imageTone =
    record.imageTone === "materials" ||
    record.imageTone === "team" ||
    record.imageTone === "none" ||
    record.imageTone === "site"
      ? record.imageTone
      : fallback.imageTone;

  return {
    id: record.id ?? `post-${Date.now()}-${index}`,
    authorId: record.authorId ?? fallback.authorId,
    authorName: record.authorName?.trim() || fallback.authorName,
    authorRole: record.authorRole?.trim() || fallback.authorRole,
    authorCompany: record.authorCompany?.trim() || fallback.authorCompany,
    authorImage: normalizeSocialPostImage(record.authorImage),
    content: record.content?.trim() || fallback.content,
    category: normalizeSocialCategory(record.category),
    project: record.project?.trim() || fallback.project,
    createdAt: record.createdAt ?? fallback.createdAt,
    likes: typeof record.likes === "number" ? Math.max(0, record.likes) : fallback.likes,
    commentCount: Math.max(legacyCommentCount, comments.length),
    comments,
    shares: typeof record.shares === "number" ? Math.max(0, record.shares) : fallback.shares,
    liked: Boolean(record.liked),
    imageTone,
    image: normalizeSocialPostImage(record.image)
  };
}

export function normalizeSocialFeedData(raw: unknown): SocialFeedData {
  const fallback = createDefaultSocialFeedData();
  const parsed = isRecord(raw) ? (raw as Partial<SocialFeedData>) : fallback;
  const rawPosts = Array.isArray(parsed.posts) && parsed.posts.length ? parsed.posts : fallback.posts;

  return {
    profile: normalizeSocialProfile(parsed.profile),
    posts: rawPosts.map((post, index) => normalizeSocialPost(post, index)),
    connectedIds: Array.isArray(parsed.connectedIds)
      ? parsed.connectedIds.filter((id): id is string => typeof id === "string")
      : fallback.connectedIds
  };
}

export function loadSocialFeedData(adapter: StorageAdapter = getStorageAdapter()): SocialFeedData {
  const fallback = createDefaultSocialFeedData();
  return readJson(adapter, SOCIAL_FEED_STORAGE_KEY, fallback, normalizeSocialFeedData);
}

export function saveSocialFeedData(
  data: SocialFeedData,
  adapter: StorageAdapter = getStorageAdapter()
): void {
  writeJson(adapter, SOCIAL_FEED_STORAGE_KEY, normalizeSocialFeedData(data));
}

export function getPostImageTone(category: SocialPostCategory): SocialImageTone {
  if (category === "ถามราคา/วัสดุ") {
    return "materials";
  }

  if (category === "หาทีมงาน") {
    return "team";
  }

  if (category === "หาเครื่องมือ") {
    return "none";
  }

  return "site";
}

export function createSocialPost(
  profile: SocialProfile,
  content: string,
  category: SocialPostCategory,
  project: string,
  image: SocialPostImage | null
): SocialPost {
  return {
    id: `post-${Date.now()}`,
    authorId: "self",
    authorName: profile.name,
    authorRole: profile.role,
    authorCompany: profile.company,
    authorImage: profile.avatarImage,
    content: content.trim() || "เพิ่มรูปหน้างาน",
    category,
    project: project.trim() || "โพสต์ทั่วไป",
    createdAt: new Date().toISOString(),
    likes: 0,
    commentCount: 0,
    comments: [],
    shares: 0,
    liked: false,
    imageTone: image ? "none" : getPostImageTone(category),
    image
  };
}

export function createSocialComment(profile: SocialProfile, content: string): SocialComment {
  return {
    id: `comment-${Date.now()}`,
    authorName: profile.name,
    authorRole: profile.role,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
}

export function getSocialSearchText(post: SocialPost): string {
  return `${post.authorName} ${post.authorRole} ${post.authorCompany} ${post.content} ${post.category} ${post.project} ${post.image?.name ?? ""}`
    .toLocaleLowerCase("th-TH");
}

export function formatSocialPostTime(createdAt: string): string {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "เมื่อสักครู่";
  }

  return date.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getSocialFeedStats(adapter?: StorageAdapter): SocialFeedStats {
  const data = loadSocialFeedData(adapter);
  const hiringPosts = data.posts.filter((post) => post.category === "หาทีมงาน").length;

  return {
    posts: data.posts.length,
    connections: data.connectedIds.length,
    followers: data.profile.followers,
    hiringPosts
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("โหลดรูปไม่สำเร็จ"));
    image.src = src;
  });
}

export async function createSocialPostImageFromFile(
  file: File,
  maxSide = 1400
): Promise<SocialPostImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพ");
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(sourceDataUrl);
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("ประมวลผลรูปไม่สำเร็จ");
  }

  context.drawImage(image, 0, 0, width, height);
  const mimeType = "image/jpeg";
  const dataUrl = canvas.toDataURL(mimeType, 0.84);

  return {
    id: `social-image-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    dataUrl,
    mimeType,
    size: file.size,
    width,
    height
  };
}
