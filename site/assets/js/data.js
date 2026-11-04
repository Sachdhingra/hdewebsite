/*
 * Catalogue content. Images are free Unsplash placeholders: swap each `image`
 * for your own showroom or product photos (put files in assets/img/ and use
 * "assets/img/your-photo.jpg"). Prices are indicative samples: FILL IN.
 */
window.HDE_DATA = {
  // Interio's modular kitchen ranges (interio.com/modular-kitchen). Made to measure, so they are quoted after a consultation.
  kitchenRanges: [
    { name: "Steel Chef 2.0", material: "Galvanised steel kitchens",
      text: "A galvanised-steel carcass made for heavy utensils, oil and moisture, with laminate and wood-look finishes. Rust and termite resistant.",
      image: "assets/img/kitchen/range-steel-chef.jpg", link: "https://interio.com/steel-kitchen/" },
    { name: "Willow Wok", material: "Boiling waterproof (BWP) ply",
      text: "A warm wooden look in boiling waterproof ply, termite resistant and easy to keep clean.",
      image: "assets/img/kitchen/range-willow-wok.jpg", link: "https://interio.com/willow-wok-kitchen/" },
    { name: "Flavors", material: "HDHMR board",
      text: "High density, high moisture resistant board with acrylic, glass, textured and powder-coated steel shutter options.",
      image: "assets/img/kitchen/range-flavors.jpg", link: "https://interio.com/flavors-kitchen/" }
  ],
  kitchenLayouts: ["Straight", "L-shape", "U-shape", "Parallel", "Island"],
  rooms: [
    { slug: "living", name: "Living Room", blurb: "Sofas, recliners, TV units and centre tables",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=900&q=70&auto=format",
      types: ["Sofas", "Recliners", "TV units", "Centre tables", "Sofa cum beds"] },
    { slug: "bedroom", name: "Bedroom", blurb: "Storage beds, wardrobes, dressers and mattresses",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&q=70&auto=format",
      types: ["Beds", "Wardrobes", "Dressers", "Bedside tables", "Mattresses"] },
    { slug: "kitchen", name: "Modular Kitchen", blurb: "Designed to your layout, installed by our team",
      image: "assets/img/kitchen/kitchen-tile.jpg",
      types: ["L-shape", "U-shape", "Parallel", "Island", "Tall units"] },
    { slug: "dining", name: "Dining", blurb: "Four, six and eight seater sets, crockery units",
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=900&q=70&auto=format",
      types: ["Dining sets", "Dining chairs", "Crockery units"] },
    { slug: "office", name: "Home Office", blurb: "Ergonomic chairs, study tables and bookshelves",
      image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=900&q=70&auto=format",
      types: ["Office chairs", "Study tables", "Bookshelves", "Filing storage"] },
    { slug: "storage", name: "Storage", blurb: "Steel almirahs, home lockers, shoe racks and display units",
      image: "https://images.unsplash.com/photo-1595428773491-ae4a0b7e3a4a?w=900&q=70&auto=format",
      types: ["Almirahs", "Home lockers", "Shoe racks", "Cabinets", "Display units"] }
  ],

  products: [
    { id: "sofa-3s-fabric", room: "living", type: "Sofas", name: "Three-seater fabric sofa", from: 38990,
      note: "High-resilience foam, choice of 12 fabrics",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=70&auto=format" },
    { id: "sofa-l-corner", room: "living", type: "Sofas", name: "L-shape corner sofa", from: 58990,
      note: "Left or right hand chaise, seats five",
      image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=70&auto=format" },
    { id: "recliner-1s", room: "living", type: "Recliners", name: "Single-seat recliner", from: 24990,
      note: "Manual or motorised mechanism",
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=70&auto=format" },
    { id: "bed-queen-storage", room: "bedroom", type: "Beds", name: "Queen bed with hydraulic storage", from: 32990,
      note: "Engineered wood, soft-close lift",
      image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=70&auto=format" },
    { id: "wardrobe-3d", room: "bedroom", type: "Wardrobes", name: "Three-door wardrobe with mirror", from: 28990,
      note: "Locker, hanging and shelf zones",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70&auto=format" },
    { id: "kitchen-l", room: "kitchen", type: "L-shape", name: "L-shape modular kitchen", from: 1.85e5,
      note: "Per 10 ft run, carcass plus shutters, hardware included",
      image: "assets/img/kitchen/kitchen-straight.jpg" },
    { id: "dining-6s", room: "dining", type: "Dining sets", name: "Six-seater dining set", from: 35990,
      note: "Stone-finish top, upholstered chairs",
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=70&auto=format" },
    { id: "chair-ergo", room: "office", type: "Office chairs", name: "Ergonomic mesh office chair", from: 8990,
      note: "Adjustable lumbar, 3D armrests",
      image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=70&auto=format" },
    { id: "study-table", room: "office", type: "Study tables", name: "Study table with storage", from: 12990,
      note: "Cable management, two drawers",
      image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=70&auto=format" },
    { id: "almirah-steel", room: "storage", type: "Almirahs", name: "Steel almirah, two door", from: 17990,
      note: "Built-in locker, anti-rust finish",
      image: "https://images.unsplash.com/photo-1595428773491-ae4a0b7e3a4a?w=800&q=70&auto=format" }
  ],

  // Real Google reviews (stores.interio.com and the Patel Nagar Google listing), quoted as written; dates are approximate.
  reviews: [
    { name: "Siddharth Kandari", area: "Patel Nagar showroom", date: "June 2026", text: "Experience was very good thanks to Neesha Maam for the hospitality the purchasing experience been great" },
    { name: "Saurabh Rana", area: "Google review", date: "September 2026", text: "Wonderful furniture.. lots of options and quality of the wood is fantastic." },
    { name: "Surya Pal Singh Bisht", area: "Google review", date: "September 2026", text: "Godrej interio all product are good and attractive" },
    { name: "Parkash", area: "Patel Nagar showroom", date: "June 2026", text: "Had a wonderful experience at godrej interio.The furniture quality,elegant designs,and professional customer service made the entire shopping experience smooth and satisfying" },
    { name: "J Sh", area: "Patel Nagar showroom", date: "June 2026", text: "The Sales team guy Shivam made us go through the showroom in a very polite and efficient manner and that's how ended up buying the furniture.... shall buy more in future as this is just the beginning.... Good store" },
    { name: "Shreya Bisht", area: "Patel Nagar showroom", date: "June 2026", text: "We've been visiting Godrej Interio for a long time now & been a customer here for long. Our sales associate Nisha has been very kind & generous to us throughout these years. We definitely recommend visiting Godrej once for home goods purchase." },
    { name: "Ganga", area: "Patel Nagar showroom", date: "June 2026", text: "The showroom is very aesthetically pleasing and impressive. Sales executive Mr. Amit Bhatt has been very cooperative and is knowledgeable about variants and features of various items which helped in making our decision." },
    { name: "Varun Lekhwar", area: "Patel Nagar showroom", date: "July 2026", text: "The display was very good .Ms Nisha was very good to know about the product. Very well explained about all the products. Also showroom interior is quite decent" },
    { name: "Vipin Thapliyal", area: "Patel Nagar showroom", date: "July 2026", text: "Store is well maintained and equipped with all sort of items. The representative Mr Shivam is very professional and good person explains everything with ease" },
    { name: "Alok Joshi", area: "Patel Nagar showroom", date: "July 2026", text: "Satisfied Godrej product, showroom staff v.gud Mr Amit Bhatt explain very well Thanks Godrej interio" },
    { name: "Sakshi Rautela", area: "Patel Nagar showroom", date: "May 2026", text: "I recently had a modular kitchen installed by the team at Godrej Interio, Patel Nagar, and the experience was good from start to finish." },
    { name: "Anshul Jaiswal", area: "Patel Nagar showroom", date: "May 2026", text: "I got myself a modular kitchen from godrej and the architect made sure all my needs were catered to in the design phase also the technician who installed the kitchen were skilled and polite and made the installation seamless." },
    { name: "S K", area: "Patel Nagar showroom", date: "June 2026", text: "I recently purchased XL size three door Almira from Godrej interio, the whole process from purchase to installation was conducted very well by the staff. Overall it was a wonderful experience and I got amazing discount on the purchase as well." },
    { name: "Shobhit Goyal", area: "Patel Nagar showroom", date: "December 2025", text: "I recently purchased a metal modular kitchen from Godrej Interio, and I couldn’t be happier with my decision! The build quality is excellent…" },
    { name: "Annesha Mukherjee", area: "Patel Nagar showroom", date: "2025", text: "Purchased a almirah from the store.It was great experience.There is so much variety available at the store.The staffs are so courteous and well behaved 😊even the delivery persons are also so helpful.Thank you Godrej interior for serving the best products" }
  ]
};
