/**
 * ============================================================================
 * ADMIN PANEL - CENTRALIZED MOCK DATASTORE (js/data.js)
 * ============================================================================
 * Contains all global data collections for Categories, Sellers, Products,
 * Orders, Customers, Payments, Reviews, and Coupons.
 * Comments provided for easy understanding and customization.
 */

// ----------------------------------------------------------------------------
// 1. CATEGORIES DATA
// List of all active product categories on the website.
// ----------------------------------------------------------------------------
let categories = [
  { id: 1, name: "Kitchenware", count: 48 },
  { id: 2, name: "Apparel", count: 132 },
  { id: 3, name: "Electronics", count: 76 },
  { id: 4, name: "Home & Living", count: 64 },
  { id: 5, name: "Beauty", count: 39 },
  { id: 6, name: "Sports", count: 22 }
];

// ----------------------------------------------------------------------------
// 2. SELLERS DATA
// Includes seller profiles & their submitted product approval requests.
// ----------------------------------------------------------------------------
let sellers = [
  {
    id: "SEL-101",
    storeName: "Apex Artisans",
    ownerName: "Rahim Uddin",
    email: "rahim@apexartisans.bd",
    phone: "+880 1711-223344",
    category: "Kitchenware",
    location: "Dhaka, Bangladesh",
    joinedDate: "2024-03-15",
    status: "Active",
    productRequests: [
      {
        id: "REQ-201",
        name: "Handmade Clay Tea Set (6 Cups + Teapot)",
        category: "Kitchenware",
        price: 1850,
        stock: 25,
        image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&auto=format&fit=crop&q=80",
        details: "Traditional terracotta clay tea set handcrafted by rural artisans. Retains natural tea aroma. FAQs: Is it lead free? Yes, 100% organic clay.",
        status: "Pending"
      },
      {
        id: "REQ-202",
        name: "Brass Spice Container Box",
        category: "Kitchenware",
        price: 2400,
        stock: 15,
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=700&auto=format&fit=crop&q=80",
        details: "7-compartment pure brass spice box with transparent lid for kitchen storage.",
        status: "Pending"
      }
    ]
  },
  {
    id: "SEL-102",
    storeName: "TechHub BD",
    ownerName: "Kamrul Hasan",
    email: "contact@techhub.com.bd",
    phone: "+880 1819-887766",
    category: "Electronics",
    location: "Chattogram, Bangladesh",
    joinedDate: "2024-06-20",
    status: "Active",
    productRequests: [
      {
        id: "REQ-203",
        name: "RGB Mechanical Gaming Keyboard",
        category: "Electronics",
        price: 3800,
        stock: 30,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&auto=format&fit=crop&q=80",
        details: "Customizable RGB lighting with anti-ghosting mechanical switches. FAQs: Compatible with Mac? Yes.",
        status: "Pending"
      }
    ]
  },
  {
    id: "SEL-103",
    storeName: "Urban Threads BD",
    ownerName: "Nusrat Jahan",
    email: "nusrat@urbanthreads.com",
    phone: "+880 1912-445566",
    category: "Apparel",
    location: "Dhaka, Bangladesh",
    joinedDate: "2025-01-10",
    status: "Active",
    productRequests: [
      {
        id: "REQ-204",
        name: "Organic Cotton Polo T-Shirt",
        category: "Apparel",
        price: 1250,
        stock: 50,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80",
        details: "100% breathable organic cotton slim-fit polo t-shirt for summer wear.",
        status: "Pending"
      }
    ]
  },
  {
    id: "SEL-104",
    storeName: "GreenLife Home",
    ownerName: "Tariqul Islam",
    email: "info@greenlifehome.com",
    phone: "+880 1611-990011",
    category: "Home & Living",
    location: "Sylhet, Bangladesh",
    joinedDate: "2025-05-18",
    status: "Active",
    productRequests: []
  }
];

// ----------------------------------------------------------------------------
// 3. PRODUCTS DATA
// Live products catalog. Each product is tied to a seller (sellerName).
// ----------------------------------------------------------------------------
let products = [
  {
    id: "P-1001",
    name: "Ceramic Pour-Over Coffee Set",
    category: "Kitchenware",
    price: 1450,
    stock: 34,
    status: "In Stock",
    sellerName: "Apex Artisans",
    sellerId: "SEL-101",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&auto=format&fit=crop&q=80",
    details: "Handcrafted matte ceramic coffee dripper with heat-resistant borosilicate glass server. FAQs: Dishwasher safe? Yes."
  },
  {
    id: "P-1002",
    name: "Linen Blend Shirt — Olive",
    category: "Apparel",
    price: 1890,
    stock: 12,
    status: "In Stock",
    sellerName: "Urban Threads BD",
    sellerId: "SEL-103",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700&auto=format&fit=crop&q=80",
    details: "Lightweight breathable linen blend casual shirt. FAQs: Shrink on wash? Pre-shrunk fabric."
  },
  {
    id: "P-1003",
    name: "Wireless Earbuds Pro",
    category: "Electronics",
    price: 3200,
    stock: 0,
    status: "Out of Stock",
    sellerName: "TechHub BD",
    sellerId: "SEL-102",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80",
    details: "Active Noise Cancellation, 30h battery life, IPX4 water resistance. FAQs: Warranty? 1 Year Official."
  },
  {
    id: "P-1004",
    name: "Bamboo Cutting Board Set",
    category: "Kitchenware",
    price: 980,
    stock: 58,
    status: "In Stock",
    sellerName: "Apex Artisans",
    sellerId: "SEL-101",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=700&auto=format&fit=crop&q=80",
    details: "Organic antibacterial bamboo cutting boards with deep juice groove. FAQs: Knife friendly? Yes."
  },
  {
    id: "P-1005",
    name: "Weighted Blanket 7kg",
    category: "Home & Living",
    price: 4250,
    stock: 9,
    status: "In Stock",
    sellerName: "GreenLife Home",
    sellerId: "SEL-104",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=700&auto=format&fit=crop&q=80",
    details: "100% breathable cotton cover filled with micro glass beads for restorative sleep."
  },
  {
    id: "P-1006",
    name: "Matte Lipstick — Terracotta",
    category: "Beauty",
    price: 650,
    stock: 120,
    status: "In Stock",
    sellerName: "Apex Store Direct",
    sellerId: "SEL-101",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=700&auto=format&fit=crop&q=80",
    details: "Long-lasting non-drying matte liquid lipstick with rich velvet finish."
  },
  {
    id: "P-1007",
    name: "Adjustable Yoga Mat",
    category: "Sports",
    price: 1120,
    stock: 41,
    status: "In Stock",
    sellerName: "GreenLife Home",
    sellerId: "SEL-104",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&auto=format&fit=crop&q=80",
    details: "6mm thick eco-friendly TPE non-slip workout mat with carrying strap."
  },
  {
    id: "P-1008",
    name: "Slim Fit Chino Trousers",
    category: "Apparel",
    price: 1650,
    stock: 0,
    status: "Out of Stock",
    sellerName: "Urban Threads BD",
    sellerId: "SEL-103",
    image: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=700&auto=format&fit=crop&q=80",
    details: "Stretch cotton twill chinos tailored for modern comfort."
  },
  {
    id: "P-1009",
    name: "Smart LED Desk Lamp",
    category: "Electronics",
    price: 2100,
    stock: 26,
    status: "In Stock",
    sellerName: "TechHub BD",
    sellerId: "SEL-102",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700&auto=format&fit=crop&q=80",
    details: "Touch control dimmer with USB charging port and wireless phone charger."
  },
  {
    id: "P-1010",
    name: "Stoneware Dinner Set (16pc)",
    category: "Kitchenware",
    price: 3600,
    stock: 14,
    status: "In Stock",
    sellerName: "Apex Artisans",
    sellerId: "SEL-101",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=700&auto=format&fit=crop&q=80",
    details: "Microwave and oven safe handcrafted reactive glaze stoneware collection."
  }
];

// ----------------------------------------------------------------------------
// 4. ORDERS DATA
// ----------------------------------------------------------------------------
let orders = [
  { id: "#10482", customer: "Farhana Islam", items: 3, date: "2026-09-14", payment: "bKash", status: "Delivered", total: 5240 },
  { id: "#10481", customer: "Tanvir Ahmed", items: 1, date: "2026-09-14", payment: "Card", status: "Processing", total: 1890 },
  { id: "#10480", customer: "Nusrat Jahan", items: 2, date: "2026-09-13", payment: "COD", status: "Pending", total: 2430 },
  { id: "#10479", customer: "Shakil Rahman", items: 5, date: "2026-09-13", payment: "bKash", status: "Shipped", total: 8960 },
  { id: "#10478", customer: "Mim Akter", items: 1, date: "2026-09-12", payment: "Card", status: "Cancelled", total: 1120 },
  { id: "#10477", customer: "Rakib Hasan", items: 4, date: "2026-09-12", payment: "Nagad", status: "Delivered", total: 6780 },
  { id: "#10476", customer: "Sadia Sultana", items: 2, date: "2026-09-11", payment: "COD", status: "Delivered", total: 3150 },
  { id: "#10475", customer: "Imran Khan", items: 1, date: "2026-09-11", payment: "Card", status: "Processing", total: 980 }
];

// ----------------------------------------------------------------------------
// 5. CUSTOMERS DATA
// ----------------------------------------------------------------------------
const customers = [
  { name: "Farhana Islam", email: "farhana.islam@example.com", location: "Dhaka", orders: 14, spend: 58200, joined: "Jan 2024" },
  { name: "Tanvir Ahmed", email: "tanvir.a@example.com", location: "Chattogram", orders: 6, spend: 19800, joined: "Jun 2024" },
  { name: "Nusrat Jahan", email: "nusrat.j@example.com", location: "Sylhet", orders: 3, spend: 7650, joined: "Mar 2025" },
  { name: "Shakil Rahman", email: "shakil.r@example.com", location: "Khulna", orders: 21, spend: 94300, joined: "Aug 2023" },
  { name: "Mim Akter", email: "mim.akter@example.com", location: "Rajshahi", orders: 1, spend: 1120, joined: "Sep 2026" },
  { name: "Rakib Hasan", email: "rakib.h@example.com", location: "Dhaka", orders: 9, spend: 41200, joined: "Nov 2024" }
];

// ----------------------------------------------------------------------------
// 6. PAYMENTS DATA
// ----------------------------------------------------------------------------
const payments = [
  { id: "TXN-88213", order: "#10482", method: "bKash", date: "2026-09-14", status: "Completed", amount: 5240 },
  { id: "TXN-88212", order: "#10481", method: "Card", date: "2026-09-14", status: "Completed", amount: 1890 },
  { id: "TXN-88211", order: "#10480", method: "COD", date: "2026-09-13", status: "Pending", amount: 2430 },
  { id: "TXN-88210", order: "#10479", method: "bKash", date: "2026-09-13", status: "Completed", amount: 8960 },
  { id: "TXN-88209", order: "#10478", method: "Card", date: "2026-09-12", status: "Failed", amount: 1120 },
  { id: "TXN-88208", order: "#10477", method: "Nagad", date: "2026-09-12", status: "Completed", amount: 6780 }
];

// ----------------------------------------------------------------------------
// 7. REVIEWS DATA
// ----------------------------------------------------------------------------
let reviews = [
  { name: "Farhana Islam", product: "Ceramic Pour-Over Coffee Set", rating: 5, text: "Beautifully made and the pour is exactly as advertised. Packaging was excellent too.", date: "2 days ago", status: "pending" },
  { name: "Tanvir Ahmed", product: "Linen Blend Shirt — Olive", rating: 4, text: "Good fabric quality, runs slightly large so consider sizing down.", date: "3 days ago", status: "pending" },
  { name: "Shakil Rahman", product: "Weighted Blanket 7kg", rating: 2, text: "Took over a week longer than the estimate to arrive, otherwise fine.", date: "5 days ago", status: "approved" },
  { name: "Sadia Sultana", product: "Smart LED Desk Lamp", rating: 5, text: "Three brightness levels work great for late night reading.", date: "1 week ago", status: "approved" }
];

// ----------------------------------------------------------------------------
// 8. COUPONS DATA
// ----------------------------------------------------------------------------
let coupons = [
  { code: "WELCOME10", discount: "10% off", used: 214, expires: "2026-12-31", status: "Active" },
  { code: "EID2026", discount: "৳300 off", used: 89, expires: "2026-10-01", status: "Active" },
  { code: "FREESHIP", discount: "Free shipping", used: 502, expires: "2026-09-20", status: "Active" },
  { code: "SUMMER25", discount: "25% off", used: 340, expires: "2026-08-15", status: "Expired" }
];

// ----------------------------------------------------------------------------
// 9. DASHBOARD CHART DATA
// ----------------------------------------------------------------------------
const salesLast7 = [
  { label: "Sat", value: 62000 }, { label: "Sun", value: 71000 }, { label: "Mon", value: 54000 },
  { label: "Tue", value: 88000 }, { label: "Wed", value: 95000 }, { label: "Thu", value: 76000 }, { label: "Fri", value: 112000 }
];
const topProductsData = [
  { name: "Ceramic Pour-Over Coffee Set", sub: "Kitchenware", units: 284 },
  { name: "Matte Lipstick — Terracotta", sub: "Beauty", units: 251 },
  { name: "Bamboo Cutting Board Set", sub: "Kitchenware", units: 198 },
  { name: "Adjustable Yoga Mat", sub: "Sports", units: 163 }
];

