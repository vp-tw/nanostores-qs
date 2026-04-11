import { Decimal } from "decimal.js";
import objectInspect from "object-inspect";

/**
 * Custom inspect that displays Decimal as `Decimal(3.14)` instead of raw object.
 */
function inspect(value: unknown): string {
  if (value instanceof Decimal) {
    return `Decimal(${value.toString()})`;
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const entries = Object.entries(value).map(([k, v]) => {
      const key = /^[$\w]+$/.test(k) ? k : objectInspect(k);
      return `${key}: ${inspect(v)}`;
    });
    return `{\n  ${entries.join(",\n  ")}\n}`;
  }
  if (Array.isArray(value)) {
    return `[${value.map(inspect).join(", ")}]`;
  }
  return objectInspect(value);
}

export { inspect };
