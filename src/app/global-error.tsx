"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error-handler";

export default function GlobalError({ error, reset }: { error: unknown; reset: () => void; }) {
  const message = useMemo(() => getErrorMessage(error), [error]);

  useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Ocorreu um erro</h1>
          <p className="text-sm text-muted-foreground break-words">{message}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => reset()}>Tentar novamente</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>Recarregar página</Button>
          </div>
        </div>
      </body>
    </html>
  );
}
