import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cupom de Venda",
  description: "Cupom de venda",
};

export default function CupomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Retorna apenas os children sem nenhum wrapper
  // para evitar conflito com o AppLayout do layout raiz
  return <>{children}</>;
}

