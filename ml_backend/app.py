from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import random

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------
# 1. Generate Synthetic Data and Train Model on Startup
# ---------------------------------------------------------

CROPS = ['Wheat', 'Rice', 'Tomato', 'Potato', 'Onion', 'Apple', 'Mango', 'Cotton', 'Mustard', 'Soyabean']
SEASONS = ['Summer', 'Winter', 'Monsoon', 'Spring']
DEMAND = ['Low', 'Medium', 'High']

# Generate dummy historical data
data = []
for _ in range(2000):
    crop = random.choice(CROPS)
    season = random.choice(SEASONS)
    demand = random.choice(DEMAND)
    quantity = random.randint(10, 1000)
    
    # Base price logic
    base_price_map = {'Wheat': 25, 'Rice': 40, 'Tomato': 20, 'Potato': 15, 'Onion': 30, 'Apple': 100, 'Mango': 60, 'Cotton': 70, 'Mustard': 50, 'Soyabean': 45}
    base = base_price_map.get(crop, 30)
    
    # Current price with some noise
    current_price = base + random.uniform(-5, 5)
    
    # Future price calculation (the target)
    future_price = current_price
    
    # Season effect
    if season == 'Monsoon' and crop in ['Tomato', 'Onion']:
        future_price *= 1.2 # Prices go up
    elif season == 'Winter' and crop == 'Apple':
        future_price *= 0.8 # Cheaper in season
        
    # Demand effect
    if demand == 'High':
        future_price *= 1.15
    elif demand == 'Low':
        future_price *= 0.85
        
    # Quantity effect (high supply lowers price)
    if quantity > 500:
        future_price *= 0.9
        
    # Add noise to target
    future_price += random.uniform(-2, 2)
    
    data.append([crop, season, demand, quantity, current_price, max(1, future_price)])

df = pd.DataFrame(data, columns=['Crop', 'Season', 'Demand', 'Quantity', 'CurrentPrice', 'FuturePrice'])

# Encode categorical variables
label_encoders = {}
for col in ['Crop', 'Season', 'Demand']:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

X = df[['Crop', 'Season', 'Demand', 'Quantity', 'CurrentPrice']]
y = df['FuturePrice']

# Train Model
print("Training AI Price Prediction Model...")
model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X, y)
print("Model Training Complete.")

# ---------------------------------------------------------
# 2. API Endpoints
# ---------------------------------------------------------

@app.route('/api/ml/predict-price', methods=['POST'])
def predict_price():
    try:
        req_data = request.json
        crop = req_data.get('crop', 'Wheat')
        season = req_data.get('season', 'Summer')
        demand = req_data.get('demand', 'Medium')
        quantity = float(req_data.get('quantity', 100))
        current_price = float(req_data.get('currentPrice', 30.0))
        
        # Handle unseen labels gracefully by defaulting to 0 or first class
        try:
            crop_encoded = label_encoders['Crop'].transform([crop])[0]
        except ValueError:
            crop_encoded = 0
            
        try:
            season_encoded = label_encoders['Season'].transform([season])[0]
        except ValueError:
            season_encoded = 0
            
        try:
            demand_encoded = label_encoders['Demand'].transform([demand])[0]
        except ValueError:
            demand_encoded = 1 # Medium is usually index 1 or 2
            
        features = np.array([[crop_encoded, season_encoded, demand_encoded, quantity, current_price]])
        
        predicted = model.predict(features)[0]
        
        # Calculate trend
        diff = predicted - current_price
        trend = "up" if diff > 0 else "down"
        percentage = abs(diff / current_price) * 100
        
        # Generate dummy trend graph data (next 7 days projection)
        trend_graph = []
        curr = current_price
        for i in range(1, 8):
            step = diff / 7.0
            # add small noise
            val = curr + (step * i) + random.uniform(-1, 1)
            trend_graph.append({ "day": f"Day {i}", "price": round(val, 2) })
            
        return jsonify({
            "predictedPrice": round(predicted, 2),
            "trend": trend,
            "percentageChange": round(percentage, 2),
            "trendGraph": trend_graph,
            "recommendation": "Sell now" if trend == "down" else "Hold for better price"
        })
        
    except Exception as e:
        print("Prediction Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/ml/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": "RandomForestRegressor loaded"})

if __name__ == '__main__':
    # Run Flask on port 5001 to not conflict with Node.js on 5000
    app.run(port=5001, debug=True)
