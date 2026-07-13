/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Não bloquear o build de produção por avisos de lint (o deploy deve seguir).
    ignoreDuringBuilds: true,
  },
  experimental: {
    // pdfkit precisa rodar direto do node_modules (lê fontes .afm via __dirname);
    // sem isso o webpack o empacota e as fontes somem do caminho.
    serverComponentsExternalPackages: ["pdfkit"],
    // Garante que as fontes padrão do pdfkit (.afm) sejam empacotadas na Vercel.
    outputFileTracingIncludes: {
      "/api/export": ["./node_modules/pdfkit/js/data/*.afm"],
    },
  },
  async redirects() {
    return [
      // Rota antiga da tela de exportação → nova tela de relatórios
      { source: "/admin/exportar", destination: "/admin/relatorios", permanent: false },
    ];
  },
};

export default nextConfig;
