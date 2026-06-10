import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://momo-rust-nu.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cadastro", "/plano", "/login"],
        disallow: [
          "/admin/",
          "/api/",
          "/fornecedor/",
          "/configuracoes/",
          "/doses/",
          "/dieta/",
          "/saude/",
          "/estoque/",
          "/assistente/",
          "/meus-pedidos/",
          "/esqueceu-senha/",
          "/redefinir-senha/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
