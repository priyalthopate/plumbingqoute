import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    slug: "arc-pull-down-kitchen-faucet",
    name: "Arc Pull-Down Kitchen Faucet",
    description:
      "A beautifully balanced brushed brass kitchen faucet with a flexible pull-down spray and ceramic disc cartridge.",
    price: 189,
    compareAtPrice: 249,
    sku: "FS-KIT-001",
    stock: 18,
    category: "Faucets",
    imageUrl:
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=960&q=85",
    rating: 4.9,
    reviewCount: 128,
    featured: true,
  },
  {
    slug: "atelier-countertop-basin",
    name: "Atelier Countertop Basin",
    description:
      "A sculptural, gloss white ceramic vessel basin. Easy-clean glazed finish with a softly curved silhouette.",
    price: 245,
    compareAtPrice: null,
    sku: "FS-BAS-002",
    stock: 12,
    category: "Basins",
    imageUrl:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=960&q=85",
    rating: 4.8,
    reviewCount: 94,
    featured: true,
  },
  {
    slug: "rainfall-thermostatic-shower-set",
    name: "Rainfall Thermostatic Shower Set",
    description:
      "Turn everyday showers into a ritual with an overhead rainfall head and dependable thermostatic temperature control.",
    price: 329,
    compareAtPrice: 389,
    sku: "FS-SHW-003",
    stock: 9,
    category: "Showers",
    imageUrl:
      "https://images.unsplash.com/photo-1620626011761-994e6bd77c6?auto=format&fit=crop&w=960&q=85",
    rating: 4.9,
    reviewCount: 76,
    featured: true,
  },
  {
    slug: "comfort-close-wall-hung-toilet",
    name: "Comfort-Close Wall-Hung Toilet",
    description:
      "A compact, rimless wall-hung toilet with a soft-close seat, hygienic glaze, and contemporary lines.",
    price: 379,
    compareAtPrice: null,
    sku: "FS-WC-004",
    stock: 7,
    category: "Toilets",
    imageUrl:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=960&q=85",
    rating: 4.7,
    reviewCount: 52,
    featured: false,
  },
  {
    slug: "sculpted-brass-basin-mixer",
    name: "Sculpted Brass Basin Mixer",
    description:
      "A refined single-lever basin mixer in brushed champagne brass, made for everyday use and easy installation.",
    price: 149,
    compareAtPrice: 179,
    sku: "FS-FCT-005",
    stock: 24,
    category: "Faucets",
    imageUrl:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=960&q=85",
    rating: 4.8,
    reviewCount: 110,
    featured: true,
  },
  {
    slug: "linear-shower-drain",
    name: "Linear Stainless Shower Drain",
    description:
      "A sleek 24-inch stainless steel linear shower drain with reversible tile insert and a practical hair trap.",
    price: 86,
    compareAtPrice: null,
    sku: "FS-DRA-006",
    stock: 35,
    category: "Drains",
    imageUrl:
      "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=960&q=85",
    rating: 4.6,
    reviewCount: 43,
    featured: false,
  },
  {
    slug: "pressure-balance-valve-kit",
    name: "Pressure-Balance Valve Kit",
    description:
      "A dependable solid-brass rough-in valve that keeps shower temperature comfortable and consistent.",
    price: 112,
    compareAtPrice: null,
    sku: "FS-VAL-007",
    stock: 31,
    category: "Valves",
    imageUrl:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=960&q=85",
    rating: 4.7,
    reviewCount: 39,
    featured: false,
  },
  {
    slug: "floating-oak-vanity",
    name: "Ridge Floating Oak Vanity",
    description:
      "Warm natural oak, two generous soft-close drawers, and a moisture-resistant finish for smaller bathrooms.",
    price: 649,
    compareAtPrice: 729,
    sku: "FS-VAN-008",
    stock: 5,
    category: "Vanities",
    imageUrl:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=960&q=85",
    rating: 4.9,
    reviewCount: 64,
    featured: true,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  console.log(`Seeded ${products.length} plumbing and sanitary products.`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the product catalog:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
