import type { Language } from "../types/catalog.ts";

export type Copy = {
  brand: string;
  tagline: string;
  welcome: string;
  startShopping: string;
  language: string;
  english: string;
  telugu: string;
  tamil: string;
  shop: string;
  cart: string;
  searchPlaceholder: string;
  searchLabel: string;
  categories: string;
  all: string;
  pulses: string;
  grains: string;
  essentials: string;
  dairy: string;
  add: string;
  stock: string;
  brandLabel: string;
  price: string;
  outOfStock: string;
  micLabel: string;
  micHint: string;
  micUnavailable: string;
  dismiss: string;
  noResults: string;
  emptyCart: string;
  continueShopping: string;
  remove: string;
  quantity: string;
  subtotal: string;
  total: string;
  checkout: string;
  reviewOrder: string;
  confirmOrder: string;
  confirming: string;
  backToCart: string;
  orderConfirmed: string;
  orderNumber: string;
  confirmationNote: string;
  newOrder: string;
  items: string;
  decrease: string;
  increase: string;
  home: string;
  inCart: string;
  loading: string;
  emptyOrder: string;
  lineTotal: string;
};

const en: Copy = {
  brand: "GNANI VOICE SHOPPING",
  tagline: "Speak Your Needs. Get Your Items Faster.",
  welcome: "Welcome. Choose a language and start your order.",
  startShopping: "Start Shopping",
  language: "Language",
  english: "English",
  telugu: "Telugu",
  tamil: "Tamil",
  shop: "Shop",
  cart: "Cart",
  searchPlaceholder: "Type a product name",
  searchLabel: "Search products",
  categories: "Categories",
  all: "All",
  pulses: "Pulses",
  grains: "Grains",
  essentials: "Essentials",
  dairy: "Dairy",
  add: "Add",
  stock: "Stock",
  brandLabel: "Brand",
  price: "Price",
  outOfStock: "Out of stock",
  micLabel: "Microphone",
  micHint: "Tap the microphone if you want to speak.",
  micUnavailable:
    "Voice shopping is not connected yet. Please type the product name below.",
  dismiss: "Close",
  noResults: "No products match that search.",
  emptyCart: "Your cart is empty.",
  continueShopping: "Continue shopping",
  remove: "Remove",
  quantity: "Quantity",
  subtotal: "Subtotal",
  total: "Total",
  checkout: "Checkout",
  reviewOrder: "Review your order",
  confirmOrder: "Confirm order",
  confirming: "Confirming",
  backToCart: "Back to cart",
  orderConfirmed: "Order confirmed",
  orderNumber: "Order number",
  confirmationNote:
    "This order is saved on this kiosk only. It is not sent to a store system yet.",
  newOrder: "Start a new order",
  items: "Items",
  decrease: "Decrease quantity",
  increase: "Increase quantity",
  home: "Home",
  inCart: "In cart",
  loading: "Loading products",
  emptyOrder: "No order to show.",
  lineTotal: "Line total",
};

const te: Copy = {
  brand: "GNANI VOICE SHOPPING",
  tagline: "మీ అవసరాలు చెప్పండి. వస్తువులు త్వరగా పొందండి.",
  welcome: "స్వాగతం. భాషను ఎంచుకుని ఆర్డర్ ప్రారంభించండి.",
  startShopping: "షాపింగ్ ప్రారంభించండి",
  language: "భాష",
  english: "ఇంగ్లీష్",
  telugu: "తెలుగు",
  tamil: "తమిళం",
  shop: "షాప్",
  cart: "కార్ట్",
  searchPlaceholder: "ఉత్పత్తి పేరు టైప్ చేయండి",
  searchLabel: "ఉత్పత్తులను వెతకండి",
  categories: "వర్గాలు",
  all: "అన్నీ",
  pulses: "పప్పులు",
  grains: "ధాన్యాలు",
  essentials: "అవసరమైనవి",
  dairy: "పాల ఉత్పత్తులు",
  add: "జోడించు",
  stock: "నిల్వ",
  brandLabel: "బ్రాండ్",
  price: "ధర",
  outOfStock: "నిల్వ లేదు",
  micLabel: "మైక్రోఫోన్",
  micHint: "మాట్లాడాలనుకుంటే మైక్రోఫోన్ నొక్కండి.",
  micUnavailable:
    "వాయిస్ షాపింగ్ ఇంకా కనెక్ట్ కాలేదు. దయచేసి ఉత్పత్తి పేరు కింద టైప్ చేయండి.",
  dismiss: "మూసివేయి",
  noResults: "ఆ శోధనకు ఉత్పత్తులు లేవు.",
  emptyCart: "మీ కార్ట్ ఖాళీగా ఉంది.",
  continueShopping: "షాపింగ్ కొనసాగించండి",
  remove: "తీసివేయి",
  quantity: "పరిమాణం",
  subtotal: "ఉపమొత్తం",
  total: "మొత్తం",
  checkout: "చెక్అవుట్",
  reviewOrder: "మీ ఆర్డర్‌ను సమీక్షించండి",
  confirmOrder: "ఆర్డర్ నిర్ధారించండి",
  confirming: "నిర్ధారిస్తోంది",
  backToCart: "కార్ట్‌కు తిరిగి",
  orderConfirmed: "ఆర్డర్ నిర్ధారించబడింది",
  orderNumber: "ఆర్డర్ నంబర్",
  confirmationNote:
    "ఈ ఆర్డర్ ఈ కియోస్క్‌లో మాత్రమే ఉంది. ఇంకా స్టోర్ సిస్టమ్‌కు పంపలేదు.",
  newOrder: "కొత్త ఆర్డర్ ప్రారంభించండి",
  items: "వస్తువులు",
  decrease: "పరిమాణం తగ్గించు",
  increase: "పరిమాణం పెంచు",
  home: "హోమ్",
  inCart: "కార్ట్‌లో",
  loading: "ఉత్పత్తులు లోడ్ అవుతున్నాయి",
  emptyOrder: "చూపించడానికి ఆర్డర్ లేదు.",
  lineTotal: "వరుస మొత్తం",
};

const ta: Copy = {
  brand: "GNANI VOICE SHOPPING",
  tagline: "உங்கள் தேவைகளைச் சொல்லுங்கள். பொருட்களை விரைவாகப் பெறுங்கள்.",
  welcome: "வரவேற்கிறோம். மொழியைத் தேர்ந்தெடுத்து ஆர்டரைத் தொடங்குங்கள்.",
  startShopping: "ஷாப்பிங் தொடங்கு",
  language: "மொழி",
  english: "ஆங்கிலம்",
  telugu: "தெலுங்கு",
  tamil: "தமிழ்",
  shop: "கடை",
  cart: "கார்ட்",
  searchPlaceholder: "பொருளின் பெயரை தட்டச்சு செய்யுங்கள்",
  searchLabel: "பொருட்களைத் தேடுங்கள்",
  categories: "வகைகள்",
  all: "அனைத்தும்",
  pulses: "பருப்புகள்",
  grains: "தானியங்கள்",
  essentials: "அத்தியாவசியம்",
  dairy: "பால் பொருட்கள்",
  add: "சேர்",
  stock: "இருப்பு",
  brandLabel: "பிராண்ட்",
  price: "விலை",
  outOfStock: "இருப்பு இல்லை",
  micLabel: "மைக்ரோஃபோன்",
  micHint: "பேச விரும்பினால் மைக்ரோஃபோனைத் தட்டவும்.",
  micUnavailable:
    "குரல் ஷாப்பிங் இன்னும் இணைக்கப்படவில்லை. கீழே பொருளின் பெயரை தட்டச்சு செய்யுங்கள்.",
  dismiss: "மூடு",
  noResults: "அந்த தேடலுக்கு பொருட்கள் இல்லை.",
  emptyCart: "உங்கள் கார்ட் காலியாக உள்ளது.",
  continueShopping: "ஷாப்பிங் தொடரவும்",
  remove: "நீக்கு",
  quantity: "அளவு",
  subtotal: "துணை மொத்தம்",
  total: "மொத்தம்",
  checkout: "செக்அவுட்",
  reviewOrder: "உங்கள் ஆர்டரைப் பாருங்கள்",
  confirmOrder: "ஆர்டரை உறுதிசெய்",
  confirming: "உறுதிசெய்யப்படுகிறது",
  backToCart: "கார்ட்டுக்குத் திரும்பு",
  orderConfirmed: "ஆர்டர் உறுதிசெய்யப்பட்டது",
  orderNumber: "ஆர்டர் எண்",
  confirmationNote:
    "இந்த ஆர்டர் இந்த கியோஸ்கில் மட்டும் சேமிக்கப்பட்டுள்ளது. கடை அமைப்புக்கு இன்னும் அனுப்பப்படவில்லை.",
  newOrder: "புதிய ஆர்டரைத் தொடங்கு",
  items: "பொருட்கள்",
  decrease: "அளவைக் குறை",
  increase: "அளவை அதிகரி",
  home: "முகப்பு",
  inCart: "கார்ட்டில்",
  loading: "பொருட்கள் ஏற்றப்படுகின்றன",
  emptyOrder: "காட்ட ஆர்டர் இல்லை.",
  lineTotal: "வரி மொத்தம்",
};

export const copy: Record<Language, Copy> = { en, te, ta };
