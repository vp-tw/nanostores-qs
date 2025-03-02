import type { SxProps } from "@mui/joy/styles/types";

const flexInherit = {
  display: "flex",
  gap: "inherit",
  flexDirection: "inherit",
  alignItems: "inherit",
  justifyContent: "inherit",
  position: "relative",
} satisfies SxProps;

const flexFill = {
  ...flexInherit,
  flex: 1,
  alignSelf: "stretch",
} satisfies SxProps;

const noWrap = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
} satisfies SxProps;

const sxUtils = {
  flexInherit,
  flexFill,
  noWrap,
} satisfies Record<PropertyKey, SxProps>;

export { sxUtils };
