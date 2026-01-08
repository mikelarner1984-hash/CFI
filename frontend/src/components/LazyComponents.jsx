import React, { Suspense, lazy } from 'react';

// Loading component
export const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Loading Care Work...</p>
    </div>
  </div>
);

// Lazy load the dashboard for better performance
export const LazyDashboard = lazy(() => import('./pages/Dashboard'));
