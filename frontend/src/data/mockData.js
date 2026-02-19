// Mock data for Home Decor Enterprises website

export const companyInfo = {
  name: "Home Decor Enterprises",
  tagline: "Authorized Godrej Interio Channel Partner Since 2006",
  established: "2006",
  phone: "+91-135-XXXXXXX",
  email: "info@homedecorenterprises.com",
  whatsapp: "+91-98XXXXXXXX"
};

export const showrooms = [
  {
    id: 1,
    name: "Home Decor Enterprises - Rajpur Road",
    address: "123 Rajpur Road, Near Clock Tower, Dehradun, Uttarakhand - 248001",
    phone: "+91-135-XXXXXXX",
    email: "rajpur@homedecorenterprises.com",
    timing: "Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 7:00 PM",
    mapUrl: "https://maps.google.com"
  },
  {
    id: 2,
    name: "Home Decor Enterprises - Saharanpur Road",
    address: "456 Saharanpur Road, Near ISBT, Dehradun, Uttarakhand - 248001",
    phone: "+91-135-YYYYYYY",
    email: "saharanpur@homedecorenterprises.com",
    timing: "Mon-Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 7:00 PM",
    mapUrl: "https://maps.google.com"
  }
];

export const categories = [
  {
    id: 1,
    name: "Living Room",
    slug: "living-room",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
    description: "Transform your living space with our elegant sofas, loungers, and coffee tables"
  },
  {
    id: 2,
    name: "Bedroom",
    slug: "bedroom",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    description: "Create your perfect sanctuary with beds, wardrobes, and bedroom sets"
  },
  {
    id: 3,
    name: "Dining Room",
    slug: "dining-room",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
    description: "Dine in style with our premium dining tables and chairs"
  },
  {
    id: 4,
    name: "Office & Study",
    slug: "office-study",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
    description: "Boost productivity with ergonomic office chairs and study tables"
  },
  {
    id: 5,
    name: "Modular Kitchen",
    slug: "modular-kitchen",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800",
    description: "Design your dream kitchen with modular solutions"
  },
  {
    id: 6,
    name: "Storage Solutions",
    slug: "storage",
    image: "https://images.unsplash.com/photo-1595428773491-ae4a0b7e3a4a?w=800",
    description: "Organize beautifully with wardrobes, almirahs, and cabinets"
  }
];

export const products = [
  {
    id: 1,
    name: "Royale Fabric Sofa Set",
    category: "living-room",
    price: 45990,
    originalPrice: 65990,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    description: "Premium 3-seater sofa with plush cushioning",
    features: ["Premium Fabric", "Sturdy Frame", "5 Year Warranty"],
    inStock: true
  },
  {
    id: 2,
    name: "Urbane King Size Bed",
    category: "bedroom",
    price: 32990,
    originalPrice: 45990,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
    description: "Elegant king size bed with storage",
    features: ["Storage Compartments", "Premium Wood", "10 Year Warranty"],
    inStock: true
  },
  {
    id: 3,
    name: "Elite L-Shaped Sofa",
    category: "living-room",
    price: 58990,
    originalPrice: 79990,
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    description: "Spacious L-shaped sofa perfect for large families",
    features: ["Leather Finish", "Corner Design", "5 Year Warranty"],
    inStock: true
  },
  {
    id: 4,
    name: "Classic Wooden Wardrobe",
    category: "bedroom",
    price: 28990,
    originalPrice: 39990,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    description: "Spacious 3-door wardrobe with mirror",
    features: ["3 Door Design", "Multiple Compartments", "10 Year Warranty"],
    inStock: true
  },
  {
    id: 5,
    name: "Marble Top Dining Table",
    category: "dining-room",
    price: 35990,
    originalPrice: 49990,
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800",
    description: "6-seater dining table with marble top",
    features: ["Marble Top", "Seats 6", "5 Year Warranty"],
    inStock: true
  },
  {
    id: 6,
    name: "Ergonomic Office Chair",
    category: "office-study",
    price: 8990,
    originalPrice: 12990,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800",
    description: "Premium ergonomic chair with lumbar support",
    features: ["Adjustable Height", "Lumbar Support", "2 Year Warranty"],
    inStock: true
  },
  {
    id: 7,
    name: "Study Table with Storage",
    category: "office-study",
    price: 12990,
    originalPrice: 18990,
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800",
    description: "Compact study table with multiple drawers",
    features: ["Built-in Storage", "Cable Management", "5 Year Warranty"],
    inStock: true
  },
  {
    id: 8,
    name: "Recliner Sofa",
    category: "living-room",
    price: 42990,
    originalPrice: 59990,
    image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800",
    description: "Luxury recliner with massage function",
    features: ["Reclining Function", "Premium Leather", "3 Year Warranty"],
    inStock: true
  }
];

export const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    location: "Dehradun",
    rating: 5,
    comment: "Excellent quality furniture and amazing service! The team helped me design my entire living room. Highly recommended!",
    date: "2024-12-15"
  },
  {
    id: 2,
    name: "Priya Sharma",
    location: "Dehradun",
    rating: 5,
    comment: "Bought a complete bedroom set from Home Decor Enterprises. The quality is outstanding and delivery was on time.",
    date: "2024-11-28"
  },
  {
    id: 3,
    name: "Amit Singh",
    location: "Mussoorie",
    rating: 5,
    comment: "Best furniture showroom in Dehradun! Great collection of Godrej Interio products and professional staff.",
    date: "2024-11-10"
  },
  {
    id: 4,
    name: "Neha Verma",
    location: "Dehradun",
    rating: 5,
    comment: "Purchased office furniture for my workspace. The ergonomic chairs are fantastic! Worth every penny.",
    date: "2024-10-22"
  }
];

export const heroSlides = [
  {
    id: 1,
    title: "Designed for Better Living",
    subtitle: "No Cost EMI Available",
    cta: "Explore Bedroom",
    ctaLink: "/category/bedroom",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920"
  },
  {
    id: 2,
    title: "Transform Your Living Space",
    subtitle: "Premium Sofas & Loungers",
    cta: "View Living Room",
    ctaLink: "/category/living-room",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920"
  },
  {
    id: 3,
    title: "Modular Kitchen Solutions",
    subtitle: "Customize Your Dream Kitchen",
    cta: "Explore Kitchens",
    ctaLink: "/category/modular-kitchen",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1920"
  },
  {
    id: 4,
    title: "Work From Home in Style",
    subtitle: "Ergonomic Office Furniture",
    cta: "View Office Furniture",
    ctaLink: "/category/office-study",
    image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1920"
  }
];

export const instagramPosts = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    link: "#"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    link: "#"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400",
    link: "#"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400",
    link: "#"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400",
    link: "#"
  }
];
