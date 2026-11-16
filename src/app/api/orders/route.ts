import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CheckoutPayload = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  items: { productId: string; quantity: number }[];
};

const textFields: (keyof Omit<CheckoutPayload, "items">)[] = [
  "email",
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "postalCode",
];

function isCheckoutPayload(value: unknown): value is CheckoutPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;

  if (
    textFields.some(
      (field) =>
        typeof payload[field] !== "string" ||
        !(payload[field] as string).trim() ||
        (payload[field] as string).length > (field === "address" ? 500 : 254),
    )
  ) {
    return false;
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email as string) ||
    !Array.isArray(payload.items) ||
    payload.items.length < 1 ||
    payload.items.length > 50
  ) {
    return false;
  }

  return payload.items.every(
    (item) =>
      !!item &&
      typeof item === "object" &&
      typeof item.productId === "string" &&
      item.productId.length > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      item.quantity <= 99,
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isCheckoutPayload(payload)) {
    return NextResponse.json(
      { error: "Please provide valid contact, delivery, and order details." },
      { status: 400 },
    );
  }

  const mergedItems = Array.from(
    payload.items.reduce((items, item) => {
      items.set(item.productId, (items.get(item.productId) ?? 0) + item.quantity);
      return items;
    }, new Map<string, number>()),
    ([productId, quantity]) => ({ productId, quantity }),
  );

  if (mergedItems.some((item) => item.quantity > 99)) {
    return NextResponse.json(
      { error: "A maximum of 99 units may be ordered per product." },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.$transaction(async (transaction) => {
      const products = await transaction.product.findMany({
        where: {
          id: { in: mergedItems.map((item) => item.productId) },
          active: true,
        },
      });

      if (products.length !== mergedItems.length) {
        throw new Error("One or more products are no longer available.");
      }

      const orderItems = mergedItems.map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product) throw new Error("One or more products are no longer available.");
        if (product.stock < item.quantity) {
          throw new Error(`${product.name} does not have enough stock.`);
        }

        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });

      const subtotal = orderItems.reduce(
        (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0),
      );
      const shipping = subtotal.gte(150)
        ? new Prisma.Decimal(0)
        : new Prisma.Decimal(12);

      for (const item of mergedItems) {
        const result = await transaction.product.updateMany({
          where: {
            id: item.productId,
            active: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count !== 1) {
          throw new Error("Stock changed while placing your order. Please try again.");
        }
      }

      return transaction.order.create({
        data: {
          orderNumber: `FS-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`,
          email: payload.email.trim().toLowerCase(),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          phone: payload.phone.trim(),
          address: payload.address.trim(),
          city: payload.city.trim(),
          postalCode: payload.postalCode.trim(),
          subtotal,
          shipping,
          total: subtotal.plus(shipping),
          items: { create: orderItems },
        },
        select: { orderNumber: true, total: true },
      });
    });

    return NextResponse.json(
      { orderNumber: order.orderNumber, total: Number(order.total) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && !("code" in error)) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "We couldn't place your order. Please try again." },
      { status: 500 },
    );
  }
}
