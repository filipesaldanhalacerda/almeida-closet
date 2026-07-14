import { CarregandoTela } from "@/components/ui/Spinner";

// Estado de carregamento instantâneo da área da vendedora (Suspense do App
// Router). Aparece na hora ao navegar para qualquer tela de /app.
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <CarregandoTela />
    </div>
  );
}
