export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  category: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
};

export type CartItem = StoreProduct & { quantity: number };
