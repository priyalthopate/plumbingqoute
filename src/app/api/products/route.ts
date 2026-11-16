import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const query = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort");

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category && category !== "All" ? { category } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { category: { contains: query } },
            ],
          }
        : {}),
    },
    orderBy:
      sort === "price-low"
        ? { price: "asc" }
        : sort === "price-high"
          ? { price: "desc" }
          : sort === "top-rated"
            ? { rating: "desc" }
            : [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    products.map((product) => ({
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : null,
    })),
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
