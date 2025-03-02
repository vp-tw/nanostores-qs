import type { FC } from "react";
import {
  Autocomplete,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
} from "@mui/joy";
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import objectInspect from "object-inspect";

import { parse, stringify } from "qs";
import { z } from "zod";
import { Layout } from "./layout";

const urlSearchParamsUtils = createQsUtils();

const TabSchema = z.enum(["qs", "urlSearchParams"]);

const MultipleOptionsSchema = z.enum(["foo", "bar", "baz", "qux"]);

const tabStore = urlSearchParamsUtils.createSearchParamStore("tab", {
  decode: TabSchema.parse,
  defaultValue: TabSchema.options[0],
});

const replaceStore = urlSearchParamsUtils.createSearchParamStore("replace", {
  decode: (v) => v !== "false",
  encode: (v) => (v ? undefined : "false"),
  defaultValue: true,
});

const keepHashStore = urlSearchParamsUtils.createSearchParamStore("keepHash", {
  decode: (v) => v === "true",
  encode: (v) => (v ? "true" : undefined),
  defaultValue: false,
});

const qsUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});

const qsSearchParamsStore = qsUtils.createSearchParamsStore(
  (defineSearchParam) => ({
    qsStr: defineSearchParam({}),
    qsNum: defineSearchParam({
      decode: Number,
      encode: String,
    }),
    qsEnumArray: defineSearchParam({
      isArray: true,
      decode: z
        .array(MultipleOptionsSchema.or(z.undefined().catch(undefined)))
        .transform((arr) => arr.flatMap((v) => (v === undefined ? [] : [v])))
        .parse,
    }),
    qsDate: defineSearchParam({
      decode: z.string().transform(datetimeLocalToDate).parse,
      encode: z.date().transform(dateToDatetimeLocal).parse,
    }),
  }),
);

const urlSearchParamsStore = urlSearchParamsUtils.createSearchParamsStore(
  (defineSearchParam) => ({
    urlStr: defineSearchParam({}),
    urlNum: defineSearchParam({
      decode: Number,
      encode: String,
    }),
    urlEnumArray: defineSearchParam({
      isArray: true,
      decode: z
        .array(MultipleOptionsSchema.or(z.undefined().catch(undefined)))
        .transform((arr) => arr.flatMap((v) => (v === undefined ? [] : [v])))
        .parse,
    }),
    urlDate: defineSearchParam({
      decode: z.string().transform(datetimeLocalToDate).parse,
      encode: z.date().transform(dateToDatetimeLocal).parse,
    }),
  }),
);

function dateToDatetimeLocal(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
}

function datetimeLocalToDate(datetimeLocal: string) {
  const [date, time] = datetimeLocal.split("T");
  const [hours, minutes] = time?.split(":") || [];
  const dateObj = new Date(date || "");
  dateObj.setHours(Number(hours), Number(minutes), 0, 0);
  return dateObj;
}

const Qs: React.FC = () => {
  const replace = useStore(replaceStore.$value);
  const keepHash = useStore(keepHashStore.$value);
  const qs = useStore(qsUtils.$qs);
  const searchParams = useStore(qsSearchParamsStore.$values);
  return (
    <Stack direction="row" spacing={2}>
      <Stack direction="column" spacing={2} flex={1}>
        <FormControl size="sm" color="primary">
          <FormLabel>qs</FormLabel>
          <Textarea
            maxRows={10}
            value={objectInspect(qs, { indent: 2 })}
            readOnly
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>searchParams</FormLabel>
          <Textarea
            maxRows={10}
            value={objectInspect(searchParams, { indent: 2 })}
            readOnly
          />
        </FormControl>
      </Stack>
      <Stack direction="column" spacing={2} flex={1}>
        <FormControl size="sm" color="primary">
          <FormLabel>str</FormLabel>
          <Input
            fullWidth
            type="text"
            value={searchParams.qsStr ?? ""}
            onChange={(event) => {
              qsSearchParamsStore.updateAll(
                {
                  ...qsSearchParamsStore.$values.get(),
                  qsStr: event.target.value,
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  qsSearchParamsStore.updateAll(
                    {
                      ...qsSearchParamsStore.$values.get(),
                      qsStr: undefined,
                    },
                    {
                      replace,
                      keepHash,
                    },
                  );
                }}
              >
                ❌
              </IconButton>
            }
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>num</FormLabel>
          <Input
            fullWidth
            type="number"
            value={!searchParams.qsNum ? "" : searchParams.qsNum}
            onChange={(event) => {
              qsSearchParamsStore.updateAll(
                {
                  ...qsSearchParamsStore.$values.get(),
                  qsNum: !event.target.value
                    ? undefined
                    : Number(event.target.value),
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  qsSearchParamsStore.updateAll(
                    {
                      ...qsSearchParamsStore.$values.get(),
                      qsNum: undefined,
                    },
                    {
                      replace,
                      keepHash,
                    },
                  );
                }}
              >
                ❌
              </IconButton>
            }
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>enumArr</FormLabel>
          <Autocomplete
            options={MultipleOptionsSchema.options}
            value={searchParams.qsEnumArray ?? []}
            onChange={(_event, value) => {
              qsSearchParamsStore.updateAll(
                {
                  ...qsSearchParamsStore.$values.get(),
                  qsEnumArray: value.flatMap((v) =>
                    v === undefined ? [] : [v],
                  ),
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            multiple
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>date</FormLabel>
          <Input
            fullWidth
            type="datetime-local"
            value={
              !searchParams.qsDate
                ? ""
                : dateToDatetimeLocal(searchParams.qsDate)
            }
            onChange={(event) => {
              qsSearchParamsStore.updateAll(
                {
                  ...qsSearchParamsStore.$values.get(),
                  qsDate: new Date(event.target.value),
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  qsSearchParamsStore.updateAll(
                    {
                      ...qsSearchParamsStore.$values.get(),
                      qsDate: undefined,
                    },
                    {
                      replace,
                      keepHash,
                    },
                  );
                }}
              >
                ❌
              </IconButton>
            }
          />
        </FormControl>
      </Stack>
    </Stack>
  );
};

const UrlSearchParams: React.FC = () => {
  const replace = useStore(replaceStore.$value);
  const keepHash = useStore(keepHashStore.$value);
  const urlSearchParams = useStore(urlSearchParamsUtils.$qs);
  const searchParams = useStore(urlSearchParamsStore.$values);
  return (
    <Stack direction="row" spacing={2}>
      <Stack direction="column" spacing={2} flex={1}>
        <FormControl size="sm" color="primary">
          <FormLabel>qs</FormLabel>
          <Textarea
            maxRows={10}
            value={objectInspect(urlSearchParams, { indent: 2 })}
            readOnly
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>searchParams</FormLabel>
          <Textarea
            maxRows={10}
            value={objectInspect(searchParams, { indent: 2 })}
            readOnly
          />
        </FormControl>
      </Stack>
      <Stack direction="column" spacing={2} flex={1}>
        <FormControl size="sm" color="primary">
          <FormLabel>str</FormLabel>
          <Input
            fullWidth
            type="text"
            value={searchParams.urlStr ?? ""}
            onChange={(event) => {
              urlSearchParamsStore.updateAll(
                {
                  ...urlSearchParamsStore.$values.get(),
                  urlStr: event.target.value,
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  urlSearchParamsStore.updateAll(
                    {
                      ...urlSearchParamsStore.$values.get(),
                      urlStr: undefined,
                    },
                    {
                      replace,
                      keepHash,
                    },
                  );
                }}
              >
                ❌
              </IconButton>
            }
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>num</FormLabel>
          <Input
            fullWidth
            type="number"
            value={!searchParams.urlNum ? "" : searchParams.urlNum}
            onChange={(event) => {
              urlSearchParamsStore.updateAll(
                {
                  ...urlSearchParamsStore.$values.get(),
                  urlNum: !event.target.value
                    ? undefined
                    : Number(event.target.value),
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  urlSearchParamsStore.updateAll(
                    {
                      ...urlSearchParamsStore.$values.get(),
                      urlNum: undefined,
                    },
                    {
                      replace,
                      keepHash,
                    },
                  );
                }}
              >
                ❌
              </IconButton>
            }
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>enumArr</FormLabel>
          <Autocomplete
            options={MultipleOptionsSchema.options}
            value={searchParams.urlEnumArray ?? []}
            onChange={(_event, value) => {
              urlSearchParamsStore.updateAll(
                {
                  ...urlSearchParamsStore.$values.get(),
                  urlEnumArray: value.flatMap((v) =>
                    v === undefined ? [] : [v],
                  ),
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            multiple
          />
        </FormControl>
        <FormControl size="sm" color="primary">
          <FormLabel>date</FormLabel>
          <Input
            fullWidth
            type="datetime-local"
            value={
              !searchParams.urlDate
                ? ""
                : dateToDatetimeLocal(searchParams.urlDate)
            }
            onChange={(event) => {
              urlSearchParamsStore.updateAll(
                {
                  ...urlSearchParamsStore.$values.get(),
                  urlDate: new Date(event.target.value),
                },
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  urlSearchParamsStore.updateAll(
                    {
                      ...urlSearchParamsStore.$values.get(),
                      urlDate: undefined,
                    },
                    {
                      replace,
                      keepHash,
                    },
                  );
                }}
              >
                ❌
              </IconButton>
            }
          />
        </FormControl>
      </Stack>
    </Stack>
  );
};

const Controls = () => {
  const replace = useStore(replaceStore.$value);
  const keepHash = useStore(keepHashStore.$value);
  return (
    <Stack direction="column" spacing={2} flexWrap="wrap" alignSelf="stretch">
      <Checkbox
        checked={replace}
        onChange={(e) =>
          replaceStore.update(e.target.checked, {
            replace,
            keepHash,
          })
        }
        label="replace"
      />
      <Checkbox
        checked={keepHash}
        onChange={(e) =>
          keepHashStore.update(e.target.checked, {
            replace,
            keepHash,
          })
        }
        label="keepHash"
      />
      <Button
        onClick={() => {
          const nextUrl = new URL(window.location.href);
          nextUrl.hash = Math.random().toString(36).slice(2);
          history[replace ? "replaceState" : "pushState"](
            {},
            "",
            nextUrl.toString(),
          );
        }}
      >
        Random Hash
      </Button>
    </Stack>
  );
};

const CommonState: React.FC = () => {
  const search = useStore(qsUtils.$search);
  const urlSearchParams = useStore(urlSearchParamsUtils.$qs);
  return (
    <Stack direction="column" spacing={2} alignSelf="stretch" flex={1}>
      <FormControl size="sm" color="primary">
        <FormLabel>search</FormLabel>
        <Textarea value={search} readOnly />
      </FormControl>
      <FormControl size="sm" color="primary">
        <FormLabel>urlSearchParams</FormLabel>
        <Textarea
          value={objectInspect(urlSearchParams, { indent: 2 })}
          readOnly
        />
      </FormControl>
    </Stack>
  );
};

const App: FC = () => {
  const replace = useStore(replaceStore.$value);
  const keepHash = useStore(keepHashStore.$value);
  const tab = useStore(tabStore.$value);
  return (
    <Layout>
      <Stack direction="column" spacing={2} alignSelf="stretch" flex={1}>
        <Stack direction="row" spacing={2} flexWrap="wrap" alignSelf="stretch">
          <Controls />
          <CommonState />
        </Stack>
        <Tabs
          value={tab}
          onChange={(_e, value) =>
            tabStore.update(TabSchema.parse(value), {
              replace,
              keepHash,
            })
          }
        >
          <TabList>
            {TabSchema.options.map((value) => (
              <Tab key={value} value={value}>
                {value}
              </Tab>
            ))}
          </TabList>
          {TabSchema.options.map((value) => (
            <TabPanel key={value} value={value}>
              {(() => {
                switch (value) {
                  case "qs":
                    return <Qs />;
                  case "urlSearchParams":
                    return <UrlSearchParams />;
                  default:
                    value satisfies never;
                    throw new Error(
                      `Unexpected value: ${objectInspect(value)}`,
                    );
                }
              })()}
            </TabPanel>
          ))}
        </Tabs>
      </Stack>
    </Layout>
  );
};

export { App };
