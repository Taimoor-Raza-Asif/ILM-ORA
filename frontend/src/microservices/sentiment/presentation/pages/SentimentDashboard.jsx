// sentiment/presentation/pages/SentimentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Star, ArrowLeft, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export function SentimentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedField, setSelectedField] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");

  // Real data from your AI model
  const [sentimentData, setSentimentData] = useState([]);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [recentReviews, setRecentReviews] = useState([]);

  // Fetch all reviews + analyze with your model
  const loadSentiment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get all reviews from your DB (you already have this endpoint)
      const res = await fetch(`${API_BASE}/api/reviews?field=${selectedField}&city=${selectedCity}`);
      const reviews = await res.json();

      if (!reviews || reviews.length === 0) {
        setSentimentData([]);
        setOverallRating(0);
        setTotalReviews(0);
        setRecentReviews([]);
        setLoading(false);
        return;
      }

      // 2. Send to your AI sentiment service
      const analysis = await fetch(`${API_BASE}/api/sentiment/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: reviews.map(r => ({
            review_text: r.text,
            factor: r.factor || "General",
            university: r.universityName,
            city: r.city || "Pakistan"
          }))
        })
      }).then(r => r.json());

      // Map to your chart format
      const categories = ["Academics", "Faculty", "Campus Life", "Facilities", "Placements"];
      const colors = ["#1976D2", "#0D47A1", "#2196F3", "#FB8C00", "#FFA726"];
      const mappedData = categories.map((cat, i) => ({
        category: cat,
        score: analysis.ratingBreakdown[i] || 0,
        color: colors[i]
      }));

      setSentimentData(mappedData);
      setOverallRating(analysis.overallRating);
      setTotalReviews(analysis.totalReviews);
      setRecentReviews(reviews.slice(0, 5)); // show latest 5

    } catch (err) {
      console.error(err);
      setError("Failed to load sentiment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSentiment();
  }, [selectedField, selectedCity]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Analyzing thousands of student reviews with AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <Button variant="ghost" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Sentiment Analytics</h1>
            {overallRating > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                <span className="text-2xl font-bold">{overallRating}</span>
                <span className="text-muted-foreground">/5.0</span>
                <span className="text-sm text-muted-foreground">({totalReviews} reviews)</span>
              </div>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            AI-powered sentiment analysis from real Pakistani university students
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="eng">Engineering</SelectItem>
                  <SelectItem value="med">Medical</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="islamabad">Islamabad</SelectItem>
                  <SelectItem value="lahore">Lahore</SelectItem>
                  <SelectItem value="karachi">Karachi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Categories</CardTitle>
              <CardDescription>Average ratings across student experience dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              {sentimentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={sentimentData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="category" tick={{ fontWeight: 600 }} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontWeight: 600 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid #1976D2',
                        borderRadius: '12px',
                        fontWeight: 600
                      }}
                    />
                    <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                      {sentimentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  No reviews yet for selected filters
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Student Feedback</CardTitle>
              <CardDescription>Latest verified reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReviews.length > 0 ? recentReviews.map((review, i) => (
                  <div key={i} className="p-5 bg-muted/50 rounded-xl border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge variant="secondary" className="mb-2">{review.universityName}</Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={`w-4 h-4 ${j < Math.round(review.predictedRating || 4) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">
                            {review.factor}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">No reviews yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}