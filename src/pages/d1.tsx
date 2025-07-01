import React from 'react';
import { Navbar } from '@/components/Navbar';
import { ScanLine, ShoppingCart, Zap } from 'lucide-react'; // Icons for visual appeal

const CustomerDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="container mx-auto flex flex-col items-center p-4 sm:p-6 lg:p-8 text-center">
        
        {/* Hero Section */}
        <section className="w-full max-w-4xl py-12 md:py-20">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Unleash a New Era of Shopping.
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Tired of waiting in long checkout lines? We've transformed the supermarket experience. 
            Glide through the aisles, scan your items, and pay instantly—all from your phone.
          </p>
          <div className="mt-8">
            <a 
              href="#how-it-works" 
              className="inline-block bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-105"
            >
              Discover the Freedom
            </a>
          </div>
        </section>

        {/* "How It Works" Section */}
        <section id="how-it-works" className="w-full max-w-5xl py-12 md:py-20 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Your Effortless In-Store Journey
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-12">
            A beautifully smooth interface designed for speed and simplicity.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 px-6">
            {/* Step 1: Scan */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <ScanLine className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">1. Scan As You Shop</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Empower your shopping. Simply use your phone to scan the barcode of each item as you place it in your cart. Our app adds it to your digital basket instantly.
              </p>
            </div>

            {/* Step 2: Pay */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">2. Seamless Checkout</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Ready to go? Finalize your purchase directly in the app with a secure, one-tap payment. No queues, no hassle, just pure convenience.
              </p>
            </div>

            {/* Step 3: Go */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">3. Breeze Through the Exit</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Receive a digital receipt with a QR code. Show it at the express exit point for a quick verification and you're on your way. Experience shopping, streamlined.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default CustomerDashboard;