import type { ReadableAtom } from "nanostores";
import type { F } from "ts-toolbelt";
import { isEqual, mapValues } from "es-toolkit";
import { atom, computed } from "nanostores";

function getSearch() {
  return window.location.search;
}

namespace createQsUtils {
  export type BaseQsRecord = Record<string, any>;
  export interface Options<TQsRecord extends BaseQsRecord> {
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
  export interface UpdateOptions {
    replace?: boolean;
    keepHash?: boolean;
    state?: Parameters<typeof history.pushState>[0];
    unused?: Parameters<typeof history.pushState>[1];
  }
  export type ToArray<T> = Extract<T, Array<any>> | [Exclude<T, Array<any>>];
  export type GetValueFromSearchParamConfig<
    TConfig extends {
      decode?: (...args: any) => any;
      defaultValue?: any;
    },
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

const defaultOptions = {
  qs: {
    parse: (search) => {
      const urlSearchParams = new URLSearchParams(search);
      const entries = Array.from(urlSearchParams.entries());
      const result: Record<string, undefined | string | Array<string>> = {};
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
} satisfies createQsUtils.Options<
  Record<string, undefined | string | Array<string>>
>;

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
  TOptions extends
    createQsUtils.Options<createQsUtils.BaseQsRecord> = createQsUtils.Options<
    ReturnType<typeof defaultOptions.qs.parse>
  >,
>(options?: TOptions) {
  const qs: NonNullable<Extract<TOptions, { qs: any }>["qs"]> =
    options?.qs ?? defaultOptions.qs;
  const isEqual: NonNullable<Extract<TOptions, { isEqual: any }>["isEqual"]> =
    options?.isEqual ?? defaultOptions.isEqual;
  type TQsRecord = TOptions extends {
    qs: {
      parse: (search: string) => infer TQsRecord;
    };
  }
    ? TQsRecord
    : ReturnType<typeof defaultOptions.qs.parse>;

  const $internalSearch = atom<string>(getSearch());
  const $search = computed($internalSearch, (search) => search);
  const $urlSearchParams = computed($internalSearch, () => {
    const search = $internalSearch.get();
    return new URLSearchParams(search);
  });
  const $qs = computed($search, (search) => {
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
  {
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
  }
  /**
   * Create a store for a search params.
   */
  function createSearchParamsStore<
    TDefineFn extends (def: typeof defineSearchParam) => Record<string, any>,
  >(
    callback: TDefineFn,
  ): {
    $values: ReadableAtom<{
      [K in keyof ReturnType<TDefineFn>]: createQsUtils.GetValueFromSearchParamConfig<
        ReturnType<TDefineFn>[K]
      >;
    }>;
    updateAll: (
      values: {
        [K in keyof ReturnType<TDefineFn>]: createQsUtils.GetValueFromSearchParamConfig<
          ReturnType<TDefineFn>[K]
        >;
      },
      options?: createQsUtils.UpdateOptions,
    ) => void;
  } {
    type TValues = {
      [K in keyof ReturnType<TDefineFn>]: createQsUtils.GetValueFromSearchParamConfig<
        ReturnType<TDefineFn>[K]
      >;
    };
    const configRecord = callback(defineSearchParam);
    function getParsedValues(qsRecord: TQsRecord): TValues {
      const values: TValues = mapValues(configRecord, (config, key) => {
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
      }) as TValues;
      return values;
    }
    const $values = computed($qs, (qs) => getParsedValues(qs));
    const updateAll: ReturnType<typeof createSearchParamsStore>["updateAll"] = (
      values,
      updateOptions,
    ) => {
      const state = updateOptions?.state ?? {};
      const unused = updateOptions?.unused ?? "";
      const replace = updateOptions?.replace ?? false;
      const keepHash = updateOptions?.keepHash ?? false;
      const qsRecord = $qs.get();
      const failedEncodeKeys: Array<keyof typeof configRecord> = [];
      const nextEncodedValues = Object.fromEntries(
        Object.entries(configRecord).flatMap(([key, config]) => {
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
      );
      const keysToOmit = Object.keys(nextEncodedValues).filter((key) =>
        isEqual(nextEncodedValues[key], configRecord[key]?.defaultValue),
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
    return {
      $values,
      updateAll,
    };
  }
  function defineSearchParamInternal<
    TIsArray extends boolean = false,
    TDecode extends TIsArray extends true
      ? (value: createQsUtils.ToArray<TQsRecord[keyof TQsRecord]>) => any
      : (value: TQsRecord[keyof TQsRecord]) => any = TIsArray extends true
      ? (value: createQsUtils.ToArray<TQsRecord[keyof TQsRecord]>) => any
      : (value: TQsRecord[keyof TQsRecord]) => any,
    TDefaultValue = undefined,
    TConfig extends {
      isArray?: TIsArray;
      decode?: TDecode;
      encode?: (value: ReturnType<TDecode>) => TQsRecord[keyof TQsRecord];
      defaultValue?: F.Narrow<TDefaultValue>;
    } = {
      isArray?: TIsArray;
      decode?: TDecode;
      encode?: (value: ReturnType<TDecode>) => TQsRecord[keyof TQsRecord];
      defaultValue?: F.Narrow<TDefaultValue>;
    },
  >(config: TConfig) {
    return config;
  }
  function defineSearchParam<
    TIsArray extends boolean = false,
    TDecode extends TIsArray extends true
      ? (value: createQsUtils.ToArray<TQsRecord[keyof TQsRecord]>) => any
      : (value: TQsRecord[keyof TQsRecord]) => any = TIsArray extends true
      ? (value: createQsUtils.ToArray<TQsRecord[keyof TQsRecord]>) => any
      : (value: TQsRecord[keyof TQsRecord]) => any,
    TDefaultValue = undefined,
  >(
    ...args: Parameters<
      typeof defineSearchParamInternal<TIsArray, TDecode, TDefaultValue>
    >
  ) {
    return defineSearchParamInternal<TIsArray, TDecode, TDefaultValue>(...args);
  }
  function createSearchParamStore<
    TIsArray extends boolean = false,
    TDecode extends TIsArray extends true
      ? (value: createQsUtils.ToArray<TQsRecord[keyof TQsRecord]>) => any
      : (value: TQsRecord[keyof TQsRecord]) => any = TIsArray extends true
      ? (value: createQsUtils.ToArray<TQsRecord[keyof TQsRecord]>) => any
      : (value: TQsRecord[keyof TQsRecord]) => any,
    TDefaultValue = undefined,
  >(
    name: string,
    config?: {
      isArray?: TIsArray;
      decode?: TDecode;
      encode?: (value: ReturnType<TDecode>) => TQsRecord[keyof TQsRecord];
      defaultValue?: F.Narrow<TDefaultValue>;
    },
  ): {
    $value: ReadableAtom<ReturnType<TDecode> | TDefaultValue>;
    update: (
      value: ReturnType<TDecode>,
      options?: createQsUtils.UpdateOptions,
    ) => void;
  } {
    type TValue = ReturnType<TDecode> | TDefaultValue;
    const _fake_key: unique symbol = Symbol("_fake_key");
    type Name = string & {
      [_fake_key]: "_fake_key";
    };
    const typedName = name as Name;
    const searchParamsStore = createSearchParamsStore((defineSearchParam) => ({
      [typedName]: defineSearchParam({
        ...config,
      }),
    }));
    const $value: ReadableAtom<TValue> = computed(
      searchParamsStore.$values,
      (values) => values[typedName] as TValue,
    );
    const update: ReturnType<typeof createSearchParamStore>["update"] = (
      value,
      options,
    ) => {
      searchParamsStore.updateAll(
        { [name]: value } as ReturnType<typeof searchParamsStore.$values.get>,
        options,
      );
    };
    return {
      $value,
      update,
    };
  }
  return {
    $search,
    $urlSearchParams,
    $qs,
    createSearchParamsStore,
    defineSearchParam,
    createSearchParamStore,
    destroy,
  };
}

export { createQsUtils };
