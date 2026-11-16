"use client";

import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Heart,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { CartItem, StoreProduct } from "@/lib/types";

const categories = [
  "All",
  "Faucets",
  "Basins",
  "Showers",
  "Toilets",
  "Vanities",
  "Drains",
  "Valves",
];

type CheckoutDetails = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

const emptyDetails: CheckoutDetails = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export default function Home() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(
    null,
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogReload, setCatalogReload] = useState(0);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [newsletterError, setNewsletterError] = useState(false);

  useEffect(() => {
    let restoredCart: CartItem[] = [];

    try {
      const saved = window.localStorage.getItem("flowstate-cart");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          restoredCart = parsed.filter(
            (item): item is CartItem =>
              item &&
              typeof item.id === "string" &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0,
          );
        }
      }
    } catch (error) {
      console.error("Could not restore the saved cart:", error);
    }

    const hydrationTimer = window.setTimeout(() => {
      setCart(restoredCart);
      setCartReady(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (cartReady) {
      window.localStorage.setItem("flowstate-cart", JSON.stringify(cart));
    }
  }, [cart, cartReady]);

  useEffect(() => {
    const controller = new AbortController();
    const searchParams = new URLSearchParams();
    if (category !== "All") searchParams.set("category", category);
    if (search.trim()) searchParams.set("q", search.trim());
    if (sort !== "featured") searchParams.set("sort", sort);

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setCatalogError("");
      try {
        const response = await fetch(`/api/products?${searchParams}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("The product catalog is unavailable.");
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("The product catalog returned invalid data.");
        setProducts(data as StoreProduct[]);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Could not load products:", error);
        setCatalogError(
          "We couldn’t load products right now. Please check your database connection and try again.",
        );
        setProducts([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search.trim() ? 200 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [category, search, sort, catalogReload]);

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );
  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );
  const featuredProducts = products.filter((product) => product.featured);
  const freeShippingRemaining = Math.max(0, 150 - subtotal);

  function addToCart(product: StoreProduct, quantity = 1) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity + quantity > product.stock) return current;
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      if (quantity > product.stock) return current;
      return [...current, { ...product, quantity }];
    });
    setSelectedProduct(null);
    setCartOpen(true);
  }

  function updateQuantity(productId: string, change: number) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) return item;
          return {
            ...item,
            quantity: Math.min(item.stock, item.quantity + change),
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setCheckoutError(result.error || "We couldn’t place your order.");
        return;
      }
      setOrderNumber(result.orderNumber);
      setCart([]);
      setCartOpen(false);
    } catch (error) {
      console.error("Checkout request failed:", error);
      setCheckoutError("We couldn’t place your order. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNewsletterLoading(true);
    setNewsletterMessage("");
    setNewsletterError(false);

    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setNewsletterMessage(result.error || "We couldn’t save your subscription.");
        setNewsletterError(true);
        return;
      }
      setNewsletterMessage(result.message);
      form.reset();
    } catch (error) {
      console.error("Newsletter subscription request failed:", error);
      setNewsletterMessage("We couldn’t save your subscription. Please try again.");
      setNewsletterError(true);
    } finally {
      setNewsletterLoading(false);
    }
  }

  function closeCheckout() {
    setCheckoutOpen(false);
    setCheckoutError("");
    setOrderNumber("");
    setDetails(emptyDetails);
  }

  return (
    <main>
      <div className="announcement">
        <span>Good things flow better.</span>
        <span className="announcement-dot">·</span>
        <span>Complimentary delivery on orders over $150</span>
        <ArrowRight size={13} strokeWidth={1.8} />
      </div>

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#" aria-label="Flowstate Supply home">
            <span className="brand-icon"><Droplets size={23} strokeWidth={1.7} /></span>
            <span className="brand-name">flowstate<span>.</span></span>
          </a>

          <nav className={`main-nav ${mobileMenuOpen ? "nav-open" : ""}`}>
            <a href="#shop" onClick={() => setMobileMenuOpen(false)}>Shop all</a>
            <a href="#shop" onClick={() => { setCategory("Faucets"); setMobileMenuOpen(false); }}>Faucets</a>
            <a href="#shop" onClick={() => { setCategory("Showers"); setMobileMenuOpen(false); }}>Showers</a>
            <a href="#story" onClick={() => setMobileMenuOpen(false)}>Our approach</a>
          </nav>

          <div className="header-actions">
            <label className="header-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Find your flow..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
                aria-label="Search products"
              />
              <kbd>/</kbd>
            </label>
            <button
              className="icon-button bag-button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open shopping bag, ${cartCount} items`}
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
              {cartCount > 0 && <span className="bag-count">{cartCount}</span>}
            </button>
            <button
              className="icon-button menu-button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE MORE FLOW</div>
          <h1>Better everyday<br />starts <em>here.</em></h1>
          <p>Thoughtful plumbing and bathroom essentials for the spaces you call your own.</p>
          <a href="#shop" className="button button-dark hero-cta">
            Find your flow <ArrowRight size={16} />
          </a>
          <div className="hero-trust">
            <div className="avatar-stack" aria-hidden="true">
              <span>J</span><span>M</span><span>A</span><span>+</span>
            </div>
            <span>Good design, <strong>good to go.</strong></span>
            <span className="trust-divider" />
            <span className="stars-small">★★★★★</span>
            <span>4.9/5</span>
          </div>
          <span className="hero-vertical-note">MADE FOR THE DAILY RITUALS</span>
        </div>
        <div className="hero-image-wrap">
          <div className="hero-image" role="img" aria-label="Warm, sunlit modern bathroom with an elegant stone vanity" />
          <div className="hero-image-wash" />
          <div className="hero-badge">
            <Sparkles size={16} strokeWidth={1.5} />
            <span>Make room<br /><strong>for better.</strong></span>
          </div>
          <div className="hero-image-caption"><span>01 — 03</span> THE SUNDAY MORNING COLLECTION</div>
        </div>
        <a className="hero-scroll" href="#shop" aria-label="Scroll to shop">
          <ArrowDown size={16} /> SCROLL A LITTLE
        </a>
      </section>

      <section className="promise-strip" aria-label="Our promises">
        <div><Truck size={20} /><span><strong>Easy does it</strong><small>Free delivery over $150</small></span></div>
        <span className="promise-separator" />
        <div><ShieldCheck size={20} /><span><strong>Made to last</strong><small>Quality you can count on</small></span></div>
        <span className="promise-separator" />
        <div><PackageCheck size={20} /><span><strong>Here to help</strong><small>Real people, real support</small></span></div>
      </section>

      <section className="shop-section" id="shop">
        <div className="shop-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THE GOOD STUFF</div>
            <h2>Find your <em>favorite.</em></h2>
            <p>Considered essentials. Very good prices. Just add water.</p>
          </div>
          <a href="#story" className="text-link">A better way to shop <ArrowUpRight size={15} /></a>
        </div>

        <div className="shop-toolbar">
          <div className="category-list" role="group" aria-label="Filter by category">
            {categories.map((item) => (
              <button
                key={item}
                className={`category-pill ${category === item ? "active" : ""}`}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="sort-select">
            <ArrowDownUp size={14} />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort products"
            >
              <option value="featured">Featured</option>
              <option value="top-rated">Top rated</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>

        {catalogError ? (
          <div className="catalog-message error-message" role="alert">
            <Droplets size={22} />
            <p>{catalogError}</p>
            <button className="button button-outline" onClick={() => setCatalogReload((count) => count + 1)}>Try again</button>
          </div>
        ) : loading ? (
          <div className="product-grid" aria-label="Loading products" aria-busy="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div className="product-skeleton" key={index}>
                <div className="skeleton-image" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-short" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="catalog-message">
            <Search size={23} />
            <h3>No products found</h3>
            <p>Try a different search or category. Your next favorite is out there.</p>
            <button
              className="button button-outline"
              onClick={() => { setSearch(""); setCategory("All"); }}
            >
              See all products
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  className="product-image-button"
                  onClick={() => setSelectedProduct(product)}
                  aria-label={`View ${product.name}`}
                >
                  <div
                    className="product-image"
                    style={{ backgroundImage: `url("${product.imageUrl}")` }}
                    role="img"
                    aria-label={product.name}
                  />
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="product-badge">A little less</span>
                  )}
                  {product.stock <= 5 && (
                    <span className="stock-badge">Nearly gone</span>
                  )}
                </button>
                <button
                  className={`favorite-button ${favorites.includes(product.id) ? "favorited" : ""}`}
                  onClick={() =>
                    setFavorites((current) =>
                      current.includes(product.id)
                        ? current.filter((id) => id !== product.id)
                        : [...current, product.id],
                    )
                  }
                  aria-label={`${favorites.includes(product.id) ? "Remove" : "Add"} ${product.name} ${favorites.includes(product.id) ? "from" : "to"} favorites`}
                  aria-pressed={favorites.includes(product.id)}
                >
                  <Heart size={16} fill={favorites.includes(product.id) ? "currentColor" : "none"} />
                </button>
                <button className="product-info" onClick={() => setSelectedProduct(product)}>
                  <span className="product-category">{product.category}</span>
                  <span className="product-name">{product.name}</span>
                  <span className="product-rating"><span>★★★★★</span> {product.rating.toFixed(1)} <span className="rating-count">({product.reviewCount})</span></span>
                </button>
                <div className="product-card-bottom">
                  <div>
                    <span className="product-price">{formatPrice(product.price)}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="old-price">{formatPrice(product.compareAtPrice)}</span>
                    )}
                  </div>
                  <button
                    className="add-button"
                    aria-label={`Add ${product.name} to bag`}
                    onClick={() => addToCart(product)}
                    disabled={product.stock < 1}
                  >
                    {product.stock < 1 ? <span>Sold out</span> : <Plus size={18} />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {featuredProducts.length > 0 && category === "All" && !search && (
          <p className="product-count">Showing our considered collection <span>·</span> {products.length} everyday essentials</p>
        )}
      </section>

      <section className="story-section" id="story">
        <div className="story-image-wrap">
          <div
            className="story-image"
            role="img"
            aria-label="Beautifully finished bathroom with natural stone and brass details"
          />
          <span className="story-image-label">GOOD DESIGN, GOOD TO GO.</span>
        </div>
        <div className="story-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> A BETTER KIND OF EVERYDAY</div>
          <h2>Not just a tap.<br />A little <em>everyday</em><br /><em>better.</em></h2>
          <p>We believe the things you use every day deserve a little more thought. So we find beautifully made, well-priced essentials that work hard and feel right at home.</p>
          <a href="#shop" className="button button-dark">A little more about us <ArrowRight size={16} /></a>
          <div className="story-note"><CheckCircle2 size={17} /> Thoughtfully chosen. Happily priced. Always helpful.</div>
        </div>
      </section>

      <section className="newsletter">
        <div className="newsletter-mark"><Droplets size={22} /></div>
        <div>
          <div className="eyebrow">A GOOD THING IN YOUR INBOX</div>
          <h2>Let the good stuff <em>flow.</em></h2>
          <p>Little design notes, genuinely good deals, and zero bathroom puns. (Mostly.)</p>
        </div>
        <form className="newsletter-form" onSubmit={submitNewsletter}>
          <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
          <input id="newsletter-email" name="email" type="email" placeholder="Your email address" required maxLength={254} />
          <button type="submit" className="button button-dark" disabled={newsletterLoading}>
            {newsletterLoading ? "One moment…" : "Count me in"} {!newsletterLoading && <ArrowRight size={15} />}
          </button>
          <span role={newsletterError ? "alert" : "status"} className={newsletterError ? "newsletter-status newsletter-error" : "newsletter-status"}>
            {newsletterMessage || "By subscribing, you agree to receive the occasional good thing."}
          </span>
        </form>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#" aria-label="Flowstate Supply home">
          <span className="brand-icon"><Droplets size={21} strokeWidth={1.7} /></span>
          <span className="brand-name">flowstate<span>.</span></span>
        </a>
        <span className="footer-tagline">Thoughtful fixtures. Better spaces.</span>
        <div className="footer-links">
          <a href="#shop">Shop</a><a href="#story">Our approach</a><a href="mailto:hello@flowstatesupply.com">Get in touch</a>
        </div>
        <span className="footer-copyright">© 2025 Flowstate Supply</span>
      </footer>

      {cartOpen && (
        <div className="overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCartOpen(false);
        }}>
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow"><span className="eyebrow-line" /> GOOD CHOICES</span>
                <h2 id="cart-title">Your bag <span>({cartCount})</span></h2>
              </div>
              <button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close shopping bag"><X size={21} /></button>
            </div>
            {freeShippingRemaining > 0 && cart.length > 0 && (
              <div className="shipping-progress">
                <span>Add <strong>{formatPrice(freeShippingRemaining)}</strong> for complimentary delivery</span>
                <div className="progress-track"><span style={{ width: `${Math.min(100, (subtotal / 150) * 100)}%` }} /></div>
              </div>
            )}
            {cart.length === 0 ? (
              <div className="empty-cart">
                <span className="empty-cart-icon"><ShoppingBag size={29} /></span>
                <h3>A little room for the good stuff.</h3>
                <p>Your bag is taking a breather. Find something lovely to put in it.</p>
                <button className="button button-dark" onClick={() => setCartOpen(false)}>Explore the collection <ArrowRight size={15} /></button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <article className="cart-item" key={item.id}>
                      <div className="cart-item-image" style={{ backgroundImage: `url("${item.imageUrl}")` }} />
                      <div className="cart-item-info">
                        <span className="product-category">{item.category}</span>
                        <h3>{item.name}</h3>
                        <span className="cart-item-price">{formatPrice(item.price)}</span>
                        <div className="quantity-stepper" aria-label={`Quantity for ${item.name}`}>
                          <button onClick={() => updateQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} aria-label="Increase quantity" disabled={item.quantity >= item.stock}><Plus size={13} /></button>
                        </div>
                      </div>
                      <button className="remove-item" onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))} aria-label={`Remove ${item.name} from bag`}><X size={16} /></button>
                    </article>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                  <div><span>Delivery</span><strong>{subtotal >= 150 ? "Complimentary" : formatPrice(12)}</strong></div>
                  <p>Taxes calculated at checkout. Delivery is confirmed before payment.</p>
                  <button className="button button-dark checkout-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                    Continue to checkout <ArrowRight size={16} />
                  </button>
                  <button className="continue-shopping" onClick={() => setCartOpen(false)}>Keep looking around</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {(checkoutOpen || orderNumber) && (
        <div className="overlay checkout-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !checkoutLoading) closeCheckout();
        }}>
          <section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow"><span className="eyebrow-line" /> ALMOST YOURS</span>
                <h2 id="checkout-title">{orderNumber ? "That's a good choice." : "Where should it go?"}</h2>
              </div>
              <button className="icon-button" onClick={closeCheckout} aria-label="Close checkout" disabled={checkoutLoading}><X size={21} /></button>
            </div>
            {orderNumber ? (
              <div className="order-confirmation" role="status">
                <span className="confirmation-check"><Check size={30} /></span>
                <h3>Order placed. Good things are on their way.</h3>
                <p>Your order number is <strong>{orderNumber}</strong>.</p>
                <p className="payment-note">Our team will be in touch to confirm payment and delivery before dispatch.</p>
                <button className="button button-dark" onClick={closeCheckout}>Back to the good stuff <ArrowRight size={15} /></button>
              </div>
            ) : (
              <form className="checkout-form" onSubmit={submitOrder}>
                <div className="checkout-order-summary">
                  <span>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
                  <strong>{formatPrice(subtotal + (subtotal >= 150 ? 0 : 12))}</strong>
                </div>
                <div className="form-grid">
                  <label className="form-field form-full">Email address<input required type="email" autoComplete="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} /></label>
                  <label className="form-field">First name<input required autoComplete="given-name" value={details.firstName} onChange={(event) => setDetails({ ...details, firstName: event.target.value })} /></label>
                  <label className="form-field">Last name<input required autoComplete="family-name" value={details.lastName} onChange={(event) => setDetails({ ...details, lastName: event.target.value })} /></label>
                  <label className="form-field form-full">Phone number<input required type="tel" autoComplete="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} /></label>
                  <label className="form-field form-full">Street address<input required autoComplete="street-address" value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} /></label>
                  <label className="form-field">City<input required autoComplete="address-level2" value={details.city} onChange={(event) => setDetails({ ...details, city: event.target.value })} /></label>
                  <label className="form-field">ZIP / postal code<input required autoComplete="postal-code" value={details.postalCode} onChange={(event) => setDetails({ ...details, postalCode: event.target.value })} /></label>
                </div>
                <p className="payment-note">Online payment isn’t available yet. We’ll confirm your payment and delivery details before dispatch.</p>
                {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
                <button className="button button-dark checkout-submit" type="submit" disabled={checkoutLoading}>
                  {checkoutLoading ? "Placing your order…" : "Place your order"}
                  {!checkoutLoading && <ArrowRight size={16} />}
                </button>
                <span className="secure-note"><ShieldCheck size={14} /> Your details stay safe with us.</span>
              </form>
            )}
          </section>
        </div>
      )}

      {selectedProduct && (
        <div className="overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedProduct(null);
        }}>
          <section className="quick-view" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
            <button className="quick-view-close icon-button" onClick={() => setSelectedProduct(null)} aria-label="Close product details"><X size={21} /></button>
            <div className="quick-view-image" style={{ backgroundImage: `url("${selectedProduct.imageUrl}")` }} />
            <div className="quick-view-info">
              <span className="eyebrow"><span className="eyebrow-line" /> {selectedProduct.category.toUpperCase()}</span>
              <h2 id="quick-view-title">{selectedProduct.name}</h2>
              <span className="product-rating"><span>★★★★★</span> {selectedProduct.rating.toFixed(1)} <span className="rating-count">({selectedProduct.reviewCount} happy homes)</span></span>
              <p>{selectedProduct.description}</p>
              <span className="sku-label">A thoughtful pick · {selectedProduct.sku}</span>
              <div className="quick-view-bottom">
                <span className="product-price">{formatPrice(selectedProduct.price)}</span>
                <button
                  className="button button-dark"
                  onClick={() => addToCart(selectedProduct)}
                  disabled={selectedProduct.stock < 1}
                >
                  {selectedProduct.stock < 1 ? "Sold out" : "Add to your bag"} <ShoppingCart size={16} />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
