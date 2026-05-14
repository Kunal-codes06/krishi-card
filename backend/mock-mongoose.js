const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'database.json');

let db = {
  products: [],
  orders: [],
  deliveries: [],
  feedbacks: [],
  farmerFeedbacks: [],
  users: [],
  chatHistory: [],
  analytics: []
};

if (fs.existsSync(DB_FILE)) {
  try {
    const loadedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    db = { ...db, ...loadedDb };
  } catch (e) {
    console.error("Error reading database.json", e);
  }
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function createModel(collectionName) {
  return {
    find: (query = {}) => {
      let results = db[collectionName].filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
      let mappedResults = results.map(item => ({...item, toObject: () => item}));
      // Return a Promise-like object that supports .sort()
      const promiseLike = Promise.resolve([...mappedResults].reverse());
      promiseLike.sort = () => Promise.resolve([...mappedResults].reverse());
      return promiseLike;
    },
    findOne: async (query) => {
      let result = db[collectionName].find(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return false;
        }
        return true;
      });
      if(result) {
         return { 
           ...result, 
           toObject: () => result, 
           save: async function() { 
             Object.assign(db[collectionName].find(i => i._id === result._id), this); 
             saveDB(); 
             return this; 
           } 
         };
      }
      return null;
    },
    findById: async (id) => {
      let result = db[collectionName].find(item => item._id === id);
      if(result) return { ...result, toObject: () => result };
      return null;
    },
    countDocuments: async () => {
      return db[collectionName].length;
    },
    insertMany: async (items) => {
      const mapped = items.map(i => ({ ...i, _id: crypto.randomUUID(), createdAt: new Date() }));
      db[collectionName].push(...mapped);
      saveDB();
      return mapped;
    },
    findByIdAndUpdate: async (id, update, options) => {
      let item = db[collectionName].find(i => i._id === id);
      if (item) {
        Object.assign(item, update);
        saveDB();
        return { ...item, toObject: () => item };
      }
      return null;
    },
    findOneAndUpdate: async (query, update, options) => {
      let item = db[collectionName].find(i => {
        for (let key in query) {
          if (i[key] !== query[key]) return false;
        }
        return true;
      });
      if (item) {
        Object.assign(item, update);
        saveDB();
        return { ...item, toObject: () => item };
      }
      return null;
    },
    findByIdAndDelete: async (id) => {
      let idx = db[collectionName].findIndex(i => i._id === id);
      if (idx !== -1) {
        let item = db[collectionName][idx];
        db[collectionName].splice(idx, 1);
        saveDB();
        return item;
      }
      return null;
    }
  };
}

class ModelInstance {
  constructor(data, collectionName) {
    Object.assign(this, data);
    this._id = crypto.randomUUID();
    this.createdAt = new Date();
    this._collectionName = collectionName;
  }
  async save() {
    db[this._collectionName].push(this);
    saveDB();
    return { ...this, toObject: () => this };
  }
  toObject() {
    return this;
  }
}

const ProductModel = createModel('products');
const OrderModel = createModel('orders');
const DeliveryModel = createModel('deliveries');
const FeedbackModel = createModel('feedbacks');
const FarmerFeedbackModel = createModel('farmerFeedbacks');
const UserModel = createModel('users');
const ChatHistoryModel = createModel('chatHistory');
const AnalyticsModel = createModel('analytics');

const Product = function(data) { return new ModelInstance(data, 'products'); };
Object.assign(Product, ProductModel);

const Order = function(data) { return new ModelInstance(data, 'orders'); };
Object.assign(Order, OrderModel);

const Delivery = function(data) { return new ModelInstance(data, 'deliveries'); };
Object.assign(Delivery, DeliveryModel);

const Feedback = function(data) { return new ModelInstance(data, 'feedbacks'); };
Object.assign(Feedback, FeedbackModel);

const FarmerFeedback = function(data) { return new ModelInstance(data, 'farmerFeedbacks'); };
Object.assign(FarmerFeedback, FarmerFeedbackModel);

const User = function(data) { return new ModelInstance(data, 'users'); };
Object.assign(User, UserModel);

const ChatHistory = function(data) { return new ModelInstance(data, 'chatHistory'); };
Object.assign(ChatHistory, ChatHistoryModel);

const Analytics = function(data) { return new ModelInstance(data, 'analytics'); };
Object.assign(Analytics, AnalyticsModel);

module.exports = { Product, Order, Delivery, Feedback, FarmerFeedback, User, ChatHistory, Analytics };
