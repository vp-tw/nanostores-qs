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
      return {
        decode: config.decode,
        defaultValue: options.default,
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
      decode: config.decode,
      defaultValue: config.defaultValue,
      encode,
    };
  }

  return presetFn as CreatePresetReturn<TType, TDefaultValueType>;
}

export { createPreset };
