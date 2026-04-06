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

export { boolean, createPreset, string };
export type { CreatePresetResult };
