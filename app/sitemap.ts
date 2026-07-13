import type { MetadataRoute } from "next"

const baseUrl = "https://arsenaldocorredor.com.br"

const routes = [
  {
    path: "/",
    priority: 1,
  },
  {
    path: "/calculadoras/tempo-por-distancia-e-pace",
    priority: 0.8,
  },
  {
    path: "/calculadoras/pace-por-distancia-e-tempo",
    priority: 0.8,
  },
  {
    path: "/calculadoras/distancia-por-pace-e-tempo",
    priority: 0.8,
  },
  {
    path: "/politica-de-privacidade",
    priority: 0.4,
  },
  {
    path: "/termos-de-uso",
    priority: 0.4,
  },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route.priority,
  }))
}
