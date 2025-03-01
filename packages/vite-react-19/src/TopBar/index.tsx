import type { SxProps } from "@mui/joy/styles/types";
import { Box, Typography } from "@mui/joy";
import { sxUtils } from "@utils/sx";

import { ModeToggle } from "./ModeSwitch";

const styles = {
  root: (theme) => ({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "64px",
    gap: theme.spacing(2),
    px: 2,
    bgcolor: theme.palette.background.level1,
  }),
  title: {
    flex: 1,
    ...sxUtils.noWrap,
  },
} satisfies Record<string, SxProps>;

function TopBar() {
  return (
    <Box sx={styles.root}>
      <Typography level="h1" sx={styles.title}>
        Hello, world!
      </Typography>
      <ModeToggle />
    </Box>
  );
}

export { TopBar };
