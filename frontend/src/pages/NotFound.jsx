import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full text-center font-sans space-y-6">
        {/* Visual Badge */}
        <div className="relative inline-flex items-center justify-center">
          <span className="text-8xl sm:text-9xl font-black tracking-tighter text-slate-100 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
              Page Not Found
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Lost in the Catalog?
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<HomeIcon className="w-4 h-4" />}
              fullWidth
            >
              Return Home
            </Button>
          </Link>
          <Link to="/shop" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
              fullWidth
            >
              Browse Catalog
            </Button>
          </Link>
        </div>

        {/* Suggested Quick Links */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Popular Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Electronics', to: '/shop?category=electronics' },
              { label: 'Clothing', to: '/shop?category=clothing' },
              { label: 'Home Living', to: '/shop?category=home' },
              { label: 'Books', to: '/shop?category=books' },
            ].map((cat) => (
              <Link
                key={cat.label}
                to={cat.to}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
