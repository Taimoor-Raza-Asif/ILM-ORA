# Python-based Sentiment Service for DeBERTA Model
# This replaces the JavaScript @xenova/transformers approach

import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import numpy as np
from functools import lru_cache

app = Flask(__name__)
CORS(app)

# Model configuration
MODEL_NAME = "AbdullahGhani/Unidatamodel"  # Your Hugging Face model

# Load model and tokenizer
print("Loading model from Hugging Face...")
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=1,
        problem_type="regression"
    )
    model.eval()
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Please ensure the model files are not corrupted")
    model = None
    tokenizer = None

# Factor mapping
FACTOR_MAP = {
    'academics': 'Academics',
    'faculty': 'Faculty',
    'campus life': 'Campus Life',
    'facilities': 'Facilities',
    'infrastructure': 'Facilities',
    'hostel': 'Facilities',
    'hostels': 'Facilities',
    'placement': 'Placements',
    'placements': 'Placements',
    'career': 'Placements',
    'jobs': 'Placements',
}

def normalize_factor(factor):
    """Normalize factor names to match your database"""
    factor_map = {
        'overall': 'Overall',
        'faculty': 'Faculty',
        'campus': 'Campus',
        'labs': 'Labs',
        'cafeteria': 'Cafeteria',
        'management': 'Management',
        'sports': 'Sports',
        'hostels': 'Hostels',
        'resources': 'Resources'
    }
    return factor_map.get(factor.lower(), 'Overall')

def predict_rating(review_text, factor, university, city):
    """Predict rating for a single review"""
    if model is None or tokenizer is None:
        raise Exception("Model not loaded")
    
    # Format input like training
    factor_norm = normalize_factor(factor)
    input_text = f"[{factor_norm}] ({university}, {city}): {review_text}"
    
    # Tokenize
    inputs = tokenizer(
        input_text,
        return_tensors="pt",
        truncation=True,
        max_length=256
    )
    
    # Predict
    with torch.no_grad():
        outputs = model(**inputs)
        prediction = outputs.logits.item()
    
    # Clip to 1-5 range
    prediction = max(1.0, min(5.0, prediction))
    return round(prediction, 2)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict rating for a single review"""
    try:
        data = request.json
        
        review_text = data.get('review_text')
        factor = data.get('factor', 'General')
        university = data.get('university', '')
        city = data.get('city', '')
        
        if not review_text:
            return jsonify({'error': 'review_text is required'}), 400
        
        rating = predict_rating(review_text, factor, university, city)
        
        return jsonify({
            'rating': rating,
            'factor': normalize_factor(factor)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Predict ratings for multiple reviews"""
    try:
        data = request.json
        reviews = data.get('reviews', [])
        
        if not reviews:
            return jsonify({'error': 'reviews array is required'}), 400
        
        predictions = []
        for review in reviews:
            rating = predict_rating(
                review.get('review_text', ''),
                review.get('factor', 'General'),
                review.get('university', ''),
                review.get('city', '')
            )
            predictions.append(rating)
        
        # Calculate statistics
        factor_groups = {}
        for i, review in enumerate(reviews):
            factor = normalize_factor(review.get('factor', 'General'))
            if factor not in factor_groups:
                factor_groups[factor] = []
            factor_groups[factor].append(predictions[i])
        
        # Rating breakdown
        ordered_factors = ['Overall', 'Faculty', 'Campus', 'Labs', 'Cafeteria', 'Management', 'Sports', 'Hostels', 'Resources']
        rating_breakdown = {}
        for factor in ordered_factors:
            if factor in factor_groups:
                rating_breakdown[factor] = round(
                    sum(factor_groups[factor]) / len(factor_groups[factor]), 2
                )
            else:
                rating_breakdown[factor] = 0
        
        # Overall rating
        overall_rating = round(sum(predictions) / len(predictions), 2)
        
        # Star distribution
        star_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for pred in predictions:
            star = round(pred)
            if 1 <= star <= 5:
                star_counts[star] += 1
        
        total = len(predictions)
        review_distribution = {
            star: round((count / total) * 100, 1)
            for star, count in star_counts.items()
        }
        
        return jsonify({
            'overall_rating': overall_rating,
            'rating_breakdown': rating_breakdown,
            'review_distribution': review_distribution,
            'total_reviews': total,
            'predictions': predictions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    print("\n" + "=" * 60)
    print("University Sentiment Service (Python)")
    print("=" * 60)
    print(f"Running on http://0.0.0.0:{port}")
    print("    (Node.js backend uses port 3005)")
    if model is None:
        print("WARNING: Model failed to load; /predict will return errors until fixed.")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
