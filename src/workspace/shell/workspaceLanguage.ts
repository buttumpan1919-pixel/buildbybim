export const WORKSPACE_LANGUAGE_STORAGE_KEY = "build-by-bim.workspace-language.v1";

export const DEFAULT_WORKSPACE_LANGUAGE = "th";
export const FALLBACK_WORKSPACE_LANGUAGE = "en";

export const workspaceLanguages = [
  {
    id: "th",
    label: "TH",
    nativeName: "ไทย",
    englishName: "Thai",
    locale: "th-TH",
    direction: "ltr"
  },
  {
    id: "en",
    label: "EN",
    nativeName: "English",
    englishName: "English",
    locale: "en-US",
    direction: "ltr"
  }
] as const;

export type WorkspaceLanguage = (typeof workspaceLanguages)[number]["id"];
export type WorkspaceTextDirection = (typeof workspaceLanguages)[number]["direction"];
export type WorkspaceLanguageDefinition = (typeof workspaceLanguages)[number];
export type WorkspaceLanguageCopyMap<T> = Record<WorkspaceLanguage, T>;
export type WorkspacePartialLanguageCopyMap<T> = Partial<WorkspaceLanguageCopyMap<T>>;

export function isWorkspaceLanguage(value: string | null | undefined): value is WorkspaceLanguage {
  return workspaceLanguages.some((language) => language.id === value);
}

export function normalizeWorkspaceLanguage(value: string | null | undefined): WorkspaceLanguage {
  return isWorkspaceLanguage(value) ? value : DEFAULT_WORKSPACE_LANGUAGE;
}

export function getWorkspaceLanguageDefinition(language: WorkspaceLanguage) {
  return (
    workspaceLanguages.find((item) => item.id === language) ??
    workspaceLanguages.find((item) => item.id === DEFAULT_WORKSPACE_LANGUAGE) ??
    workspaceLanguages[0]
  );
}

export function getWorkspaceLanguageLocale(language: WorkspaceLanguage) {
  return getWorkspaceLanguageDefinition(language).locale;
}

export function getWorkspaceLanguageDirection(language: WorkspaceLanguage): WorkspaceTextDirection {
  return getWorkspaceLanguageDefinition(language).direction;
}

export function getWorkspaceLanguageCopy<T>(
  copyMap: WorkspacePartialLanguageCopyMap<T>,
  language: WorkspaceLanguage,
  fallbackLanguage: WorkspaceLanguage = FALLBACK_WORKSPACE_LANGUAGE
) {
  const directCopy = copyMap[language];
  if (directCopy !== undefined) {
    return directCopy;
  }

  const fallbackCopy = copyMap[fallbackLanguage] ?? copyMap[DEFAULT_WORKSPACE_LANGUAGE];
  if (fallbackCopy !== undefined) {
    return fallbackCopy;
  }

  throw new Error("Workspace language copy map must include a default or fallback language.");
}

export function loadWorkspaceLanguage(): WorkspaceLanguage {
  if (typeof window === "undefined") {
    return "th";
  }

  return normalizeWorkspaceLanguage(window.localStorage.getItem(WORKSPACE_LANGUAGE_STORAGE_KEY));
}

export function saveWorkspaceLanguage(language: WorkspaceLanguage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORKSPACE_LANGUAGE_STORAGE_KEY, language);
}
