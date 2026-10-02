import { describe, expect, test } from "vitest";
import * as z from "zod";

describe("z.gtin", () => {
  const valid: [string, string][] = [
    ["GTIN-8", "96385074"],
    ["GTIN-12 (UPC-A)", "036000291452"],
    ["GTIN-13 (EAN-13)", "4006381333931"],
    ["GTIN-13 (ISBN-13)", "9780306406157"],
    ["GTIN-14", "10614141000415"],
    ["GTIN-12 zero-padded to 14", "00012345678905"],
  ];

  test.each(valid)("accepts %s", (_label, n) => {
    expect(z.gtin().parse(n)).toBe(n);
  });

  test("rejects failed checksums", () => {
    expect(() => z.gtin().parse("96385075")).toThrow();
    expect(() => z.gtin().parse("036000291453")).toThrow();
    expect(() => z.gtin().parse("4006381333932")).toThrow();
    expect(() => z.gtin().parse("10614141000416")).toThrow();
  });

  test("rejects lengths other than 8, 12, 13 and 14 even with a valid check digit", () => {
    for (const n of ["1234565", "123456784", "1234567895", "12345678905", "123456789012343"]) {
      expect(() => z.gtin().parse(n)).toThrow();
    }
  });

  test("rejects anything but ascii digits", () => {
    for (const n of ["", "4006 381 333931", "4006381-333931", " 4006381333931", "400638133393A", "٤٠٠٦٣٨١٣٣٣٩٣١"]) {
      expect(() => z.gtin().parse(n)).toThrow();
    }
    expect(() => z.gtin().parse(4006381333931)).toThrow();
  });

  test("restricts to a single length with .length()", () => {
    const ean13 = z.gtin().length(13);
    expect(ean13.parse("4006381333931")).toBe("4006381333931");
    expect(() => ean13.parse("96385074")).toThrow();
    expect(z.toJSONSchema(ean13)).toMatchObject({ format: "gtin", minLength: 13, maxLength: 13 });
  });

  test("carries the shape regex as its JSON Schema pattern", () => {
    expect(z.toJSONSchema(z.gtin())).toMatchObject({ format: "gtin", pattern: z.regexes.gtin.source });
  });

  test("round-trips through JSON Schema with the checksum intact", () => {
    const schema = z.fromJSONSchema(z.toJSONSchema(z.gtin()));
    expect(schema.safeParse("4006381333931").success).toBe(true);
    expect(schema.safeParse("4006381333932").success).toBe(false);
  });

  test("reports an invalid_format issue", () => {
    const result = z.gtin().safeParse("4006381333932");
    expect(result.error?.issues).toMatchObject([{ code: "invalid_format", format: "gtin", message: "Invalid GTIN" }]);
  });
});
