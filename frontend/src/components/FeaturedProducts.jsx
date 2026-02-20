import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { getFeaturedProducts } from '../utils/api';
import { Button } from './ui/button';
import { toast } from 'sonner';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const addToCart = (e) => {
    e.stopPropagation();
    
    const cartItem = {
      productId: product.id || product._id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    };

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.productId === cartItem.productId);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
      toast.success('Quantity updated in cart');
    } else {
      cart.push(cartItem);
      toast.success('Added to cart');
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
      <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${product.id || product._id}`)}>
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
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
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => navigate(`/product/${product.id || product._id}`)}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            View Details
          </Button>
          <Button
            onClick={addToCart}
            className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getFeaturedProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Fallback to mock data
        import('../data/mockData').then(({ products: mockProducts }) => {
          setProducts(mockProducts.slice(0, 4));
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading products...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
            Bestselling Products
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our most popular furniture pieces, loved by customers across Dehradun
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
