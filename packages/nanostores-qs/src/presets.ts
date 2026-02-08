import { isNil } from "es-toolkit";
import { defineSearchParam } from "./defineSearchParam";

/**
 * Preset search param configurations.
 */
export const presetString: {
  defaultValue: string;
  setEncode: (encode: (value: string | []) => unknown) => { defaultValue: string };
} = defineSearchParam({
  defaultValue: "",
});

/**
 * Optional string search param configuration.
 * Encodes `undefined` as missing parameter.
 *
 * This preset is intentionally set to `undefined` to indicate that no configuration
 * is needed for optional string parameters. Consumers should handle `undefined`
 * appropriately when using this preset.
 */
export const presetStringOptional: undefined = undefined;

/**
 * Array of string search param configuration.
 */
export const presetStringArray: {
  isArray: true;
  setEncode: (encode: (value: Array<string>) => unknown) => { isArray: true };
} = defineSearchParam({
  isArray: true,
});

/**
 * Integer search param configuration. Decodes invalid integers as `Number.NaN`.
 */
export const presetInt: {
  decode: (value: unknown) => number;
  defaultValue: number;
} = defineSearchParam({
  decode: (value: unknown): number => {
    const int = Number.parseInt(String(value), 10);
    return int;
  },
  defaultValue: Number.NaN,
}).setEncode((value: number): unknown => {
  if (isNil(value) || Number.isNaN(value)) return undefined;
  return String(value);
});

/**
 * Optional integer search param configuration. Decodes invalid integers as `undefined`.
 */
export const presetIntOptional: {
  decode: (value: unknown) => number | undefined;
} = defineSearchParam({
  decode: (value: unknown): number | undefined => {
    const int = Number.parseInt(String(value), 10);
    if (Number.isNaN(int)) return undefined;
    return int;
  },
}).setEncode((value: number | undefined): unknown => {
  if (isNil(value) || Number.isNaN(value)) return undefined;
  return String(value);
});

/**
 * Array of integer search param configuration. Ignores invalid integers.
 */
export const presetIntArray: {
  isArray: true;
  decode: (value: Array<unknown>) => Array<number>;
} = defineSearchParam({
  isArray: true,
  decode: (value: Array<unknown>): Array<number> => {
    return value.flatMap((v) => {
      try {
        const int = Number.parseInt(String(v), 10);
        if (Number.isNaN(int)) return [];
        return [int];
      } catch {
        return [];
      }
    });
  },
}).setEncode((value: Array<number>): unknown => {
  return value.flatMap((v) => {
    if (isNil(v) || Number.isNaN(v)) return [];
    return [String(v)];
  });
});

export const presetFloat: {
  decode: (value: unknown) => number;
  defaultValue: number;
} = defineSearchParam({
  decode: (value: unknown): number => Number.parseFloat(String(value)),
  defaultValue: Number.NaN,
}).setEncode((value: number): unknown => {
  if (isNil(value) || Number.isNaN(value)) return undefined;
  return String(value);
});

/**
 * Optional float search param configuration. Decodes invalid floats as `undefined`.
 */
export const presetFloatOptional: {
  decode: (value: unknown) => number | undefined;
} = defineSearchParam({
  decode: (value: unknown): number | undefined => {
    const float = Number.parseFloat(String(value));
    if (Number.isNaN(float)) return undefined;
    return float;
  },
}).setEncode((value: number | undefined): unknown => {
  if (isNil(value) || Number.isNaN(value)) return undefined;
  return String(value);
});

/**
 * Array of float search param configuration. Ignores invalid floats.
 */
export const presetFloatArray: {
  isArray: true;
  decode: (value: Array<unknown>) => Array<number>;
} = defineSearchParam({
  isArray: true,
  decode: (value: Array<unknown>): Array<number> => {
    return value.flatMap((v) => {
      try {
        const float = Number.parseFloat(String(v));
        if (Number.isNaN(float)) return [];
        return [float];
      } catch {
        return [];
      }
    });
  },
}).setEncode((value: Array<number>): unknown => {
  return value.flatMap((v) => {
    if (isNil(v) || Number.isNaN(v)) return [];
    return [String(v)];
  });
});

/**
 * Boolean search param configuration. Decodes missing or falsy values as `false`, any other value as `true`.
 * Encodes `true` as `"true"`, `false` as missing parameter.
 */
export const presetBoolean: {
  decode: (value: unknown) => boolean;
  defaultValue: boolean;
} = defineSearchParam({
  decode: (value: unknown): boolean => Boolean(value),
  defaultValue: false,
}).setEncode((value: boolean): unknown => (value ? "true" : undefined));

/**
 * Optional boolean search param configuration. Decodes `"true"` as `true`,
 * `"false"` as `false`, missing or any other value as `undefined`.
 */
export const presetBooleanOptional: {
  decode: (value: unknown) => boolean | undefined;
} = defineSearchParam({
  decode: (value: unknown): boolean | undefined => {
    if (value === "true") return true;
    if (value === "false") return false;
    return undefined;
  },
}).setEncode((value: boolean | undefined): unknown =>
  value === true ? "true" : value === false ? "false" : undefined,
);

/**
 * Enum search param configuration. Decodes invalid values as the first enum
 * value. Encodes the value as is.
 */
export const presetEnum = <const TEnumArray extends readonly [string, ...Array<string>]>(
  enumArray: TEnumArray,
): {
  decode: (value: unknown) => TEnumArray[number];
  defaultValue: TEnumArray[0];
  setEncode: (encode: (value: TEnumArray[number] | TEnumArray[0]) => unknown) => {
    decode: (value: unknown) => TEnumArray[number];
    defaultValue: TEnumArray[0];
  };
} => {
  return defineSearchParam({
    decode: (value: unknown): TEnumArray[number] =>
      typeof value === "string" && enumArray.includes(value) ? value : enumArray[0],
    defaultValue: enumArray[0] satisfies TEnumArray[0] as TEnumArray[0],
  });
};

/**
 * Optional enum search param configuration. Decodes invalid values as `undefined`.
 * Encodes the value as is, encodes `undefined` as missing parameter.
 */
export const presetEnumOptional = <const TEnumArray extends readonly [string, ...Array<string>]>(
  enumArray: TEnumArray,
): {
  decode: (value: unknown) => TEnumArray[number] | undefined;
  setEncode: (encode: (value: TEnumArray[number] | undefined) => unknown) => {
    decode: (value: unknown) => TEnumArray[number] | undefined;
  };
} => {
  return defineSearchParam({
    decode: (value: unknown): TEnumArray[number] | undefined =>
      typeof value === "string" && enumArray.includes(value) ? value : undefined,
  });
};

/**
 * Array of enum search param configuration. Ignores invalid values.
 */
export const presetEnumArray = <const TEnumArray extends readonly [string, ...Array<string>]>(
  enumArray: TEnumArray,
): {
  isArray: true;
  decode: (value: Array<unknown>) => Array<TEnumArray[number]>;
  setEncode: (encode: (value: Array<TEnumArray[number]>) => unknown) => {
    isArray: true;
    decode: (value: Array<unknown>) => Array<TEnumArray[number]>;
  };
} => {
  return defineSearchParam({
    isArray: true,
    decode: (value: Array<unknown>): Array<TEnumArray[number]> => {
      return value.flatMap((v) => {
        if (typeof v === "string" && enumArray.includes(v)) return [v];
        return [];
      });
    },
  });
};

const invalidDate = new Date(Number.NaN);

export const presetDate: {
  decode: (value: unknown) => Date;
  defaultValue: Date;
} = defineSearchParam({
  decode: (value: unknown): Date => {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return invalidDate;
    return date;
  },
  defaultValue: invalidDate,
}).setEncode((value: Date): unknown => {
  if (isNil(value) || Number.isNaN(value.getTime())) return undefined;
  return value.toISOString();
});

/**
 * Date search param configuration. Decodes invalid dates as `undefined`.
 * Encodes the date as ISO string.
 */
export const presetDateOptional: {
  decode: (value: unknown) => Date | undefined;
} = defineSearchParam({
  decode: (value: unknown): Date | undefined => {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
  },
}).setEncode((value: Date | undefined): unknown => {
  if (isNil(value) || Number.isNaN(value.getTime())) return undefined;
  return value.toISOString();
});

/**
 * Array of date search param configuration. Ignores invalid dates.
 * Encodes the dates as ISO strings.
 */
export const presetDateArray: {
  isArray: true;
  decode: (value: Array<unknown>) => Array<Date>;
} = defineSearchParam({
  isArray: true,
  decode: (value: Array<unknown>): Array<Date> => {
    return value.flatMap((v) => {
      try {
        const date = new Date(String(v));
        if (Number.isNaN(date.getTime())) return [];
        return [date];
      } catch {
        return [];
      }
    });
  },
}).setEncode((value: Array<Date>): unknown => {
  return value.flatMap((v) => {
    if (isNil(v) || Number.isNaN(v.getTime())) return [];
    return [v.toISOString()];
  });
});
