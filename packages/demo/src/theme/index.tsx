import type { ReactNode } from "react";
import { CssBaseline, CssVarsProvider } from "@mui/joy";

function Theme({ children }: { children: ReactNode }) {
  return (
    <CssVarsProvider
      modeStorageKey="template-aio-mui-joy-mode"
      disableNestedContext
      defaultMode="system"
    >
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}

export { Theme };
