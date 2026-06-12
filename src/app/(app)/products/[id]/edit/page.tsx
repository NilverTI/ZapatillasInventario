import { getProductById } from "@/actions/product-actions"
import { notFound } from "next/navigation"
import { ProductForm } from "@/components/products/product-form"

export const dynamic = "force-dynamic"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = await getProductById(id)
  if (!product) notFound()
  return <ProductForm product={product as any} />
}
