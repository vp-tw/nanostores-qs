import { Typography, useColorScheme } from "@mui/joy";
import Switch from "@mui/joy/Switch";
import useEventCallback from "@mui/utils/useEventCallback";
import { useEffect, useState } from "react";

function ModeToggle() {
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);
  const checked = mode === "dark";
  const onChange = useEventCallback(() => {
    setMode(mode === "light" ? "dark" : "light");
  });

  useEffect(function bindMounted() {
    setMounted(true);
    return function cleanup() {
      setMounted(false);
    };
  }, []);
  if (!mounted) return null;

  return (
    <Switch
      checked={checked}
      onChange={onChange}
      slotProps={{
        track: {
          children: (
            <>
              <Typography component="span" level="inherit" sx={{ ml: "8px" }}>
                ☀️
              </Typography>
              <Typography component="span" level="inherit" sx={{ mr: "8px" }}>
                🌙
              </Typography>
            </>
          ),
        },
      }}
      sx={{
        "--Switch-thumbSize": "27px",
        "--Switch-trackWidth": "64px",
        "--Switch-trackHeight": "31px",
      }}
    />
  );
}

export { ModeToggle };
