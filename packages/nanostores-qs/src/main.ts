import type { ReadableAtom } from "nanostores";
import { isEqual, isNil, mapValues } from "es-toolkit";
import { atom, computed } from "nanostores";

function getSearch() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.search;
}

namespace createQsUtils {
  export type BaseQsRecord = Record<string, any>;
  export type DefaultQsRecord = Record<
    string,
    undefined | string | Array<string>
  >;
  export interface Options<TQsRecord extends BaseQsRecord = DefaultQsRecord> {
    /**
     * Custom `isEqual` function to determine if a value is equal to default
     * value or not. If they are equal, the key will be omitted from the query
     * string.
     *
     * Default is `es-toolkit.isEqual`.
     */
    isEqual?: (a: any, b: any) => boolean;
    qs?: {
      /**
       * Parse query string to values.
       *
       * @default {@link URLSearchParams}
       */
      parse: (search: string) => TQsRecord;

      /**
       * Convert values to query string.
       *
       * @default {@link String}
       */
      stringify: (qs: TQsRecord) => string;
    };
  }

  export type BaseItemSearchParamConfig<
    TQsRecord extends BaseQsRecord = BaseQsRecord,
  > =
    | undefined
    | {
        isArray?: false;
        decode?: (value: TQsRecord[keyof TQsRecord]) => any;
        defaultValue?: any;
        encode?: (value: any) => TQsRecord[keyof TQsRecord];
      };

  export interface BaseArraySearchParamConfig<
    TQsRecord extends BaseQsRecord = BaseQsRecord,
  > {
    isArray: true;
    decode?: (value: ToArray<TQsRecord[keyof TQsRecord]>) => Array<any>;
    defaultValue?: Array<any>;
    encode?: (value: any) => TQsRecord[keyof TQsRecord];
  }

  export type BaseSearchParamConfig<
    TQsRecord extends BaseQsRecord = BaseQsRecord,
  > =
    | BaseItemSearchParamConfig<TQsRecord>
    | BaseArraySearchParamConfig<TQsRecord>;

  export interface DefaultConfig<
    TQsRecord extends BaseQsRecord = BaseQsRecord,
  > {
    isArray: false;
    defaultValue: undefined;
    decode: (value: TQsRecord) => undefined | string;
  }
  export interface DefaultArrayConfig<
    TQsRecord extends BaseQsRecord = BaseQsRecord,
  > {
    isArray: true;
    defaultValue: Array<string>;
    decode: (value: ToArray<TQsRecord[keyof TQsRecord]>) => Array<string>;
  }

  export type InferValueFromItemQueryParamConfig<TConfig> =
    | (TConfig extends {
        defaultValue: infer TDefaultValue;
      }
        ? TDefaultValue
        : undefined)
    | (TConfig extends {
        decode: (...args: any) => infer TDecodeReturnType;
      }
        ? TDecodeReturnType
        : string);
  export type InferValueFromArrayQueryParamConfig<TConfig> =
    | (TConfig extends {
        defaultValue: infer TDefaultValue;
      }
        ? TDefaultValue
        : TConfig extends {
              decode: (...args: any) => infer TDecodeReturnType;
            }
          ? TDecodeReturnType
          : Array<string>)
    | (TConfig extends {
        decode: (...args: any) => infer TDecodeReturnType;
      }
        ? TDecodeReturnType
        : Array<string>);
  export type InferValueFromQueryParamConfig<TConfig> = TConfig extends {
    isArray: true;
  }
    ? InferValueFromArrayQueryParamConfig<TConfig>
    : InferValueFromItemQueryParamConfig<TConfig>;
  export type FallbackQueryParamConfig<
    TQsRecord extends BaseQsRecord,
    TConfig,
  > = TConfig extends undefined
    ? undefined extends TConfig
      ? DefaultConfig<TQsRecord>
      : NonNullable<TConfig>
    : NonNullable<TConfig>;
  export type InferQsRecordFromOptions<TOptions extends Options<BaseQsRecord>> =
    TOptions extends Options<infer TQsRecord> ? TQsRecord : DefaultQsRecord;
  export type DefineSearchParam<TQsRecord extends BaseQsRecord> = <
    TConfig extends NonNullable<BaseSearchParamConfig<TQsRecord>>,
  >(
    config: TConfig,
  ) => TConfig & {
    setEncode: (
      encode: (
        value:
          | (TConfig["decode"] extends (...args: any) => any
              ? ReturnType<TConfig["decode"]>
              : [])
          | (TConfig extends {
              defaultValue: infer TDefaultValue;
            }
              ? TDefaultValue
              : TConfig["decode"] extends (...args: any) => any
                ? ReturnType<TConfig["decode"]>
                : []),
      ) => TQsRecord[keyof TQsRecord],
    ) => TConfig;
  };
  export type CreateSearchParamsStore<
    TQsRecord extends BaseQsRecord = DefaultQsRecord,
  > = <
    const TConfigRecord extends Record<
      string,
      BaseSearchParamConfig<TQsRecord>
    >,
  >(
    configs:
      | TConfigRecord
      | ((def: createQsUtils.DefineSearchParam<TQsRecord>) => TConfigRecord),
  ) => {
    $values: ReadableAtom<{
      [TKey in keyof TConfigRecord]: InferValueFromSearchParamConfig<
        FallbackQueryParamConfig<TQsRecord, TConfigRecord[TKey]>
      >;
    }>;
    updateAll: (
      values: {
        [TKey in keyof TConfigRecord]: InferValueFromSearchParamConfig<
          FallbackQueryParamConfig<TQsRecord, TConfigRecord[TKey]>
        >;
      },
      options?: UpdateOptions,
    ) => void;
    update: <TKey extends keyof TConfigRecord>(
      key: TKey,
      value: InferValueFromSearchParamConfig<
        FallbackQueryParamConfig<TQsRecord, TConfigRecord[TKey]>
      >,
      options?: UpdateOptions,
    ) => void;
  };
  export type CreateSearchParamStore<
    TQsRecord extends BaseQsRecord = DefaultQsRecord,
  > = <TConfig extends BaseSearchParamConfig<TQsRecord> = undefined>(
    name: string,
    config?:
      | TConfig
      | ((def: createQsUtils.DefineSearchParam<TQsRecord>) => TConfig),
  ) => {
    $value: ReadableAtom<
      InferValueFromQueryParamConfig<
        FallbackQueryParamConfig<TQsRecord, TConfig>
      >
    >;
    update: (
      value: InferValueFromQueryParamConfig<
        FallbackQueryParamConfig<TQsRecord, TConfig>
      >,
      options?: UpdateOptions,
    ) => void;
  };
  export interface QsUtils<TQsRecord extends BaseQsRecord = DefaultQsRecord> {
    $search: ReadableAtom<string>;
    $urlSearchParams: ReadableAtom<URLSearchParams>;
    $qs: ReadableAtom<TQsRecord>;
    defineSearchParam: DefineSearchParam<TQsRecord>;
    createSearchParamsStore: CreateSearchParamsStore<TQsRecord>;
    createSearchParamStore: CreateSearchParamStore<TQsRecord>;
    destroy: () => void;
  }
  export interface UpdateOptions {
    replace?: boolean;
    keepHash?: boolean;
    /**
     * If true, forces the update to proceed even if the new value is the same as the current value.
     * Defaults to `false`.
     */
    force?: boolean;
    state?: Parameters<typeof history.pushState>[0];
    unused?: Parameters<typeof history.pushState>[1];
  }
  export type ToArray<T> = Extract<T, Array<any>> | [Exclude<T, Array<any>>];
  export type InferValueFromSearchParamConfig<
    TConfig extends
      | {
          decode?: (...args: any) => any;
          defaultValue?: any;
        }
      | undefined,
  > =
    | (TConfig extends {
        decode?: (...args: any) => infer TDecodeReturnType;
      }
        ? TDecodeReturnType
        : string)
    | (TConfig extends { defaultValue?: infer TDefaultValue }
        ? TDefaultValue
        : undefined);
}

const defaultOptions: createQsUtils.Options<createQsUtils.DefaultQsRecord> = {
  qs: {
    parse: (search) => {
      const urlSearchParams = new URLSearchParams(search);
      const entries = Array.from(urlSearchParams.entries());
      const result: createQsUtils.DefaultQsRecord = {};
      for (const [key, value] of entries) {
        if (key in result) {
          if (Array.isArray(result[key])) {
            result[key].push(value);
          } else {
            result[key] = [result[key] ?? "", value];
          }
        } else {
          result[key] = value;
        }
      }
      return result;
    },
    stringify: (values) => {
      const urlSearchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(values)) {
        if (value === undefined) {
          continue;
        }
        if (Array.isArray(value)) {
          for (const item of value) {
            urlSearchParams.append(key, item);
          }
        } else {
          urlSearchParams.set(key, value);
        }
      }
      return urlSearchParams.toString();
    },
  },
  isEqual,
};

/**
 * Create a utility for managing query string.
 *
 * @example
 *
 * ```tsx
 * const qsUtils = createQsUtils();
 *
 * const MyComponent: React.FC = () => {
 *   const qs = useStore(qsUtils.$qs);
 *   const search = useStore(qsUtils.$search);
 * }
 *
 * const { $values, updateAll } = qsUtils.createSearchParamsStore(config);
 * const { $value, update } = qsUtils.createSearchParamStore(name, config);
 * ```
 */
function createQsUtils<
  TQsRecord extends createQsUtils.BaseQsRecord = createQsUtils.DefaultQsRecord,
>(
  options?: createQsUtils.Options<TQsRecord>,
): createQsUtils.QsUtils<TQsRecord> {
  type TOptions = createQsUtils.Options<TQsRecord>;
  type TQsUtils = createQsUtils.QsUtils<TQsRecord>;
  const qs: NonNullable<TOptions["qs"]> =
    options?.qs ??
    (defaultOptions.qs as unknown as NonNullable<TOptions["qs"]>);
  const isEqual: NonNullable<TOptions["isEqual"]> =
    options?.isEqual ??
    (defaultOptions.isEqual as NonNullable<TOptions["isEqual"]>);

  const $internalSearch = atom<string>(getSearch());
  const $search: TQsUtils["$search"] = computed(
    $internalSearch,
    (search) => search,
  );
  const $urlSearchParams: TQsUtils["$urlSearchParams"] = computed(
    $internalSearch,
    () => {
      const search = $internalSearch.get();
      return new URLSearchParams(search);
    },
  );
  const $qs: TQsUtils["$qs"] = computed($search, (search) => {
    return qs.parse(search);
  });

  const destroyTasks: Array<() => void> = [];
  let destroyed = false;
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const task of destroyTasks) {
      task();
    }
  }
  function updateSearch() {
    const search = getSearch();
    if ($internalSearch.get() === search) return;
    $internalSearch.set(search);
  }
  (() => {
    if (typeof window === "undefined") return;

    // Listen to popstate and pushState/replaceState

    window.addEventListener("popstate", updateSearch);
    destroyTasks.push(() => {
      window.removeEventListener("popstate", updateSearch);
    });
    const pushState = history.pushState;
    history.pushState = (...args) => {
      pushState.apply(history, args);
      if (destroyed) return;
      updateSearch();
    };
    const replaceState = history.replaceState;
    history.replaceState = (...args) => {
      replaceState.apply(history, args);
      if (destroyed) return;
      updateSearch();
    };
  })();
  const defaultItemConfig = {
    isArray: false,
    defaultValue: undefined,
    decode: (value) => (isNil(value) ? undefined : String(value)),
  } satisfies createQsUtils.DefaultConfig<TQsRecord>;
  const defaultArrayConfig = {
    isArray: true,
    defaultValue: [],
    decode: (value) =>
      (value as Array<unknown>).flatMap((i) => (isNil(i) ? [] : [String(i)])),
  } satisfies createQsUtils.DefaultArrayConfig<TQsRecord>;
  const defineSearchParam: createQsUtils.DefineSearchParam<TQsRecord> = <
    TConfig extends NonNullable<createQsUtils.BaseSearchParamConfig<TQsRecord>>,
  >(
    config: TConfig,
  ) => {
    return {
      ...config,
      setEncode: (encode: any) => ({
        ...config,
        encode,
      }),
    };
  };
  /**
   * Create a store for a search params.
   */
  const createSearchParamsStore: createQsUtils.CreateSearchParamsStore<
    TQsRecord
  > = <
    const TConfigRecord extends Record<
      string,
      createQsUtils.BaseSearchParamConfig<TQsRecord>
    >,
  >(
    configRecord:
      | TConfigRecord
      | ((def: createQsUtils.DefineSearchParam<TQsRecord>) => TConfigRecord),
  ) => {
    const resolvedConfigRecord: TConfigRecord =
      typeof configRecord === "function"
        ? configRecord(defineSearchParam)
        : configRecord;
    type TValues = {
      [K in keyof TConfigRecord]: createQsUtils.InferValueFromSearchParamConfig<
        TConfigRecord[K]
      >;
    };
    function getParsedValues(qsRecord: TQsRecord): TValues {
      const values: TValues = mapValues(
        resolvedConfigRecord,
        (configInput, key) => {
          const config = {
            ...(configInput?.isArray ? defaultArrayConfig : defaultItemConfig),
            ...configInput,
          } as NonNullable<createQsUtils.BaseSearchParamConfig<TQsRecord>>;
          const qsValue = !(key in qsRecord)
            ? undefined
            : qsRecord[key as keyof TQsRecord];
          const value = Array.isArray(qsValue)
            ? config.isArray
              ? qsValue
              : qsValue[0]
            : config.isArray
              ? !(key in qsRecord)
                ? []
                : [qsValue]
              : qsValue;
          const parsed = (() => {
            if (
              !("defaultValue" in config) &&
              (qsValue === undefined ||
                (config.isArray && Array.isArray(value) && value.length === 0))
            ) {
              return undefined;
            }
            try {
              return config.decode
                ? config.decode(value)
                : !value
                  ? value
                  : String(value);
            } catch (_e) {
              return config.defaultValue;
            }
          })();
          return parsed;
        },
      ) as TValues;
      return values;
    }
    const $values: ReadableAtom<TValues> = computed($qs, (qs) =>
      getParsedValues(qs),
    );
    const updateAll: ReturnType<typeof createSearchParamsStore>["updateAll"] = (
      values,
      updateOptions,
    ) => {
      const state = updateOptions?.state ?? {};
      const unused = updateOptions?.unused ?? "";
      const force = updateOptions?.force ?? false;
      const replace = updateOptions?.replace ?? false;
      const keepHash = updateOptions?.keepHash ?? false;
      const currentValue = $values.get();
      if (!force && isEqual(currentValue, values)) {
        return;
      }
      const qsRecord = $qs.get();
      const failedEncodeKeys: Array<keyof TValues> = [];
      const nextEncodedValues = Object.fromEntries(
        Object.entries(resolvedConfigRecord).flatMap(([key, configInput]) => {
          const config = {
            ...(configInput?.isArray ? defaultArrayConfig : defaultItemConfig),
            ...configInput,
          } as NonNullable<createQsUtils.BaseSearchParamConfig<TQsRecord>>;
          if (
            !("defaultValue" in config) &&
            (values[key] === undefined ||
              (config.isArray &&
                Array.isArray(values[key]) &&
                values[key].length === 0))
          ) {
            failedEncodeKeys.push(key);
            return [];
          }
          const encode =
            config.encode ??
            (config.isArray
              ? (v: unknown) =>
                  (Array.isArray(v) ? v : [v]).map((i) => String(i))
              : String);
          try {
            return [[key, encode(values[key])]];
          } catch (_e) {
            failedEncodeKeys.push(key);
            return [];
          }
        }),
      ) as TQsRecord;
      const nextDecodedValue = getParsedValues(nextEncodedValues);
      const keysToOmit = Object.keys(nextEncodedValues).filter((key) =>
        isEqual(nextDecodedValue[key], resolvedConfigRecord[key]?.defaultValue),
      );
      const nextQsValues = { ...qsRecord, ...nextEncodedValues };
      for (const key of [...keysToOmit, ...failedEncodeKeys]) {
        delete nextQsValues[key as keyof TQsRecord];
      }
      const stringified = qs.stringify(nextQsValues);
      const nextSearch = !stringified ? "" : `?${stringified}`;
      const currentHash = window.location.hash;
      const url = nextSearch + (keepHash ? currentHash : "") || ".";
      if (replace) {
        history.replaceState(state, unused, url);
      } else {
        history.pushState(state, unused, url);
      }
    };
    const update: ReturnType<TQsUtils["createSearchParamsStore"]>["update"] = (
      key,
      value,
      options,
    ) => {
      updateAll(
        {
          ...$values.get(),
          [key]: value,
        },
        options,
      );
    };
    return {
      $values,
      updateAll,
      update,
    };
  };
  const createSearchParamStore: createQsUtils.CreateSearchParamStore<
    TQsRecord
  > = <
    TConfig extends createQsUtils.BaseSearchParamConfig<TQsRecord> = undefined,
  >(
    name: string,
    config:
      | TConfig
      | ((def: createQsUtils.DefineSearchParam<TQsRecord>) => TConfig),
  ) => {
    type TValue = createQsUtils.InferValueFromQueryParamConfig<
      createQsUtils.FallbackQueryParamConfig<TQsRecord, TConfig>
    >;
    const _fake_key: unique symbol = Symbol("_fake_key");
    type Name = string & {
      [_fake_key]: "_fake_key";
    };
    const typedName = name as Name;
    const resolvedConfig: TConfig =
      typeof config === "function" ? config(defineSearchParam) : config;
    const searchParamsStore = createSearchParamsStore({
      [typedName]: resolvedConfig,
    });
    const $value: ReadableAtom<TValue> = computed(
      searchParamsStore.$values,
      (values) => values[typedName] as TValue,
    );
    const update: (
      value: createQsUtils.InferValueFromQueryParamConfig<
        createQsUtils.FallbackQueryParamConfig<TQsRecord, TConfig>
      >,
      options?: createQsUtils.UpdateOptions,
    ) => void = (value, options) => {
      searchParamsStore.updateAll(
        { [name]: value } as ReturnType<typeof searchParamsStore.$values.get>,
        options,
      );
    };
    return {
      // TODO: fix type
      $value: $value as any,
      update,
    };
  };
  return {
    $search,
    $urlSearchParams,
    $qs,
    defineSearchParam,
    createSearchParamStore,
    createSearchParamsStore,
    destroy,
  };
}

export { createQsUtils };
