import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const ProductGrid = ({ products = [], loading = false, onClearFilters }) => {
  // ── Loading Skeleton State ──
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 font-sans">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // ── Empty State ──
  if (!products || products.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          }
          title="No products found"
          description="We couldn't find any items matching your selected criteria. Try adjusting or clearing your filters."
          actionLabel={onClearFilters ? "Clear All Filters" : undefined}
          onAction={onClearFilters}
        />
      </div>
    );
  }

  // ── Render Products ──
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 font-sans">
      {products.map((product, index) => (
        <div
          key={product._id}
          className="animate-fadeInUp"
          style={{
            animationDelay: `${index * 40}ms`,
            animationFillMode: 'both',
          }}
        >
          <ProductCard product={product} index={index} />
        </div>
      ))}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default ProductGrid;