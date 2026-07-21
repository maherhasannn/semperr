import { Meta as OnceUIMeta } from "@once-ui-system/core";
import type { Metadata } from "next";

type MetaGenerateProps = Parameters<typeof OnceUIMeta.generate>[0];

// Once UI's Meta.generate only emits a canonical URL when hreflang
// alternates are passed, so this wrapper always sets one.
function generate(props: MetaGenerateProps): Metadata {
  const metadata = OnceUIMeta.generate(props);
  const base = props.baseURL.endsWith("/") ? props.baseURL.slice(0, -1) : props.baseURL;
  const path = props.path ?? "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonical = props.canonical || `${base}${normalizedPath}`;
  return {
    ...metadata,
    alternates: { ...metadata.alternates, canonical },
  };
}

export const Meta = { generate };
