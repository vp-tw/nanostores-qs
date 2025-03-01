import type { SxProps } from "@mui/joy/styles/types";
import type { ComponentProps, FC } from "react";
import { Box, Button, Card, Typography } from "@mui/joy";
import useEventCallback from "@mui/utils/useEventCallback";
import { sxUtils } from "@utils/sx";
import { useState } from "react";

import { Layout } from "./layout";

const styles = {
  box: {
    ...sxUtils.flexFill,
    alignItems: "center",
  },
  card: (theme) => ({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(2),
  }),
  title: {
    fontVariantNumeric: "tabular-nums",
  },
} satisfies Record<PropertyKey, SxProps>;

const App: FC = () => {
  const [count, setCount] = useState(0);
  const increase = useEventCallback<
    NonNullable<ComponentProps<typeof Button>["onClick"]>
  >(() => {
    setCount((c) => c + 1);
  });
  return (
    <Layout>
      <Box sx={styles.box}>
        <Card sx={styles.card}>
          <Typography level="h2" sx={styles.title}>
            {"Count: "}
            {count}
          </Typography>
          <Button onClick={increase}>Increase</Button>
        </Card>
      </Box>
    </Layout>
  );
};

export { App };
