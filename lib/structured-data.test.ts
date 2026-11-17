import { describe, expect, test } from "bun:test";
import { BILLING_CURRENCY } from "@/lib/pricing";
import {
  getRecruiterSoftwareApplicationSchema,
  getSoftwareApplicationSchema,
} from "@/lib/structured-data";

describe("structured data currency", () => {
  const currency = BILLING_CURRENCY.toUpperCase();

  test("home offer uses the billing currency", () => {
    expect(getSoftwareApplicationSchema().offers.priceCurrency).toBe(currency);
  });

  test("recruiter free offer uses the billing currency", () => {
    const { offers } = getRecruiterSoftwareApplicationSchema();
    for (const offer of offers) expect(offer.priceCurrency).toBe(currency);
  });
});
