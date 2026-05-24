import { beforeEach, describe, expect, it } from "vitest";
import {
  WORKSPACE_LANGUAGE_STORAGE_KEY,
  getWorkspaceLanguageCopy,
  getWorkspaceLanguageDirection,
  getWorkspaceLanguageLocale,
  isWorkspaceLanguage,
  loadWorkspaceLanguage,
  normalizeWorkspaceLanguage,
  saveWorkspaceLanguage,
  workspaceLanguages
} from "./workspaceLanguage";

describe("workspaceLanguage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to Thai unless English is explicitly selected", () => {
    expect(normalizeWorkspaceLanguage(undefined)).toBe("th");
    expect(normalizeWorkspaceLanguage(null)).toBe("th");
    expect(normalizeWorkspaceLanguage("th")).toBe("th");
    expect(normalizeWorkspaceLanguage("en")).toBe("en");
    expect(normalizeWorkspaceLanguage("bad")).toBe("th");
  });

  it("exposes language metadata and validation for future language additions", () => {
    expect(workspaceLanguages.map((language) => language.id)).toEqual(["th", "en"]);
    expect(isWorkspaceLanguage("th")).toBe(true);
    expect(isWorkspaceLanguage("en")).toBe(true);
    expect(isWorkspaceLanguage("ja")).toBe(false);
    expect(getWorkspaceLanguageLocale("th")).toBe("th-TH");
    expect(getWorkspaceLanguageLocale("en")).toBe("en-US");
    expect(getWorkspaceLanguageDirection("th")).toBe("ltr");
  });

  it("falls back to the configured language copy when a future locale is incomplete", () => {
    expect(getWorkspaceLanguageCopy({ th: "ไทย", en: "English" }, "en")).toBe("English");
    expect(getWorkspaceLanguageCopy({ th: "ไทย" }, "en")).toBe("ไทย");
  });

  it("loads and saves the workspace language", () => {
    expect(loadWorkspaceLanguage()).toBe("th");

    saveWorkspaceLanguage("en");
    expect(window.localStorage.getItem(WORKSPACE_LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(loadWorkspaceLanguage()).toBe("en");

    saveWorkspaceLanguage("th");
    expect(loadWorkspaceLanguage()).toBe("th");
  });
});
