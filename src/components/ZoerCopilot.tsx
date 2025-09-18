"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Theme } from "@npm_chat2db/zoer-copilot";

const ZoerCopilot = dynamic(
  async () => {
    const mod = await import("@npm_chat2db/zoer-copilot");
    return mod.ZoerCopilot;
  },
  { ssr: false }
);

const ZoerCopilotComponent = () => {
  const { theme } = useTheme();
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ZOER === 'true';
  const appId = process.env.NEXT_PUBLIC_ZOER_APP_ID;
  const host = process.env.NEXT_PUBLIC_ZOER_HOST;

  // Se não estiver habilitado ou sem configuração necessária, não renderiza o widget
  if (!enabled || !appId || !host) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[ZoerCopilot] desabilitado no ambiente atual (faltando NEXT_PUBLIC_ENABLE_ZOER=true e/ou APP_ID/HOST).');
    }
    return null;
  }

  return <ZoerCopilot theme={theme as Theme} postgrestApiKey={''} />;
};

export default ZoerCopilotComponent;
