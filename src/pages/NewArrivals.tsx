import React from 'react';
import { useProductContext } from '../context/ProductContext';
import { ProductCard } from './Home';

export function NewArrivals() {
  const { products } = useProductContext();
  const newArrivalProducts = products.filter(p => p.isNewArrival);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
      <div className="text-center mb-16 space-y-4">
        <h1 className="font-serif text-4xl md:text-5xl font-bold">New Arrivals</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          Discover our latest handcrafted creations, designed to add a touch of elegance to your everyday style.
        </p>
      </div>

      {newArrivalProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {newArrivalProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Check Back Soon!</h3>
          <p className="text-gray-500">We are currently crafting new pieces. Stay tuned for updates.</p>
        </div>
      )}
    </div>
  );
}
