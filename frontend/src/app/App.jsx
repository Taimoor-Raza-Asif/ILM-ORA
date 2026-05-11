import React from 'react';
import { BrowserRouter, useLocation } from "react-router-dom";
import { AppProviders } from "./providers/AppProviders";
import { AppRoutes } from "./routes"; // This is your index.jsx
import { Toaster } from "../presentation/components/common/Toaster";
import { Navigation } from "../presentation/components/layout/Navigation";
import { Footer } from "../presentation/components/layout/Footer";

/**
 * A small helper component to render navigation only on non-auth pages
 */
function ConditionalNavigation() {
  const location = useLocation();
  
  // Don't render Navigation on the /auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return <Navigation />;
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        {/* This is the fix. We add the Navigation component here.
          It's inside the Router so it can use navigation links,
          but it's outside the Routes so it stays on every page.
          We also use a helper to hide it on the /auth page.
        */}
        <div className="flex flex-col min-h-screen">
          <ConditionalNavigation />
          
          <main className="pt-16 flex-1"> {/* Add padding-top to offset the sticky nav's height */}
            <AppRoutes />
          </main>
          <Footer />
        </div>
        <Toaster />
      </BrowserRouter>
    </AppProviders>
  );
}