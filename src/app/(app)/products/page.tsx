import { getProducts } from "@/actions/product-actions"
import { ProductsContent } from "@/components/products/products-content"

export const dynamic = "force-dynamic"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const search = typeof sp.search === "string" ? sp.search : undefined
  const products = await getProducts(search)
  return <ProductsContent products={products as any} search={search ?? ""} />
}
