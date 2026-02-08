import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://vdustr.github.io",
  // base is NOT set here — passed via CLI for production builds:
  //   astro build --base=/nanostores-qs/
  // In dev mode, no base prefix → http://localhost:4321/
  integrations: [
    starlight({
      title: "@vp-tw/nanostores-qs",
      logo: {
        src: "./src/assets/logo.svg",
      },
      description: "A reactive querystring manager using nanostores",
      favicon: "/favicon.svg",
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelectHidden.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/VdustR/nanostores-qs",
        },
      ],
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "/nanostores-qs/og-image.png",
          },
        },
        {
          tag: "script",
          attrs: { is: "inline" },
          content:
            "document.documentElement.dataset.theme='dark';localStorage.setItem('starlight-theme','dark');",
        },
      ],
      customCss: [
        "@fontsource/ibm-plex-sans/400.css",
        "@fontsource/ibm-plex-sans/500.css",
        "@fontsource/ibm-plex-sans/600.css",
        "@fontsource/ibm-plex-sans/700.css",
        "@fontsource/jetbrains-mono/400.css",
        "@fontsource/jetbrains-mono/500.css",
        "@fontsource/jetbrains-mono/600.css",
        "./src/styles/custom.css",
      ],
      sidebar: [
        { label: "Introduction", slug: "index" },
        {
          label: "Getting Started",
          items: ["getting-started/installation", "getting-started/quick-start"],
        },
        {
          label: "Guides",
          items: [
            "guides/single-param",
            "guides/multi-param",
            "guides/update-options",
            "guides/router-integration",
          ],
        },
        {
          label: "Advanced",
          items: [
            "advanced/inline-config",
            "advanced/custom-presets",
            "advanced/validation",
            "advanced/custom-qs-lib",
          ],
        },
        {
          label: "Reference",
          items: ["reference/api", "reference/presets-table"],
        },
      ],
    }),
    react(),
  ],
});
