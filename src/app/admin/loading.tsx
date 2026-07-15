import { AdminSkeleton } from "@/components/ui/Skeleton";

// Carregamento do conteúdo do gestor (dentro da AdminShell). A barra lateral e
// o cabeçalho permanecem (estão no layout); só a área principal mostra o
// skeleton de cards + tabela, espelhando a forma do conteúdo.
export default function Loading() {
  return <AdminSkeleton />;
}
