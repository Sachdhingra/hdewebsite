import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { products, categories } from '../data/mockData';
import { Star, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import InquiryForm from '../components/InquiryForm';

const CategoryPage = () => {
  const { slug } = useParams();
  const [priceFilter, setPriceFilter] = useState('all');
  
  const category = categories.find(cat => cat.slug === slug);
  const categoryProducts = products.filter(p => p.category === slug);

  const filteredProducts = categoryProducts.filter(product => {
    if (priceFilter === 'all') return true;
    if (priceFilter === 'under25k') return product.price < 25000;
    if (priceFilter === '25k-50k') return product.price >= 25000 && product.price <= 50000;
    if (priceFilter === 'above50k') return product.price > 50000;
    return true;
  });

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Category not found</h1>
      </div>
    );
  }

  return (
    <div>
      {/* Category Hero */}
      <div
        className="h-[300px] bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3)), url(${category.image})`
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">{category.name}</h1>
            <p className="text-xl">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Filter by Price</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value="all"
                    checked={priceFilter === 'all'}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="text-red-500"
                  />
                  <span>All Prices</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value="under25k"
                    checked={priceFilter === 'under25k'}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="text-red-500"
                  />
                  <span>Under ₹25,000</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value="25k-50k"
                    checked={priceFilter === '25k-50k'}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="text-red-500"
                  />
                  <span>₹25,000 - ₹50,000</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    value="above50k"
                    checked={priceFilter === 'above50k'}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="text-red-500"
                  />
                  <span>Above ₹50,000</span>
                </label>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredProducts.length} products
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const discount = Math.round(
                  ((product.originalPrice - product.price) / product.originalPrice) * 100
                );
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {discount > 0 && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {discount}% OFF
                        </div>
                      )}
                      <button className="absolute top-4 right-4 bg-white p-2 rounded-full hover:bg-red-50 transition-colors">
                        <Heart size={20} className="text-gray-600 hover:text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.features.slice(0, 2).map((feature, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white transition-colors">
                        View Details
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Interested in {category.name} Furniture?
              </h2>
              <p className="text-gray-600">
                Get personalized recommendations and best prices from our experts
              </p>
            </div>
            <InquiryForm category={category.name} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
