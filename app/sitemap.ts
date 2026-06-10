import type { MetadataRoute } from "next";

const base = "https://momo-rust-nu.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/plano`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/cadastro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
