import { HomeVendedoraSkeleton } from "@/components/ui/Skeleton";

// Carregamento da home da vendedora: skeleton que espelha o layout real
// (aparece na hora ao navegar, sem tela em branco nem salto de conteúdo).
export default function Loading() {
  return <HomeVendedoraSkeleton />;
}
