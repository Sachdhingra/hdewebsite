import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { submitLead } from '../utils/api';

const InquiryForm = ({ productName = '', category = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    productInterest: productName,
    category: category
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await submitLead({
        ...formData,
        source: category ? 'category-page' : 'website'
      });
      
      toast.success(response.message || 'Inquiry submitted successfully!', {
        description: 'Our team will contact you shortly.',
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        productInterest: '',
        category: ''
      });
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error('Failed to submit inquiry', {
        description: 'Please try again or contact us directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="text-red-500" size={28} />
        <h3 className="text-2xl font-bold text-gray-800">Get in Touch</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name *
          </label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your.email@example.com"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+91 XXXXXXXXXX"
            className="w-full"
          />
        </div>
        {productName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Interest
            </label>
            <Input
              type="text"
              name="productInterest"
              value={formData.productInterest}
              onChange={handleChange}
              readOnly
              className="w-full bg-gray-50"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Message
          </label>
          <Textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us about your requirements..."
            className="w-full"
          />
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          By submitting, you agree to be contacted by our team regarding your inquiry.
        </p>
      </form>
    </div>
  );
};

export default InquiryForm;
