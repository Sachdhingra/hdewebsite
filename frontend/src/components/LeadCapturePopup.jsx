import React, { useState, useEffect } from 'react';
import { X, Bell, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { submitLead } from '../utils/api';
import { toast } from 'sonner';

const LeadCapturePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    // Check if user has already submitted or dismissed recently
    const lastDismissed = localStorage.getItem('leadPopupDismissed');
    const hasAlreadySubmitted = localStorage.getItem('leadPopupSubmitted');

    if (hasAlreadySubmitted) {
      return;
    }

    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      // Show again after 24 hours
      if (hoursSinceDismissed < 24) {
        return;
      }
    }

    // Show popup after 5 seconds of page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('leadPopupDismissed', Date.now().toString());
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email && !formData.phone) {
      toast.error('Please enter either email or phone number');
      return;
    }

    // Phone validation (Indian format)
    if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await submitLead({
        name: formData.name || 'Website Visitor',
        email: formData.email || '',
        phone: formData.phone || '',
        message: 'Subscribed for updates via website popup',
        source: 'website_popup',
        category: 'General'
      });

      toast.success('Thank you! You will receive exclusive updates soon.');
      setHasSubmitted(true);
      localStorage.setItem('leadPopupSubmitted', 'true');
      
      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
        data-testid="lead-capture-popup"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-md"
          data-testid="popup-close-btn"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Gift size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Get Exclusive Offers!
          </h2>
          <p className="text-white/90 text-sm">
            Subscribe to receive special discounts, new arrivals & furniture tips
          </p>
        </div>

        {/* Form Section */}
        <div className="p-6">
          {hasSubmitted ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Bell size={32} className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You're All Set!
              </h3>
              <p className="text-gray-600">
                We'll keep you updated with the best deals.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  name="name"
                  placeholder="Your Name (optional)"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                  data-testid="popup-name-input"
                />
              </div>
              <div>
                <Input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full"
                  data-testid="popup-email-input"
                />
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span>or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <div>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="rounded-l-none"
                    maxLength={10}
                    data-testid="popup-phone-input"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-red-500 hover:bg-red-600 text-white py-6 font-semibold"
                disabled={loading}
                data-testid="popup-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  <>
                    <Bell className="mr-2" size={20} />
                    Subscribe for Updates
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By subscribing, you agree to receive promotional communications. 
                You can unsubscribe anytime.
              </p>
            </form>
          )}
        </div>

        {/* Benefits */}
        {!hasSubmitted && (
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Subscribers get:</p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Exclusive discounts up to 30%
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Early access to new collections
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Free interior design tips
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadCapturePopup;
