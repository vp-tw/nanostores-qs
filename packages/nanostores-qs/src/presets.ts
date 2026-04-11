import type { createQsUtils } from "./main";
import { clamp, isNil } from "es-toolkit";

// --- Shared option types with `never` exclusivity ---

interface BaseOptions {
  optional?: never;
  default?: never;
  array?: never;
  maxItems?: never;
}

interface OptionalOptions<_TType> {
  optional: true;
  default?: never;
  array?: never;
  maxItems?: never;
}

interface DefaultOptions<TType> {
  optional?: never;
  default: TType;
  array?: never;
  maxItems?: never;
}

interface ArrayOptions {
  optional?: never;
  default?: never;
  array: true;
  maxItems?: number;
}

type PresetOptions<TType> =
  | Partial<BaseOptions>
  | OptionalOptions<TType>
  | DefaultOptions<TType>
  | ArrayOptions;

// --- Return types ---

interface BaseResult<TValue, TDefaultValue> {
  decode: (value: unknown) => TValue;
  defaultValue: TDefaultValue;
  encode: (value: TValue) => string | undefined;
}

interface OptionalResult<TValue> {
  decode: (value: unknown) => TValue | undefined;
  encode: (value: TValue | undefined) => string | undefined;
}

interface DefaultResult<TValue> {
  decode: (value: unknown) => TValue;
  defaultValue: TValue;
  encode: (value: TValue) => string | undefined;
}

interface ArrayResult<TValue> {
  isArray: true;
  decode: (value: Array<unknown>) => Array<TValue>;
  encode: (value: Array<TValue>) => Array<string>;
}

interface NumInputResult {
  decode: (value: unknown) => string;
  defaultValue: "";
  encode: (value: string) => string | undefined;
  resolve: (value: string) => number;
}

// --- Config input ---

interface CreatePresetConfig<TValue, TDefaultValue> {
  decode: (value: unknown) => TValue;
  defaultValue: TDefaultValue;
  encode?: (value: TValue) => string | undefined;
}

// --- Resolve intersection — adds resolve to result when TResolved ≠ TValue ---

type TypesEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type WithResolve<TValue, TResolved> =
  TypesEqual<TValue, TResolved> extends true ? unknown : { resolve: (value: TValue) => TResolved };

type WithOptionalResolve<TValue, TResolved> =
  TypesEqual<TValue, TResolved> extends true
    ? unknown
    : { resolve: (value: TValue | undefined) => TResolved | undefined };

type WithArrayResolve<TValue, TResolved> =
  TypesEqual<TValue, TResolved> extends true
    ? unknown
    : { resolve: (value: Array<TValue>) => Array<TResolved> };

// --- Overloaded return type ---

interface CreatePresetReturn<TValue, TDefaultValue, TResolved = TValue> {
  (): BaseResult<TValue, TDefaultValue> & WithResolve<TValue, TResolved>;
  (options: { optional: true }): OptionalResult<TValue> & WithOptionalResolve<TValue, TResolved>;
  <TDefault extends TValue>(options: {
    default: TDefault;
  }): DefaultResult<TValue> & WithResolve<TValue, TResolved>;
  (options: {
    array: true;
    maxItems?: number;
  }): ArrayResult<TValue> & WithArrayResolve<TValue, TResolved>;
  (
    options?: PresetOptions<TValue>,
  ):
    | (BaseResult<TValue, TDefaultValue> & WithResolve<TValue, TResolved>)
    | (OptionalResult<TValue> & WithOptionalResolve<TValue, TResolved>)
    | (DefaultResult<TValue> & WithResolve<TValue, TResolved>)
    | (ArrayResult<TValue> & WithArrayResolve<TValue, TResolved>);
}

// --- Factory ---

function createPreset<TValue, TDefaultValue = TValue, TResolved = TValue>(
  config: CreatePresetConfig<TValue, TDefaultValue> & {
    resolve: (value: TValue) => TResolved;
  },
): CreatePresetReturn<TValue, TDefaultValue, TResolved>;
function createPreset<TValue, TDefaultValue = TValue>(
  config: CreatePresetConfig<TValue, TDefaultValue>,
): CreatePresetReturn<TValue, TDefaultValue>;
function createPreset<TValue, TDefaultValue = TValue, TResolved = TValue>(
  config: CreatePresetConfig<TValue, TDefaultValue> & {
    resolve?: (value: TValue) => TResolved;
  },
): CreatePresetReturn<TValue, TDefaultValue, TResolved> {
  const encode = config.encode ?? ((v: TValue) => (isNil(v) ? undefined : String(v)));
  const resolve = config.resolve;

  function presetFn(options?: PresetOptions<TValue>): any {
    // optional
    if (options && "optional" in options && options.optional === true) {
      const result: any = {
        decode: (v: unknown) => {
          if (isNil(v)) return undefined;
          return config.decode(v);
        },
        encode: (v: TValue | undefined) => {
          if (isNil(v)) return undefined;
          return encode(v);
        },
      };
      if (resolve) {
        result.resolve = (v: TValue | undefined) => (isNil(v) ? undefined : resolve(v));
      }
      return result;
    }

    // default
    if (options && "default" in options && options.default !== undefined) {
      const defaultValue = options.default;
      const result: any = {
        decode: (v: unknown) => {
          if (isNil(v)) return defaultValue;
          return config.decode(v);
        },
        defaultValue,
        encode,
      };
      if (resolve) result.resolve = resolve;
      return result;
    }

    // array — invalid items are silently dropped (best-effort decode).
    // URL may retain raw invalid values until the next update() re-encodes from store state.
    if (options && "array" in options && options.array === true) {
      const maxItems = (options as ArrayOptions).maxItems;
      const result: any = {
        isArray: true as const,
        decode: (values: Array<unknown>): Array<TValue> => {
          const decoded = values.flatMap((v) => {
            try {
              return [config.decode(v)];
            } catch {
              return [];
            }
          });
          if (maxItems !== undefined) {
            return decoded.slice(0, maxItems);
          }
          return decoded;
        },
        encode: (values: Array<TValue>): Array<string> => {
          const capped = maxItems !== undefined ? values.slice(0, maxItems) : values;
          return capped.flatMap((v) => {
            if (isNil(v)) return [];
            try {
              const encoded = encode(v);
              return isNil(encoded) ? [] : [encoded];
            } catch {
              return [];
            }
          });
        },
      };
      if (resolve) {
        result.resolve = (values: Array<TValue>) => values.map(resolve);
      }
      return result;
    }

    // base (no options or empty options)
    const result: any = {
      decode: (v: unknown) => {
        if (isNil(v)) return config.defaultValue;
        return config.decode(v);
      },
      defaultValue: config.defaultValue,
      encode,
    };
    if (resolve) result.resolve = resolve;
    return result;
  }

  return presetFn as CreatePresetReturn<TValue, TDefaultValue, TResolved>;
}

// --- Shared numInput helper ---

function isNumInput<T extends object>(options: T): options is T & NumInputOptions {
  return "numInput" in options && options.numInput === true;
}

function numInputResult(
  options: NumInputOptions,
  parseAndClamp: (value: unknown) => number,
): NumInputResult {
  const defaultNum = options.default;
  return {
    decode: (v: unknown): string => (isNil(v) ? "" : String(v)),
    defaultValue: "",
    encode: (v: string): string | undefined => (v === "" ? undefined : v),
    resolve: (v: string): number => {
      if (v === "") return defaultNum;
      try {
        return parseAndClamp(v);
      } catch {
        return defaultNum;
      }
    },
  };
}

// --- Integer preset ---

interface IntegerBaseOptions {
  round?: "ceil" | "floor" | "parse" | "round";
  min?: number;
  max?: number;
  outOfRange?: "clamp" | "reject";
}

interface NumInputOptions {
  numInput: true;
  default: number;
  optional?: never;
  array?: never;
  maxItems?: never;
}

type IntegerOptions =
  | (IntegerBaseOptions & ArrayOptions)
  | (IntegerBaseOptions & DefaultOptions<number>)
  | (IntegerBaseOptions & NumInputOptions)
  | (IntegerBaseOptions & OptionalOptions<number>)
  | (IntegerBaseOptions & Partial<BaseOptions>);

function integer(): BaseResult<number, number>;
function integer(options: IntegerBaseOptions): BaseResult<number, number>;
function integer(options: IntegerBaseOptions & { optional: true }): OptionalResult<number>;
function integer(options: IntegerBaseOptions & { default: number }): DefaultResult<number>;
function integer(
  options: IntegerBaseOptions & { array: true; maxItems?: number },
): ArrayResult<number>;
function integer(options: IntegerBaseOptions & { numInput: true; default: number }): NumInputResult;
function integer(options?: IntegerOptions): any {
  const round = options?.round ?? "round";
  const min = options?.min ?? Number.MIN_SAFE_INTEGER;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  const outOfRange = options?.outOfRange ?? "clamp";

  function parseAndClamp(value: unknown): number {
    const n =
      round === "parse" ? Number.parseInt(String(value), 10) : Number.parseFloat(String(value));
    if (Number.isNaN(n)) throw new Error("invalid integer");
    const rounded = round === "parse" ? n : Math[round](n);
    if (outOfRange === "reject") {
      if (rounded < min || rounded > max) throw new Error("out of range");
    }
    return clamp(rounded, min, max);
  }

  if (options && isNumInput(options)) {
    return numInputResult(options, parseAndClamp);
  }

  const preset = createPreset<number, number>({
    decode: parseAndClamp,
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      const rounded = round === "parse" ? Math.trunc(v) : Math[round](v);
      if (outOfRange === "reject") {
        if (rounded < min || rounded > max) throw new Error("out of range");
      }
      return String(clamp(rounded, min, max));
    },
  });

  return preset(options as any);
}

// --- Float preset ---

interface FloatBaseOptions {
  fixed?: number;
  min?: number;
  max?: number;
  outOfRange?: "clamp" | "reject";
}

type FloatOptions =
  | (FloatBaseOptions & ArrayOptions)
  | (FloatBaseOptions & DefaultOptions<number>)
  | (FloatBaseOptions & NumInputOptions)
  | (FloatBaseOptions & OptionalOptions<number>)
  | (FloatBaseOptions & Partial<BaseOptions>);

function float(): BaseResult<number, number>;
function float(options: FloatBaseOptions): BaseResult<number, number>;
function float(options: FloatBaseOptions & { optional: true }): OptionalResult<number>;
function float(options: FloatBaseOptions & { default: number }): DefaultResult<number>;
function float(options: FloatBaseOptions & { array: true; maxItems?: number }): ArrayResult<number>;
function float(options: FloatBaseOptions & { numInput: true; default: number }): NumInputResult;
function float(options?: FloatOptions): any {
  const fixed = options?.fixed;
  const min = options?.min ?? -Infinity;
  const max = options?.max ?? Infinity;
  const outOfRange = options?.outOfRange ?? "clamp";

  function parseAndClamp(value: unknown): number {
    let n = Number.parseFloat(String(value));
    if (Number.isNaN(n)) throw new Error("invalid float");
    if (fixed !== undefined) {
      n = Number(n.toFixed(fixed));
    }
    if (outOfRange === "reject") {
      if (n < min || n > max) throw new Error("out of range");
    }
    return clamp(n, min, max);
  }

  if (options && isNumInput(options)) {
    return numInputResult(options, parseAndClamp);
  }

  const preset = createPreset<number, number>({
    decode: parseAndClamp,
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      const n = fixed !== undefined ? Number(v.toFixed(fixed)) : v;
      if (outOfRange === "reject") {
        if (n < min || n > max) throw new Error("out of range");
      }
      const clamped = clamp(n, min, max);
      if (fixed !== undefined) return clamped.toFixed(fixed);
      return String(clamped);
    },
  });

  return preset(options as any);
}

// --- String preset ---

interface StringBaseOptions {
  maxLength?: number;
  outOfRange?: "clamp" | "reject";
}

type StringOptions =
  | (StringBaseOptions & ArrayOptions)
  | (StringBaseOptions & DefaultOptions<string>)
  | (StringBaseOptions & OptionalOptions<string>)
  | (StringBaseOptions & Partial<BaseOptions>);

function string(): BaseResult<string, string>;
function string(options: StringBaseOptions): BaseResult<string, string>;
function string(options: StringBaseOptions & { optional: true }): OptionalResult<string>;
function string(options: StringBaseOptions & { default: string }): DefaultResult<string>;
function string(
  options: StringBaseOptions & { array: true; maxItems?: number },
): ArrayResult<string>;
function string(options?: StringOptions): any {
  const maxLength = options?.maxLength;
  const outOfRange = options?.outOfRange ?? "clamp";

  function normalizeString(s: string): string {
    if (maxLength !== undefined && s.length > maxLength) {
      if (outOfRange === "reject") throw new Error("string too long");
      return s.slice(0, maxLength);
    }
    return s;
  }

  const preset = createPreset<string, string>({
    decode: (value: unknown): string => normalizeString(String(value)),
    defaultValue: "",
    encode: (v: string): string | undefined => {
      if (isNil(v)) return undefined;
      try {
        return normalizeString(v);
      } catch {
        return undefined;
      }
    },
  });

  return preset(options as any);
}

// --- Boolean preset ---

interface BooleanBaseOptions {
  // No constraint-specific options for boolean
}

type BooleanOptions =
  | (BooleanBaseOptions & ArrayOptions)
  | (BooleanBaseOptions & DefaultOptions<boolean>)
  | (BooleanBaseOptions & OptionalOptions<boolean>)
  | (BooleanBaseOptions & Partial<BaseOptions>);

function boolean(): BaseResult<boolean, boolean>;
function boolean(options: BooleanBaseOptions): BaseResult<boolean, boolean>;
function boolean(options: BooleanBaseOptions & { optional: true }): OptionalResult<boolean>;
function boolean(options: BooleanBaseOptions & { default: boolean }): DefaultResult<boolean>;
function boolean(
  options: BooleanBaseOptions & { array: true; maxItems?: number },
): ArrayResult<boolean>;
function boolean(options?: BooleanOptions): any {
  const isOptional = options && "optional" in options && options.optional === true;
  const isArray = options && "array" in options && options.array === true;
  const defaultValue =
    options && "default" in options && options.default !== undefined ? options.default : false;

  const preset = createPreset<boolean, boolean>({
    decode: (value: unknown): boolean => {
      const s = String(value);
      if (s === "true") return true;
      if (s === "false") return false;
      throw new Error("invalid boolean");
    },
    defaultValue: false,
    // optional/array: always encode to string; base/default: omit default value from URL
    encode:
      isOptional || isArray
        ? (v: boolean) => String(v)
        : (v: boolean) => (v === defaultValue ? undefined : String(v)),
  });

  return preset(options as any);
}

// --- Date preset ---

function date(): BaseResult<Date, Date>;
function date(options: { optional: true }): OptionalResult<Date>;
function date(options: { default: Date }): DefaultResult<Date>;
function date(options: { array: true; maxItems?: number }): ArrayResult<Date>;
function date(options?: PresetOptions<Date>): any {
  const preset = createPreset<Date, Date>({
    decode: (value: unknown): Date => {
      const d = new Date(String(value));
      if (Number.isNaN(d.getTime())) throw new Error("invalid date");
      return d;
    },
    defaultValue: new Date(Number.NaN),
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v.getTime())) return undefined;
      return v.toISOString();
    },
  });

  return preset(options as any);
}

// --- YMD preset ---
// Stores a date-only string (no time/timezone). Default "0000-00-00" is an intentional
// invalid sentinel (like NaN for integer). Do NOT pass ymd values to new Date() — the
// UTC midnight parse shifts calendar dates in negative-offset timezones.

const ymdPattern = /^\d{4}-\d{2}-\d{2}$/;

function ymd(): BaseResult<string, string>;
function ymd(options: { optional: true }): OptionalResult<string>;
function ymd(options: { default: string }): DefaultResult<string>;
function ymd(options: { array: true; maxItems?: number }): ArrayResult<string>;
function ymd(options?: PresetOptions<string>): any {
  const preset = createPreset<string, string>({
    decode: (value: unknown): string => {
      const s = String(value);
      if (!ymdPattern.test(s)) throw new Error("invalid ymd format");
      // Semantic validation: check if it's a real calendar date
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) throw new Error("invalid ymd date");
      // Verify round-trip: new Date("2024-13-01") may parse but shift
      const [y, m, day] = s.split("-").map(Number);
      if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
        throw new Error("invalid ymd date");
      }
      return s;
    },
    defaultValue: "0000-00-00",
  });

  return preset(options as any);
}

// --- HMS preset ---

const hmsPattern = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

function hms(): BaseResult<string, string>;
function hms(options: { optional: true }): OptionalResult<string>;
function hms(options: { default: string }): DefaultResult<string>;
function hms(options: { array: true; maxItems?: number }): ArrayResult<string>;
function hms(options?: PresetOptions<string>): any {
  const preset = createPreset<string, string>({
    decode: (value: unknown): string => {
      const s = String(value);
      if (!hmsPattern.test(s)) throw new Error("invalid hms format");
      return s;
    },
    defaultValue: "00:00:00",
  });

  return preset(options as any);
}

// --- Enum preset ---

function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
): BaseResult<TEnumArray[number], TEnumArray[0]>;
function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
  options: { optional: true },
): OptionalResult<TEnumArray[number]>;
function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
  options: { default: TEnumArray[number] },
): DefaultResult<TEnumArray[number]>;
function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
  options: { array: true; maxItems?: number },
): ArrayResult<TEnumArray[number]>;
function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
  options?: PresetOptions<TEnumArray[number]>,
): any {
  if (enumArray.length === 0) throw new Error("enum array must not be empty");
  const preset = createPreset<TEnumArray[number], TEnumArray[0]>({
    decode: (value: unknown): TEnumArray[number] => {
      const s = String(value);
      if (!enumArray.includes(s)) throw new Error("invalid enum value");
      return s as TEnumArray[number];
    },
    defaultValue: enumArray[0] as TEnumArray[0],
  });

  return preset(options as any);
}

// --- Tuple preset ---

type InferTupleType<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: createQsUtils.InferValueFromItemQueryParamConfig<TConfigs[K]>;
};

type InferTupleDefaults<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: TConfigs[K] extends { defaultValue: infer TDefaultValue }
    ? TDefaultValue
    : undefined;
};

type InferTupleResolved<TConfigs extends ReadonlyArray<unknown>> = {
  [K in keyof TConfigs]: TConfigs[K] extends { resolve: (...args: any) => infer R }
    ? R
    : createQsUtils.InferValueFromItemQueryParamConfig<TConfigs[K]>;
};

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

interface TupleConfig {
  decode: (value: unknown) => unknown;
  defaultValue?: unknown;
  encode?: (value: any) => string | undefined;
  resolve?: (value: any) => unknown;
}

interface TupleResult<TConfigs extends ReadonlyArray<TupleConfig>> {
  isArray: true;
  decode: (value: Array<unknown>) => Mutable<InferTupleType<TConfigs>>;
  defaultValue: Mutable<InferTupleDefaults<TConfigs>>;
  encode: (value: Mutable<InferTupleType<TConfigs>>) => Array<string>;
}

type TupleResultWithResolve<TConfigs extends ReadonlyArray<TupleConfig>> = TupleResult<TConfigs> & {
  resolve: (value: Mutable<InferTupleType<TConfigs>>) => Mutable<InferTupleResolved<TConfigs>>;
};

function tuple<const TConfigs extends ReadonlyArray<TupleConfig>>(
  configs: TConfigs,
): [Mutable<InferTupleResolved<TConfigs>>] extends [Mutable<InferTupleType<TConfigs>>]
  ? TupleResult<TConfigs>
  : TupleResultWithResolve<TConfigs> {
  const defaultValue = configs.map((c) =>
    "defaultValue" in c ? c.defaultValue : undefined,
  ) as Mutable<InferTupleDefaults<TConfigs>>;

  const hasAnyResolve = configs.some((c) => "resolve" in c);

  const result: any = {
    isArray: true,
    decode: (values: Array<unknown>) => {
      return configs.map((c, i) => {
        try {
          return c.decode(values[i]);
        } catch {
          return "defaultValue" in c ? c.defaultValue : undefined;
        }
      }) as Mutable<InferTupleType<TConfigs>>;
    },
    defaultValue,
    // Encode uses "" as positional placeholder for nil/missing elements to preserve
    // tuple arity. This means optional string slots are lossy: undefined → "" → "".
    encode: (value: Mutable<InferTupleType<TConfigs>>) => {
      return (value as Array<unknown>).map((v, i) => {
        const config = configs[i];
        if (!config) return "";
        const enc = config.encode ?? ((val: unknown) => String(val));
        const encoded = enc(v);
        return isNil(encoded) ? "" : encoded;
      });
    },
  };

  if (hasAnyResolve) {
    result.resolve = (values: Mutable<InferTupleType<TConfigs>>) => {
      return (values as Array<unknown>).map((v, i) => {
        const config = configs[i];
        return config?.resolve ? config.resolve(v) : v;
      }) as Mutable<InferTupleResolved<TConfigs>>;
    };
  }

  return result;
}

export { boolean, createPreset, date, presetEnum as enum, float, hms, integer, string, tuple, ymd };
