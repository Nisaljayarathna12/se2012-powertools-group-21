import { CatalogView } from "@/components/showcase/catalog-view"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const params = await searchParams

  // Keyed on the URL-driven filters so the view re-initialises its category and
  // search state from the new params instead of syncing props via an effect.
  return (
    <CatalogView
      key={`${params.category ?? "all"}:${params.q ?? ""}`}
      initialCategoryId={params.category ?? null}
      initialQuery={params.q ?? ""}
    />
  )
}
