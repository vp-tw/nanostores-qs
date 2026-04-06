import type { createQsUtils } from "./main";

function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

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

interface BaseResult<TType, TDefaultValueType> {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode: (value: TType) => string | undefined;
}

interface OptionalResult<TType> {
  decode: (value: unknown) => TType | undefined;
  encode: (value: TType | undefined) => string | undefined;
}

interface DefaultResult<TType> {
  decode: (value: unknown) => TType;
  defaultValue: TType;
  encode: (value: TType) => string | undefined;
}

interface ArrayResult<TType> {
  isArray: true;
  decode: (value: Array<unknown>) => Array<TType>;
  encode: (value: Array<TType>) => Array<string>;
}

// --- Config input ---

interface CreatePresetConfig<TType, TDefaultValueType> {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode?: (value: TType) => string | undefined;
}

// --- Overloaded return type ---

interface CreatePresetReturn<TType, TDefaultValueType> {
  (): BaseResult<TType, TDefaultValueType>;
  (options: { optional: true }): OptionalResult<TType>;
  <TDefault extends TType>(options: { default: TDefault }): DefaultResult<TType>;
  (options: { array: true; maxItems?: number }): ArrayResult<TType>;
  (
    options?: PresetOptions<TType>,
  ):
    | BaseResult<TType, TDefaultValueType>
    | OptionalResult<TType>
    | DefaultResult<TType>
    | ArrayResult<TType>;
}

// --- Factory ---

function createPreset<TType, TDefaultValueType = TType>(
  config: CreatePresetConfig<TType, TDefaultValueType>,
): CreatePresetReturn<TType, TDefaultValueType> {
  const encode = config.encode ?? ((v: TType) => String(v));

  function presetFn(options?: PresetOptions<TType>): any {
    // optional
    if (options && "optional" in options && options.optional === true) {
      return {
        decode: (v: unknown) => {
          if (isNil(v)) return undefined;
          return config.decode(v);
        },
        encode: (v: TType | undefined) => {
          if (isNil(v)) return undefined;
          return encode(v);
        },
      };
    }

    // default
    if (options && "default" in options && options.default !== undefined) {
      const defaultValue = options.default;
      return {
        decode: (v: unknown) => {
          if (isNil(v)) return defaultValue;
          return config.decode(v);
        },
        defaultValue,
        encode,
      };
    }

    // array
    if (options && "array" in options && options.array === true) {
      const maxItems = (options as ArrayOptions).maxItems;
      return {
        isArray: true as const,
        decode: (values: Array<unknown>): Array<TType> => {
          const result = values.flatMap((v) => {
            try {
              return [config.decode(v)];
            } catch {
              return [];
            }
          });
          if (maxItems !== undefined) {
            return result.slice(0, maxItems);
          }
          return result;
        },
        encode: (values: Array<TType>): Array<string> => {
          return values.flatMap((v) => {
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
    }

    // base (no options or empty options)
    return {
      decode: (v: unknown) => {
        if (isNil(v)) return config.defaultValue;
        return config.decode(v);
      },
      defaultValue: config.defaultValue,
      encode,
    };
  }

  return presetFn as CreatePresetReturn<TType, TDefaultValueType>;
}

// --- Integer preset ---

interface IntegerBaseOptions {
  round?: "ceil" | "floor" | "parse" | "round";
  min?: number;
  max?: number;
  outOfRange?: "clamp" | "reject";
}

type IntegerOptions =
  | (IntegerBaseOptions & ArrayOptions)
  | (IntegerBaseOptions & DefaultOptions<number>)
  | (IntegerBaseOptions & OptionalOptions<number>)
  | (IntegerBaseOptions & Partial<BaseOptions>);

function integer(): BaseResult<number, number>;
function integer(options: IntegerBaseOptions): BaseResult<number, number>;
function integer(options: IntegerBaseOptions & { optional: true }): OptionalResult<number>;
function integer(options: IntegerBaseOptions & { default: number }): DefaultResult<number>;
function integer(
  options: IntegerBaseOptions & { array: true; maxItems?: number },
): ArrayResult<number>;
function integer(options?: IntegerOptions): any {
  const round = options?.round ?? "round";
  const min = options?.min ?? Number.MIN_SAFE_INTEGER;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  const outOfRange = options?.outOfRange ?? "clamp";

  const preset = createPreset<number, number>({
    decode: (value: unknown): number => {
      const n =
        round === "parse" ? Number.parseInt(String(value), 10) : Number.parseFloat(String(value));
      if (Number.isNaN(n)) throw new Error("invalid integer");
      const rounded = round === "parse" ? n : Math[round](n);
      if (outOfRange === "reject") {
        if (rounded < min || rounded > max) throw new Error("out of range");
      }
      return Math.max(min, Math.min(max, rounded));
    },
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      return String(v);
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
  | (FloatBaseOptions & OptionalOptions<number>)
  | (FloatBaseOptions & Partial<BaseOptions>);

function float(): BaseResult<number, number>;
function float(options: FloatBaseOptions): BaseResult<number, number>;
function float(options: FloatBaseOptions & { optional: true }): OptionalResult<number>;
function float(options: FloatBaseOptions & { default: number }): DefaultResult<number>;
function float(options: FloatBaseOptions & { array: true; maxItems?: number }): ArrayResult<number>;
function float(options?: FloatOptions): any {
  const fixed = options?.fixed;
  const min = options?.min ?? Number.MIN_SAFE_INTEGER;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  const outOfRange = options?.outOfRange ?? "clamp";

  const preset = createPreset<number, number>({
    decode: (value: unknown): number => {
      let n = Number.parseFloat(String(value));
      if (Number.isNaN(n)) throw new Error("invalid float");
      if (fixed !== undefined) {
        n = Number(n.toFixed(fixed));
      }
      if (outOfRange === "reject") {
        if (n < min || n > max) throw new Error("out of range");
      }
      return Math.max(min, Math.min(max, n));
    },
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      if (fixed !== undefined) return v.toFixed(fixed);
      return String(v);
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

  const preset = createPreset<string, string>({
    decode: (value: unknown): string => {
      const s = String(value);
      if (maxLength !== undefined && s.length > maxLength) {
        if (outOfRange === "reject") throw new Error("string too long");
        return s.slice(0, maxLength);
      }
      return s;
    },
    defaultValue: "",
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
  const defaultValue =
    options && "default" in options && options.default !== undefined ? options.default : false;

  // optional: strict decode
  if (options && "optional" in options && options.optional === true) {
    return {
      decode: (v: unknown) => {
        if (isNil(v)) return undefined;
        if (v === "true") return true;
        if (v === "false") return false;
        throw new Error("invalid boolean");
      },
      encode: (v: boolean | undefined) => {
        if (isNil(v)) return undefined;
        return v ? "true" : "false";
      },
    };
  }

  // array: strict decode, filter invalid
  if (options && "array" in options && options.array === true) {
    const maxItems = (options as ArrayOptions).maxItems;
    return {
      isArray: true as const,
      decode: (values: Array<unknown>): Array<boolean> => {
        const result = values.flatMap((v) => {
          if (v === "true") return [true];
          if (v === "false") return [false];
          return [];
        });
        return maxItems !== undefined ? result.slice(0, maxItems) : result;
      },
      encode: (values: Array<boolean>): Array<string> => values.map((v) => (v ? "true" : "false")),
    };
  }

  // base or default: lenient decode, conditional encode
  return {
    decode: (v: unknown): boolean => v === "true",
    defaultValue,
    encode: (v: boolean): string | undefined => {
      if (v === defaultValue) return undefined;
      return v ? "true" : "false";
    },
  };
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

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

interface TupleConfig {
  decode: (value: unknown) => unknown;
  defaultValue?: unknown;
  encode?: (value: any) => string | undefined;
}

function tuple<const TConfigs extends ReadonlyArray<TupleConfig>>(
  configs: TConfigs,
): {
  isArray: true;
  decode: (value: Array<unknown>) => Mutable<InferTupleType<TConfigs>>;
  defaultValue: Mutable<InferTupleDefaults<TConfigs>>;
  encode: (value: Mutable<InferTupleType<TConfigs>>) => Array<string>;
} {
  const defaultValue = configs.map((c) =>
    "defaultValue" in c ? c.defaultValue : undefined,
  ) as Mutable<InferTupleDefaults<TConfigs>>;

  return {
    isArray: true,
    decode: (values: Array<unknown>) => {
      return configs.map((c, i) => c.decode(values[i])) as Mutable<InferTupleType<TConfigs>>;
    },
    defaultValue,
    encode: (value: Mutable<InferTupleType<TConfigs>>) => {
      return (value as Array<unknown>).flatMap((v, i) => {
        const config = configs[i];
        if (!config) return [];
        const enc = config.encode ?? ((val: unknown) => String(val));
        const encoded = enc(v);
        return isNil(encoded) ? [] : [encoded];
      });
    },
  };
}

export { boolean, createPreset, date, presetEnum as enum, float, hms, integer, string, tuple, ymd };
