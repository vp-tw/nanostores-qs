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
  Typography,
} from "@mui/joy";
import { useStore } from "@nanostores/react";
import { createQsUtils } from "@vp-tw/nanostores-qs";
import objectInspect from "object-inspect";

import { parse, stringify } from "qs";
import { z } from "zod";
import { Layout } from "./layout";

const IntegerParamSchema = z.pipeline(
  z.string().refine((v) => v.match(/^\d+$/), { message: "Not a integer" }),
  z.coerce.number().int(),
);

const urlSearchParamsUtils = createQsUtils();

const TabSchema = z.enum(["qs", "urlSearchParams"]);

const MultipleOptionsSchema = z.enum(["foo", "bar", "baz", "qux"]);

const tabStore = urlSearchParamsUtils.createSearchParamStore("tab", {
  decode: TabSchema.parse,
  defaultValue: TabSchema.options[0],
});

const replaceStore = urlSearchParamsUtils.createSearchParamStore(
  "replace",
  (def) =>
    def({
      decode: (v) => v !== "false",
      defaultValue: true,
    }).setEncode((v) => (v ? undefined : "false")),
);

const keepHashStore = urlSearchParamsUtils.createSearchParamStore(
  "keepHash",
  (def) =>
    def({
      decode: (v) => v === "true",
      defaultValue: false,
    }).setEncode((v) => (v ? "true" : undefined)),
);

const qsUtils = createQsUtils({
  qs: {
    parse: (search) => parse(search, { ignoreQueryPrefix: true }),
    stringify: (values) => stringify(values),
  },
});

const qsSearchParamsStore = qsUtils.createSearchParamsStore((def) => ({
  qsSearch: undefined,
  qsPage: def({
    decode: IntegerParamSchema.parse,
    encode: String,
  }),
  qsEnumArray: def({
    isArray: true,
    decode: z
      .array(MultipleOptionsSchema.or(z.undefined().catch(undefined)))
      .transform((arr) => arr.flatMap((v) => (v === undefined ? [] : [v])))
      .parse,
  }),
  qsDate: def({
    decode: z.string().transform(datetimeLocalToDate).parse,
    encode: z.date().transform(dateToDatetimeLocal).parse,
  }),
}));

const urlSearchParamsStore = urlSearchParamsUtils.createSearchParamsStore(
  (def) => ({
    urlSearch: undefined,
    urlPage: def({
      decode: IntegerParamSchema.parse,
      encode: String,
    }),
    urlEnumArray: def({
      isArray: true,
      decode: z
        .array(MultipleOptionsSchema.or(z.undefined().catch(undefined)))
        .transform((arr) => arr.flatMap((v) => (v === undefined ? [] : [v])))
        .parse,
    }),
    urlDate: def({
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
          <FormLabel>search str</FormLabel>
          <Input
            fullWidth
            type="text"
            value={searchParams.qsSearch ?? ""}
            onChange={(event) => {
              qsSearchParamsStore.updateAll(
                {
                  ...qsSearchParamsStore.$values.get(),
                  qsSearch: event.currentTarget.value,
                  qsPage: undefined,
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
                      qsSearch: undefined,
                      qsPage: undefined,
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
          <FormLabel>page</FormLabel>
          <Input
            fullWidth
            type="number"
            value={searchParams.qsPage === undefined ? "" : searchParams.qsPage}
            onChange={(event) => {
              if (event.currentTarget.value === "") return;
              qsSearchParamsStore.update(
                "qsPage",
                !event.currentTarget.value
                  ? undefined
                  : Number(event.currentTarget.value),
                {
                  replace,
                  keepHash,
                },
              );
            }}
            endDecorator={
              <IconButton
                onClick={() => {
                  qsSearchParamsStore.update("qsPage", undefined, {
                    replace,
                    keepHash,
                  });
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
                  qsDate: new Date(event.currentTarget.value),
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
          <FormLabel>search str</FormLabel>
          <Input
            fullWidth
            type="text"
            value={searchParams.urlSearch ?? ""}
            onChange={(event) => {
              urlSearchParamsStore.updateAll(
                {
                  ...urlSearchParamsStore.$values.get(),
                  urlSearch: event.currentTarget.value,
                  urlPage: undefined,
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
                      urlSearch: undefined,
                      urlPage: undefined,
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
          <FormLabel>page</FormLabel>
          <Input
            fullWidth
            type="number"
            value={
              searchParams.urlPage === undefined ? "" : searchParams.urlPage
            }
            onChange={(event) => {
              urlSearchParamsStore.update(
                "urlPage",
                !event.currentTarget.value
                  ? undefined
                  : Number(event.currentTarget.value),
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
                      urlPage: undefined,
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
                  urlDate: new Date(event.currentTarget.value),
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
        <Typography>
          <code>
            <a
              target="_blank"
              href="https://github.com/vdustr/nanostores-qs"
              rel="noopener noreferrer"
            >
              @vp-tw/nanostores-qs
            </a>
          </code>
          , A reactive querystring manager using nanostores
        </Typography>
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
