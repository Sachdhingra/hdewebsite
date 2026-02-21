import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../utils/api';
import { Button } from '../components/ui/button';
import { 
  ShoppingCart, 
  Phone, 
  MapPin, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Check,
  Truck,
  Shield,
  MessageCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'sonner';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`${product.name} added to inquiry cart!`);
    }
  };

  const handleTalkToExpert = () => {
    // Open WhatsApp or phone dialer
    const message = encodeURIComponent(`Hi, I'm interested in: ${product?.name}`);
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  const handleVisitStore = () => {
    // Navigate to showrooms page
    window.location.href = '/showrooms';
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.name} at Home Decor Enterprises`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const nextImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h1>
        <Link to="/" className="text-red-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const images = product.images?.length > 0 ? product.images : [product.image];
  const currentImage = images[currentImageIndex] || product.image;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-red-500">Home</Link>
            <span>/</span>
            <Link to={`/category/${product.category}`} className="hover:text-red-500 capitalize">
              {product.category?.replace(/-/g, ' ')}
            </Link>
            <span>/</span>
            <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-lg shadow-md overflow-hidden aspect-square">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
              
              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                  {discount}% OFF
                </div>
              )}

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    data-testid="prev-image-btn"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                    data-testid="next-image-btn"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button className="bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition-colors">
                  <Heart size={20} className="text-gray-600 hover:text-red-500" />
                </button>
                <button 
                  onClick={handleShare}
                  className="bg-white p-2 rounded-full shadow-lg hover:bg-blue-50 transition-colors"
                >
                  <Share2 size={20} className="text-gray-600 hover:text-blue-500" />
                </button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index ? 'border-red-500' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2" data-testid="product-title">
                {product.name}
              </h1>
              
              {product.rating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.rating}/5)</span>
                </div>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-gray-900" data-testid="product-price">
                  ₹{product.price?.toLocaleString('en-IN')}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-xl text-gray-500 line-through">
                    ₹{product.originalPrice?.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-green-600 font-semibold">
                  You save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')} ({discount}% off)
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">Inclusive of all taxes</p>
            </div>

            {/* Features */}
            {product.features?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      <Check size={14} className="text-green-500" />
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg font-semibold"
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="mr-2" size={20} />
                Add to Inquiry Cart
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={handleTalkToExpert}
                  variant="outline"
                  className="py-6 border-2 border-green-500 text-green-600 hover:bg-green-50"
                  data-testid="talk-to-expert-btn"
                >
                  <MessageCircle className="mr-2" size={20} />
                  Talk to Expert
                </Button>
                <Button 
                  onClick={handleVisitStore}
                  variant="outline"
                  className="py-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                  data-testid="visit-store-btn"
                >
                  <MapPin className="mr-2" size={20} />
                  Visit Store
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Truck className="mx-auto text-gray-600 mb-2" size={24} />
                <p className="text-xs text-gray-600">Free Delivery</p>
              </div>
              <div className="text-center">
                <Shield className="mx-auto text-gray-600 mb-2" size={24} />
                <p className="text-xs text-gray-600">Warranty Support</p>
              </div>
              <div className="text-center">
                <Check className="mx-auto text-gray-600 mb-2" size={24} />
                <p className="text-xs text-gray-600">Genuine Product</p>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Warranty */}
            {product.warranty && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="text-blue-500" size={20} />
                  <span className="font-semibold text-blue-700">{product.warranty}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Need Help? We're Here For You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a 
              href="tel:+919876543210"
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="bg-red-100 p-3 rounded-full">
                <Phone className="text-red-500" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Call Us</p>
                <p className="text-gray-600">+91 98765 43210</p>
              </div>
            </a>
            <a 
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="bg-green-100 p-3 rounded-full">
                <MessageCircle className="text-green-500" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">WhatsApp</p>
                <p className="text-gray-600">Chat with us</p>
              </div>
            </a>
            <Link 
              to="/showrooms"
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="bg-blue-100 p-3 rounded-full">
                <MapPin className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Visit Showroom</p>
                <p className="text-gray-600">Find a store near you</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
