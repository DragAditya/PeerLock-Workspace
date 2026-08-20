import { describe, expect, it } from "vitest";
import { validateAiFormatRequest } from "./aiFormatter";

describe("clean-slate AI privacy boundary", () => {
  it("blocks a protected document before any external provider call", () => {
    expect(() => validateAiFormatRequest({ text: "private", instruction: "format", consent: true, externalAiEnabled: false })).toThrow("External AI is disabled");
  });
  it("requires explicit consent", () => {
    expect(() => validateAiFormatRequest({ text: "draft", instruction: "format", consent: false, externalAiEnabled: true })).toThrow("Explicit consent");
  });
});
