import { CarregandoTela } from "@/components/ui/Spinner";

// Estado de carregamento instantâneo do conteúdo do gestor. A barra lateral e
// o cabeçalho permanecem (estão no layout); só a área principal mostra o spinner.
export default function Loading() {
  return <CarregandoTela />;
}
