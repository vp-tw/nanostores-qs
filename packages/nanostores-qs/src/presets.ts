import type { createQsUtils } from "./main";
import { isNil } from "es-toolkit";

function createPreset<TType, TDefaultValueType = TType>(config: {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode?: (value: TType) => string | undefined;
}): CreatePresetResult<TType, TDefaultValueType> {
  const encode = config.encode ?? ((v: TType) => String(v));

  const base = {
    decode: config.decode,
    defaultValue: config.defaultValue,
    encode,
  };

  const optional = {
    decode: config.decode,
    encode,
  };

  const array = {
    isArray: true as const,
    decode: (values: Array<unknown>): Array<TType> => {
      return values.flatMap((v) => {
        try {
          return [config.decode(v)];
        } catch {
          return [];
        }
      });
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

  return Object.assign(base, { optional, array }) as CreatePresetResult<TType, TDefaultValueType>;
}

// Internal result type — exact object shapes for InferValueFromQueryParamConfig to work
interface CreatePresetResult<TType, TDefaultValueType> {
  decode: (value: unknown) => TType;
  defaultValue: TDefaultValueType;
  encode: (value: TType) => string | undefined;
  optional: {
    decode: (value: unknown) => TType;
    encode: (value: TType) => string | undefined;
  };
  array: {
    isArray: true;
    decode: (value: Array<unknown>) => Array<TType>;
    encode: (value: Array<TType>) => Array<string>;
  };
}

const string = createPreset({
  decode: (value: unknown): string => String(value),
  defaultValue: "",
});

const booleanStrict = createPreset({
  decode: (value: unknown): boolean => {
    if (value === "true") return true;
    if (value === "false") return false;
    throw new Error("invalid boolean");
  },
  defaultValue: false,
  encode: (v) => (v ? "true" : undefined),
});

// Override base decode to be lenient: "true" → true, anything else → false
const boolean: CreatePresetResult<boolean, boolean> = {
  ...booleanStrict,
  decode: (value: unknown): boolean => value === "true",
  optional: booleanStrict.optional,
  array: booleanStrict.array,
};

function createIntegerPreset(roundFn: (n: number) => number): CreatePresetResult<number, number> {
  return createPreset({
    decode: (value: unknown): number => {
      const n = Number.parseFloat(String(value));
      if (Number.isNaN(n)) throw new Error("invalid integer");
      return roundFn(n);
    },
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      return String(v);
    },
  });
}

const integerRound = createIntegerPreset(Math.round);
const integerParse = createPreset({
  decode: (value: unknown): number => {
    const n = Number.parseInt(String(value), 10);
    if (Number.isNaN(n)) throw new Error("invalid integer");
    return n;
  },
  defaultValue: Number.NaN,
  encode: (v) => {
    if (isNil(v) || Number.isNaN(v)) return undefined;
    return String(v);
  },
});

const integer = Object.assign(integerRound, {
  parse: integerParse,
  ceil: createIntegerPreset(Math.ceil),
  floor: createIntegerPreset(Math.floor),
  round: integerRound,
});

const floatBase = createPreset({
  decode: (value: unknown): number => {
    const n = Number.parseFloat(String(value));
    if (Number.isNaN(n)) throw new Error("invalid float");
    return n;
  },
  defaultValue: Number.NaN,
  encode: (v) => {
    if (isNil(v) || Number.isNaN(v)) return undefined;
    return String(v);
  },
});

function fixed(digits: number): CreatePresetResult<number, number> {
  return createPreset({
    decode: (value: unknown): number => {
      const n = Number.parseFloat(String(value));
      if (Number.isNaN(n)) throw new Error("invalid float");
      return Number(n.toFixed(digits));
    },
    defaultValue: Number.NaN,
    encode: (v) => {
      if (isNil(v) || Number.isNaN(v)) return undefined;
      return v.toFixed(digits);
    },
  });
}

const float = Object.assign(floatBase, { fixed });

const date = createPreset({
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

const ymdPattern = /^\d{4}-\d{2}-\d{2}$/;
const ymd = createPreset({
  decode: (value: unknown): string => {
    const s = String(value);
    if (!ymdPattern.test(s)) throw new Error("invalid ymd format");
    return s;
  },
  defaultValue: "0000-00-00",
});

const hmsPattern = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
const hms = createPreset({
  decode: (value: unknown): string => {
    const s = String(value);
    if (!hmsPattern.test(s)) throw new Error("invalid hms format");
    return s;
  },
  defaultValue: "00:00:00",
});

function presetEnum<const TEnumArray extends ReadonlyArray<string>>(
  enumArray: TEnumArray,
): CreatePresetResult<TEnumArray[number], TEnumArray[0]> {
  return createPreset<TEnumArray[number], TEnumArray[0]>({
    decode: (value: unknown): TEnumArray[number] => {
      const s = String(value);
      if (!enumArray.includes(s)) throw new Error("invalid enum value");
      return s;
    },
    defaultValue: enumArray[0] as TEnumArray[0],
  });
}

// Type helpers for tuple inference
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type InferTupleType<TConfigs extends ReadonlyArray<unknown>> = Mutable<{
  [K in keyof TConfigs]: createQsUtils.InferValueFromItemQueryParamConfig<TConfigs[K]>;
}>;

type InferTupleDefaults<TConfigs extends ReadonlyArray<unknown>> = Mutable<{
  [K in keyof TConfigs]: TConfigs[K] extends { defaultValue: infer TDefaultValue }
    ? TDefaultValue
    : undefined;
}>;

interface TupleConfig {
  decode: (value: unknown) => unknown;
  defaultValue?: unknown;
  encode?: (value: any) => string | undefined;
}

function presetTuple<const TConfigs extends ReadonlyArray<TupleConfig>>(
  configs: TConfigs,
  options?: { separator?: string },
): {
  decode: (value: unknown) => InferTupleType<TConfigs>;
  defaultValue: InferTupleDefaults<TConfigs>;
  encode: (value: InferTupleType<TConfigs>) => string | undefined;
} {
  const separator = options?.separator ?? ",";

  const defaultValue = configs.map((c) =>
    "defaultValue" in c ? c.defaultValue : undefined,
  ) as InferTupleDefaults<TConfigs>;

  return {
    decode: (value: unknown): InferTupleType<TConfigs> => {
      const parts = String(value).split(separator);
      return configs.map((c, i) => c.decode(parts[i])) as InferTupleType<TConfigs>;
    },
    defaultValue,
    encode: (value: InferTupleType<TConfigs>): string | undefined => {
      const parts = (value as Array<unknown>).map((v, i) => {
        const enc = configs[i]!.encode ?? ((val: unknown) => String(val));
        return enc(v);
      });
      if (parts.every((p) => p == null)) return undefined;
      return parts.map((p) => p ?? "").join(separator);
    },
  };
}

// "enum" is a reserved word in JS, but valid as a named export
export { presetEnum as enum };

export { presetTuple as tuple };
export { boolean, createPreset, date, float, hms, integer, string, ymd };
export type { CreatePresetResult };
