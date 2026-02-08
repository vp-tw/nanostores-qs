import type { createQsUtils } from "./main";

const defineSearchParam: createQsUtils.DefineSearchParam<Record<string, unknown>> = (config) => {
  return {
    ...config,
    setEncode: (encode) => ({
      ...config,
      encode,
    }),
  };
};

export { defineSearchParam };
