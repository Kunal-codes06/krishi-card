const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Product, Order, Delivery, Feedback, FarmerFeedback, User, ChatHistory, Analytics } = require('./mock-mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Seed data
seedInitialData();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

io.on('connection', (socket) => {
  console.log('User connected');

  // Delivery Boy ki app yahan apni live location bhejegi
  socket.on('driver_location_update', (data) => {
    // Consumer ki app ko location broadcast kardo taaki map update ho sake
    io.emit(`tracking_${data.deliveryId}`, { 
      lat: data.lat, 
      lng: data.lng 
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Helper for SMS Notification (Fast2SMS API)
async function sendSMS(phoneNumber, message) {
  try {
    if (!process.env.FAST2SMS_API_KEY || process.env.FAST2SMS_API_KEY === 'your_api_key_here') {
      console.log(`\n📱 [MOCK SMS] To: ${phoneNumber}`);
      console.log(`✉️  Message: ${message}`);
      console.log(`(Set FAST2SMS_API_KEY in .env to send real SMS)\n`);
      return;
    }

    const cleanNumber = phoneNumber.replace('+91', '').replace(/\s+/g, '').trim();
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        route: 'q',
        message: message,
        flash: 0,
        numbers: cleanNumber
      }
    });
    
    console.log(`\n================= SMS GATEWAY =================`);
    console.log(`✅ Asli SMS Bhej diya gaya hai: ${cleanNumber}`);
    console.log(`===============================================\n`);
  } catch (error) {
    console.error('\n❌ SMS Bhejne me error aayi (Check API Key limit):', error.message);
  }
}

// Helper for Aerial Distance (Fallback)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper for Real Road Distance (OSRM API)
async function calculateRoadDistance(lat1, lon1, lat2, lon2) {
  try {
    // OSRM expects coordinates in lon,lat order
    const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await axios.get(url, { timeout: 3000 });
    
    if (response.data.code === 'Ok') {
      // OSRM returns distance in meters. Convert to KM.
      return response.data.routes[0].distance / 1000; 
    }
    return calculateDistance(lat1, lon1, lat2, lon2);
  } catch (error) {
    console.error("OSRM Routing Error, falling back to aerial distance:", error.message);
    return calculateDistance(lat1, lon1, lat2, lon2); 
  }
}

// Seed Initial Data (if db is empty)
async function seedInitialData() {
  const count = await Product.countDocuments();
  if (count === 0) {
    console.log('Seeding initial products into MongoDB...');
    const initialProducts = [
      { name: 'Fresh Tomatoes', farmer: 'Ramesh Singh', location: 'Nashik, MH', lat: 19.9975, lng: 73.7898, price: 20, stock: '50', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&w=500&q=60', status: 'In Stock' },
      { name: 'Organic Potatoes', farmer: 'Suresh Kumar', location: 'Agra, UP', lat: 27.1767, lng: 78.0081, price: 15, stock: '100', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&w=500&q=60', status: 'In Stock' },
      { name: 'Red Onions', farmer: 'Vikram Yadav', location: 'Pune, MH', lat: 18.5204, lng: 73.8567, price: 30, stock: '200', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?ixlib=rb-4.0.3&w=500&q=60', status: 'In Stock' }
    ];
    await Product.insertMany(initialProducts);
  }
}

// --- API Endpoints ---

// Products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    // mapping _id to id for frontend compatibility
    const formatted = products.map(p => ({...p.toObject(), id: p._id.toString()}));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product({
      name: req.body.name,
      farmer: 'Amit Patel',
      location: req.body.location || 'Local Farm',
      lat: req.body.lat || 20.0,
      lng: req.body.lng || 73.0,
      price: Number(req.body.price),
      stock: req.body.qty,
      image: req.body.image || 'https://images.unsplash.com/photo-1595856417537-8848d56b063d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'
    });
    const saved = await newProduct.save();
    const formatted = {...saved.toObject(), id: saved._id.toString()};
    
    io.emit('new_product', formatted);
    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, stock, price } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (stock) updateData.stock = stock;
    if (price) updateData.price = Number(price);

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const formatted = {...product.toObject(), id: product._id.toString()};
    io.emit('product_updated', formatted);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    io.emit('product_deleted', req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Orders & Delivery Logic
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    // map orderId to id for frontend
    const formatted = orders.map(o => ({...o.toObject(), id: o.orderId}));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { productId, quantity, buyer, buyerLat, buyerLng } = req.body;
  
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let distance = 0;
    if (buyerLat && buyerLng && product.lat && product.lng) {
      distance = await calculateRoadDistance(product.lat, product.lng, buyerLat, buyerLng);
      if (distance > 50000) {
        return res.status(400).json({ error: `Delivery not available. Farm is ${distance.toFixed(1)} km away via road (Max 50000 km).` });
      }
    }

    let finalPrice = Number(product.price) * quantity;

    const orderCount = await Order.countDocuments();
    const orderIdStr = `#ORD-${String(orderCount + 1).padStart(3, '0')}`;

    const newOrder = new Order({
      orderId: orderIdStr,
      item: `${product.name} (${quantity}kg)`,
      buyer: buyer || 'Consumer',
      farmer: product.farmer,
      amount: `₹${finalPrice.toFixed(2)}`,
      distance: distance.toFixed(1),
      location: req.body.location || 'Local Location',
      paymentMethod: req.body.paymentMethod || 'upi'
    });
    
    await newOrder.save();

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const newDelivery = new Delivery({
      deliveryId: `#DEL-${Date.now().toString().slice(-4)}`,
      orderId: newOrder.orderId,
      item: newOrder.item,
      pickup: product.location,
      dropoff: req.body.location || 'Customer Location',
      distance: `${distance.toFixed(1)} km`,
      earnings: `₹${(distance * 5 + 20).toFixed(0)}`,
      status: 'Searching for Partner',
      otp: otp
    });
    
    await newDelivery.save();

    const formattedOrder = {...newOrder.toObject(), id: newOrder.orderId};
    const formattedDelivery = {...newDelivery.toObject(), id: newDelivery.deliveryId};

    sendSMS('+918888888888', `Krishi Cart: You have a new order ${formattedOrder.id} for ${formattedOrder.item} from ${formattedOrder.buyer}.`);
    sendSMS(formattedDelivery.phone, `Krishi Cart Delivery: New task assigned! Pickup from ${formattedDelivery.pickup}. Distance: ${formattedDelivery.distance}, Earnings: ${formattedDelivery.earnings}.`);

    io.emit('new_order', formattedOrder);
    io.emit('new_delivery', formattedDelivery);

    res.status(201).json({ order: formattedOrder, message: 'Order placed successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Deliveries API
app.get('/api/deliveries', async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    const formatted = deliveries.map(d => ({...d.toObject(), id: d.deliveryId}));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

app.get('/api/deliveries/order/:orderId', async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ orderId: req.params.orderId });
    if (delivery) {
      res.json({...delivery.toObject(), id: delivery.deliveryId});
    } else {
      res.status(404).json({ error: 'Delivery not found for this order' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delivery details' });
  }
});

app.put('/api/deliveries/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerName, phone, vehicleNo, lat, lng } = req.body;
    
    const delivery = await Delivery.findOneAndUpdate(
      { deliveryId: id, status: 'Searching for Partner' }, 
      { status: 'Accepted', partnerName, phone, vehicleNo, partnerLat: lat, partnerLng: lng }, 
      { new: true }
    );
    
    if (delivery) {
      const formatted = {...delivery.toObject(), id: delivery.deliveryId};
      io.emit('delivery_update', formatted);
      res.json(formatted);
    } else {
      res.status(400).json({ error: 'Delivery already accepted by someone else or not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept delivery' });
  }
});

app.put('/api/deliveries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pickupImage } = req.body;
    
    const updateData = { status: status };
    if (pickupImage) updateData.pickupImage = pickupImage;

    const delivery = await Delivery.findOneAndUpdate({ deliveryId: id }, updateData, { new: true });
    
    if (delivery) {
      const formatted = {...delivery.toObject(), id: delivery.deliveryId};
      io.emit('delivery_update', formatted);
      res.json(formatted);
    } else {
      res.status(404).json({ error: 'Delivery not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

app.put('/api/deliveries/:id/verify-otp', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    
    const delivery = await Delivery.findOne({ deliveryId: id });
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    
    if (delivery.otp === otp || otp === '0000') { // 0000 as master override for testing
      delivery.status = 'Delivered';
      await delivery.save();
      
      // Update the main Order status as well so Farmer dashboard updates
      if (delivery.orderId) {
        await Order.findOneAndUpdate({ orderId: delivery.orderId }, { status: 'Delivered' });
      }

      const formatted = {...delivery.toObject(), id: delivery.deliveryId};
      io.emit('delivery_update', formatted);
      res.json({ success: true, delivery: formatted });
    } else {
      res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Market Prices
app.get('/api/mandi-prices', async (req, res) => {
  const { city } = req.query;
  try {
    const govApiKey = process.env.DATA_GOV_API_KEY;
    if (govApiKey) {
      const resourceId = '35985678-0d79-46b4-9ed6-6f13308a1d24';
      let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${govApiKey}&format=json&limit=1000`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.records && data.records.length > 0) {
          const uniqueMap = new Map();
          
          let records = data.records;

          if (city) {
            const lowerCity = city.toLowerCase();
            records = records.filter(r => 
              (r.Market || '').toLowerCase().includes(lowerCity) || 
              (r.State || '').toLowerCase().includes(lowerCity) ||
              (r.District || '').toLowerCase().includes(lowerCity)
            );
          }

          records.forEach(r => {
            const key = `${r.Commodity}-${r.Market}`.toLowerCase();
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, {
                commodity: r.Commodity || r.commodity,
                market: r.Market || r.market,
                state: r.State || r.state,
                min_price: r.Min_Price || r.min_price,
                max_price: r.Max_Price || r.max_price,
                modal_price: r.Modal_Price || r.modal_price,
                trend: Math.random() > 0.5 ? 'up' : 'down'
              });
            }
          });

          const finalRecords = Array.from(uniqueMap.values());
          
          if (finalRecords.length > 0) {
            return res.json({ source: 'datagov', records: finalRecords });
          }
        }
      }
    }
  } catch (error) {
    console.log("Gov API error, using mock data:", error.message);
  }

  // Fallback to Mock Data (Filtered by city if possible)
  let filteredMock = [
    { commodity: "Wheat", min_price: "2100", max_price: "2300", modal_price: "2200", market: "Lucknow", state: "Uttar Pradesh", trend: "up" },
    { commodity: "Rice", min_price: "3500", max_price: "4200", modal_price: "3850", market: "Lucknow", state: "Uttar Pradesh", trend: "up" },
    { commodity: "Potato", min_price: "1200", max_price: "1600", modal_price: "1400", market: "Indore", state: "Madhya Pradesh", trend: "down" },
    { commodity: "Soyabean", min_price: "4200", max_price: "4600", modal_price: "4450", market: "Indore", state: "Madhya Pradesh", trend: "down" },
    { commodity: "Cotton", min_price: "7000", max_price: "8000", modal_price: "7500", market: "Bhopal", state: "Madhya Pradesh", trend: "up" },
    { commodity: "Mustard", min_price: "5400", max_price: "5800", modal_price: "5600", market: "Delhi", state: "Delhi", trend: "down" },
    { commodity: "Tomato", min_price: "1800", max_price: "2500", modal_price: "2100", market: "Agra", state: "Uttar Pradesh", trend: "up" },
    { commodity: "Apple", min_price: "8000", max_price: "12000", modal_price: "10000", market: "Shimla", state: "Himachal Pradesh", trend: "up" },
    { commodity: "Mango", min_price: "3000", max_price: "5000", modal_price: "4000", market: "Varanasi", state: "Uttar Pradesh", trend: "up" },
  ];

  if (city) {
    const lowerCity = city.toLowerCase();
    const citySpecific = filteredMock.filter(m => 
      m.market.toLowerCase().includes(lowerCity) || 
      m.state.toLowerCase().includes(lowerCity)
    );
    if (citySpecific.length > 0) filteredMock = citySpecific;
  }

  res.json({ source: 'mock', records: filteredMock });
});

// Feedback & Chat endpoints
app.post('/api/farmer-feedback', async (req, res) => {
  try {
    const newFeedback = new FarmerFeedback(req.body);
    const saved = await newFeedback.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

app.get('/api/farmer-feedback/:farmerId', async (req, res) => {
  try {
    const feedback = await FarmerFeedback.find({ farmerId: req.params.farmerId });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const newFeedback = new Feedback(req.body);
    const saved = await newFeedback.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

app.post('/api/chat', async (req, res) => {
  try {
    const { message, location, language, userId } = req.body;
    
    // Save user message to history
    const userChat = new ChatHistory({
      userId: userId || 'anonymous',
      sender: 'user',
      message: message,
      language: language || 'English'
    });
    await userChat.save();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_gemini_api_key_here' || process.env.GEMINI_API_KEY === 'dummy-key') {
      // Fallback if no key is provided
      const reply = "I am Krishi Cart AI. Please configure GEMINI_API_KEY in the backend .env file to enable full AI responses. For now, I can help with basic orders and mandi prices!";
      
      const botChat = new ChatHistory({
        userId: userId || 'anonymous',
        sender: 'bot',
        message: reply,
        language: language || 'English'
      });
      await botChat.save();
      
      return res.json({ reply });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
You are Krishi AI, an expert agricultural assistant for an app called Krishi Cart.
You provide support to Indian farmers.
The user is currently located in: ${location || 'Unknown'}.
The user's preferred language is: ${language || 'English'}.

Your areas of expertise:
1. Farming guidance (crops, soil, fertilizers)
2. Weather advice based on location
3. Order and delivery assistance

Rules:
- Reply ONLY in the user's preferred language (${language || 'English'}).
- Keep responses concise, practical, and farmer-friendly.
- Do NOT use markdown asterisks/formatting unless necessary. Keep it plain text readable.
- If asked about prices, say "Please use the 'Ask about prices' feature to get live Mandi prices."

User Message: ${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    
    // Save bot message to history
    const botChat = new ChatHistory({
      userId: userId || 'anonymous',
      sender: 'bot',
      message: reply,
      language: language || 'English'
    });
    await botChat.save();

    res.json({ reply });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ reply: "Sorry, I am facing some technical difficulties connecting to my AI brain. Please try again later." });
  }
});

// Authentication Endpoints
app.post('/api/signup', async (req, res) => {
  try {
    const { name, phoneOrEmail, password, role, aadharNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ phoneOrEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or phone already exists' });
    }

    const newUser = new User({
      name,
      phoneOrEmail,
      password, // In a real app, hash the password
      role,
      aadharNumber
    });
    
    const savedUser = await newUser.save();
    // Don't send password back
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    
    res.status(201).json({ message: 'User created successfully', user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { phoneOrEmail, role } = req.body; // In a real app, verify password too
    
    let user = await User.findOne({ phoneOrEmail, role });
    if (!user) {
      // For hackathon mock purposes, if user doesn't exist, we auto-create one
      const newUser = new User({
        name: role === 'farmer' ? 'Demo Farmer' : role === 'delivery' ? 'Demo Delivery' : 'Demo Consumer',
        phoneOrEmail,
        password: 'mockpassword',
        role,
        aadharNumber: '000000000000'
      });
      user = await newUser.save();
    }
    
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ message: 'Login successful', user: userWithoutPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// AI Prediction Endpoints
app.post('/api/predict-crop', (req, res) => {
  try {
    const { N, P, K, temperature, humidity, ph, rainfall } = req.body;
    
    // Simple Rule-Based/Decision-Tree-like mock ML for Crop Recommendation
    let recommendedCrop = "Wheat";
    
    if (temperature > 25 && humidity > 70 && rainfall > 150) {
      recommendedCrop = "Rice";
    } else if (ph < 6.5 && N > 50 && K > 30) {
      recommendedCrop = "Maize";
    } else if (temperature > 20 && rainfall < 100 && P > 40) {
      recommendedCrop = "Cotton";
    } else if (temperature < 20 && humidity < 60) {
      recommendedCrop = "Mustard";
    } else if (N > 80 && rainfall > 100) {
      recommendedCrop = "Sugarcane";
    } else if (ph > 6.0 && ph < 7.0 && K > 40) {
      recommendedCrop = "Potato";
    } else if (temperature > 25 && humidity < 50) {
      recommendedCrop = "Millets";
    }
    
    // Simulate AI processing delay
    setTimeout(() => {
      res.json({ crop: recommendedCrop, confidence: (Math.random() * 15 + 80).toFixed(1) + "%" });
    }, 1500);
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict crop' });
  }
});

app.post('/api/predict-price', async (req, res) => {
  try {
    const { crop, currentPrice, season, quantity, demand } = req.body;
    
    // Call Python ML Backend
    const mlResponse = await axios.post('http://localhost:5001/api/ml/predict-price', {
      crop: crop || 'Wheat',
      currentPrice: currentPrice || 30.0,
      season: season || 'Summer',
      quantity: quantity || 100,
      demand: demand || 'Medium'
    });
    
    const predictionData = mlResponse.data;
    
    // Save to Analytics Collection
    const analyticsEntry = new Analytics({
      crop,
      season,
      demand,
      quantity,
      currentPrice,
      predictedPrice: predictionData.predictedPrice,
      trend: predictionData.trend,
      timestamp: new Date()
    });
    await analyticsEntry.save();
    
    res.json(predictionData);
  } catch (error) {
    console.error('Failed to predict price from ML Backend:', error.message);
    res.status(500).json({ error: 'Failed to predict price. Make sure Flask backend is running on port 5001.' });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const analytics = await Analytics.find().sort({ createdAt: -1 });
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/api/analytics/dashboard-stats', async (req, res) => {
  try {
    const { farmerId } = req.query; // If provided, filter for a specific farmer

    let orders = await Order.find();
    
    if (farmerId) {
       // Mock logic: Assuming farmer name matches user name for simplicity in this mock DB
       orders = orders.filter(o => o.farmer === farmerId);
    }

    // 1. Total Sales and Revenue
    const totalOrders = orders.length;
    let totalRevenue = 0;
    
    // 2. Revenue over time (Mocking 6 months based on current total)
    // We will generate a realistic looking curve based on actual total
    orders.forEach(o => {
      // Amount is usually a string like "₹450.00", remove currency and parse
      const val = parseFloat(o.amount.replace(/[^0-9.-]+/g, ''));
      if(!isNaN(val)) totalRevenue += val;
    });

    const revenueGrowth = [
      { month: 'Jan', revenue: Math.round(totalRevenue * 0.1) },
      { month: 'Feb', revenue: Math.round(totalRevenue * 0.15) },
      { month: 'Mar', revenue: Math.round(totalRevenue * 0.12) },
      { month: 'Apr', revenue: Math.round(totalRevenue * 0.2) },
      { month: 'May', revenue: Math.round(totalRevenue * 0.25) },
      { month: 'Jun', revenue: Math.round(totalRevenue * 0.18) }
    ];

    // 3. Top Selling Products
    const productCounts = {};
    orders.forEach(o => {
       // Item might be "Fresh Tomatoes (50kg)"
       const nameMatch = o.item.split(' (')[0];
       const name = nameMatch ? nameMatch.trim() : o.item;
       if (!productCounts[name]) productCounts[name] = 0;
       productCounts[name] += 1;
    });
    
    const topProducts = Object.keys(productCounts)
      .map(name => ({ name, sales: productCounts[name] }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5

    // 4. Customer/User Activity (Global only)
    let userStats = [];
    if (!farmerId) {
       const users = await User.find();
       const roleCounts = { farmer: 0, consumer: 0, delivery: 0 };
       users.forEach(u => {
          if (u.role && roleCounts[u.role] !== undefined) {
             roleCounts[u.role]++;
          }
       });
       userStats = [
         { name: 'Farmers', value: roleCounts.farmer || 3 },
         { name: 'Consumers', value: roleCounts.consumer || 12 },
         { name: 'Delivery', value: roleCounts.delivery || 5 }
       ];
    }

    res.json({
      totalSales: totalOrders,
      totalRevenue: Math.round(totalRevenue),
      revenueGrowth,
      topProducts,
      userStats
    });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
