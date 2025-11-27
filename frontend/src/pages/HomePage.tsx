import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { Footer } from "@/components/layout/Footer";
import { FeaturedSection } from "@/components/products/FeaturedSection";
import { CategorySection } from "@/components/products/CategorySection";
import {
  useFeaturedProducts,
  useRecentProducts,
  useProductsByCategory,
} from "@/lib/hooks/useProducts";

export default function HomePage() {
  const featuredProducts = useFeaturedProducts();
  const recentProducts = useRecentProducts();
  const electronicsProducts = useProductsByCategory("ELECTRONICS");
  const fashionProducts = useProductsByCategory("FASHION");
  const servicesProducts = useProductsByCategory("SERVICES");

  return (
    <div className="min-h-screen">
      <Header />
      <CategoryNav />

      {/* Hero Section */}
      <section className="bg-[image:var(--custom-gradient)] py-16 text-white">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl font-serif">
              Every Transaction Protected. Every Seller Verified.
            </h1>
            <p className="mt-12 mb-8 text-lg text-blue-100 sm:text-xl font-light font-serif">
              Join thousands trading safely on SafeTrade. Our AI-powered
              detection and expert moderation review 100% of listings - catching
              dangerous items before they reach you. Buy, sell, and trust
              completely.
            </p>
            <div className="mx-auto max-w-2xl">
              <Link to="/products">
                <Button size="lg" variant="secondary" className="mt-4">
                  Browse All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container px-4 py-12">
        <div className="space-y-16">
          {/* Featured Products */}
          {featuredProducts && (
            <FeaturedSection
              title="Featured Products"
              products={featuredProducts}
              viewAllLink="/products"
            />
          )}

          {/* Recent Products */}
          {recentProducts && (
            <FeaturedSection
              title="Recently Added"
              products={recentProducts}
              viewAllLink="/products?sort=recent"
            />
          )}

          {/* Electronics Category */}
          {electronicsProducts && electronicsProducts.length > 0 && (
            <CategorySection
              category="ELECTRONICS"
              products={electronicsProducts}
            />
          )}

          {/* Fashion Category */}
          {fashionProducts && fashionProducts.length > 0 && (
            <CategorySection category="FASHION" products={fashionProducts} />
          )}

          {/* Services Category */}
          {servicesProducts && servicesProducts.length > 0 && (
            <CategorySection category="SERVICES" products={servicesProducts} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
