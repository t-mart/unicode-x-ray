import { describe, expect, it } from "vitest";
import { buildSearch, parseSearch } from "./search.ts";

describe("buildSearch", () => {
  it("returns nothing when neither field is set", () => {
    expect(buildSearch("", undefined)).toEqual({});
  });

  it("keeps a normalization chosen before any text", () => {
    expect(buildSearch("", "NFC")).toEqual({ norm: "NFC" });
  });

  it("omits the normalization when none is chosen", () => {
    expect(buildSearch("é", undefined)).toEqual({ text: "é" });
  });

  it("keeps both fields", () => {
    expect(buildSearch("é", "NFD")).toEqual({ text: "é", norm: "NFD" });
  });
});

describe("parseSearch", () => {
  it("reads both fields", () => {
    expect(parseSearch({ text: "é", norm: "NFKD" })).toEqual({
      text: "é",
      norm: "NFKD",
    });
  });

  it("drops an unknown normalization", () => {
    expect(parseSearch({ text: "é", norm: "NFE" })).toEqual({ text: "é" });
  });

  it("drops text that is not a string", () => {
    expect(parseSearch({ text: 7, norm: "NFC" })).toEqual({ norm: "NFC" });
  });

  it("returns nothing for an empty URL", () => {
    expect(parseSearch({})).toEqual({});
  });
});
