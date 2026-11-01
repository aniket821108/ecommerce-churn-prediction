import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export const RouteErrorBoundary = () => {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected application error occurred. Our engineering team has been notified.';
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    if (error.status === 404) {
      title = 'Page Not Found';
      message = 'The requested resource could not be found.';
    } else if (error.status === 401) {
      title = 'Unauthorized Access';
      message = 'You do not have active authentication credentials to view this page.';
    } else if (error.status === 403) {
      title = 'Access Forbidden';
      message = 'Your user account does not have permission to view this resource.';
    } else {
      message = error.statusText || error.data?.message || message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xl font-sans space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-2xs">
          <ExclamationTriangleIcon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Error {statusCode}
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            size="md"
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
            fullWidth
          >
            Reload Page
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<HomeIcon className="w-4 h-4" />}
              fullWidth
            >
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteErrorBoundary;

