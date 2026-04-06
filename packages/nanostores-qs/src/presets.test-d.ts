import type { CreatePresetResult } from "./presets";

import { createPreset } from "./presets";

// createPreset returns the correct type
(() => {
  const preset = createPreset({
    decode: (value: unknown): number => Number(value),
    defaultValue: 0,
    encode: (v) => String(v),
  });

  // Base has decode, defaultValue, and encode
  preset satisfies {
    decode: (value: unknown) => number;
    defaultValue: number;
    encode: (value: number) => string | undefined;
  };

  // Optional has decode and encode but no defaultValue
  preset.optional satisfies {
    decode: (value: unknown) => number;
    encode: (value: number) => string | undefined;
  };

  // Array has isArray: true, decode, and encode
  preset.array satisfies {
    isArray: true;
    decode: (value: Array<unknown>) => Array<number>;
    encode: (value: Array<number>) => Array<string>;
  };

  // Full result type
  preset satisfies CreatePresetResult<number, number>;
})();
