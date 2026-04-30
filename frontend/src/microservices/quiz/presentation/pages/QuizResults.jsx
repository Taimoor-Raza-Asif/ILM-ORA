import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { userProgressService } from "@/shared/services/userProgressService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Brain, TrendingUp, Award, RefreshCw, ArrowRight, Download, Share2, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

// Import the Store and Service
import { quizService } from "../../application/quizService";
import { useQuizStore } from "../../application/quizStore";
import { careerService } from "../../../career/application/careerService";
import { UnauthenticatedQuizResults } from "./UnauthenticatedQuizResults";

export function QuizResults() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  
  // 1. Get State from Store instead of LocalStorage
  const { scores, sessionId, isLoading, error, studentBackground } = useQuizStore();
  
  // State for recommended careers
  const [recommendedCareers, setRecommendedCareers] = useState([]);

  // If user is NOT authenticated and quiz is complete, show limited results page
  if (!isAuthenticated && scores) {
    return <UnauthenticatedQuizResults />;
  }

  // 2. Fetch results if missing (e.g., on page refresh or viewing from history)
  useEffect(() => {
    // Check if session ID is provided in URL params (from quiz history)
    const urlSessionId = searchParams.get('session');
    const targetSessionId = urlSessionId || sessionId;
    
    if (!scores && targetSessionId) {
      quizService.getFinalResults(targetSessionId);
    } else if (!scores && !targetSessionId) {
      // If no session exists, redirect to start
      navigate("/quiz-intro"); 
    }
  }, [scores, sessionId, searchParams, navigate]);

  // 3. Mark quiz as completed when results are loaded
  useEffect(() => {
    if (scores && sessionId && user) {
      const userId = user.id || user.email;
      userProgressService.markQuizCompleted(userId, {
        sessionId: sessionId,
        hollandCode: scores.holland_code,
        completedAt: new Date().toISOString()
      });
      userProgressService.logActivity(userId, {
        type: 'quiz_completed',
        description: 'Completed Career Assessment Quiz',
        icon: 'CheckCircle',
        color: 'text-green-500'
      });
      console.log('✅ Quiz completion tracked for user:', userId);
    }
  }, [scores, sessionId, user]);

  // 4. Fetch recommended careers based on Holland code and student background
  useEffect(() => {
    async function fetchRecommendedCareers() {
      if (!scores || !scores.holland_code) return;

      try {
        const data = await careerService.getAll();
        const allCareers = data.careers || data || [];
        
        // Map Holland codes to career keywords
        const hollandCareerMap = {
          R: ['engineer', 'mechanic', 'pilot', 'architect', 'technician', 'electrician', 'carpenter', 'plumber'],
          I: ['scientist', 'researcher', 'analyst', 'data', 'laboratory', 'pharmacist', 'doctor', 'physician', 'surgeon'],
          A: ['designer', 'artist', 'writer', 'musician', 'creative', 'graphic', 'ui', 'ux', 'photographer'],
          S: ['teacher', 'nurse', 'counselor', 'social worker', 'hr', 'human resource', 'therapist', 'coach'],
          E: ['manager', 'director', 'executive', 'entrepreneur', 'sales', 'marketing', 'ceo', 'business', 'consultant'],
          C: ['accountant', 'clerk', 'administrator', 'finance', 'banking', 'auditor', 'bookkeeper', 'secretary']
        };

        // Define medical field keywords to filter out
        const medicalKeywords = ['doctor', 'physician', 'surgeon', 'medical', 'medicine', 'healthcare', 'clinical', 'nurse', 'pharmacist'];
        
        // Define engineering keywords to filter out
        const engineeringKeywords = ['engineer', 'engineering', 'mechanic', 'technician', 'electrician'];

        // Get student's background
        const userGroup = studentBackground?.group?.toLowerCase() || '';
        
        // Determine what to filter based on background
        let shouldFilterMedical = false;
        let shouldFilterEngineering = false;
        
        // If NOT Pre-Medical background, exclude medical careers
        if (userGroup && !userGroup.includes('pre-medical') && !userGroup.includes('pre medical')) {
          shouldFilterMedical = true;
        }
        
        // If ICS or ICOM background, exclude both engineering and medical
        if (userGroup && (userGroup.includes('ics') || userGroup.includes('i.c.s') || 
            userGroup.includes('icom') || userGroup.includes('i.com'))) {
          shouldFilterMedical = true;
          shouldFilterEngineering = true;
        }

        // Get top 3 Holland codes
        const primaryCode = scores.holland_code[0];
        const secondaryCode = scores.holland_code[1] || '';
        const tertiaryCode = scores.holland_code[2] || '';

        // Get keywords for the top codes
        const primaryKeywords = hollandCareerMap[primaryCode] || [];
        const secondaryKeywords = hollandCareerMap[secondaryCode] || [];
        const tertiaryKeywords = hollandCareerMap[tertiaryCode] || [];

        // Filter and score careers
        const scoredCareers = allCareers.map(career => {
          const title = career.job_title.toLowerCase();
          let score = 0;

          // Apply background-based filtering
          if (shouldFilterMedical && medicalKeywords.some(keyword => title.includes(keyword))) {
            return { ...career, matchScore: 0 }; // Exclude medical careers
          }
          
          if (shouldFilterEngineering && engineeringKeywords.some(keyword => title.includes(keyword))) {
            return { ...career, matchScore: 0 }; // Exclude engineering careers
          }

          // Check primary code matches (highest priority)
          if (primaryKeywords.some(keyword => title.includes(keyword))) {
            score += 3;
          }
          // Check secondary code matches
          if (secondaryKeywords.some(keyword => title.includes(keyword))) {
            score += 2;
          }
          // Check tertiary code matches
          if (tertiaryKeywords.some(keyword => title.includes(keyword))) {
            score += 1;
          }

          return { ...career, matchScore: score };
        });

        // Filter careers with score > 0 and sort by score
        const matchedCareers = scoredCareers
          .filter(career => career.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 5); // Get top 5

        setRecommendedCareers(matchedCareers);
      } catch (error) {
        console.error('Failed to fetch recommended careers:', error);
      }
    }

    fetchRecommendedCareers();
  }, [scores, studentBackground]);

  if (isLoading || !scores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-3">Generating your career profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate("/quiz-intro")}>Try Again</Button>
      </div>
    );
  }

  // 3. Process Data from Python Backend
  // Backend returns: { dimension_averages: { R: 4.5, ... }, holland_code: "RIA" }
  
  const radarData = [
    { type: "Realistic", score: Math.round((scores.dimension_averages.R / 5) * 100) },
    { type: "Investigative", score: Math.round((scores.dimension_averages.I / 5) * 100) },
    { type: "Artistic", score: Math.round((scores.dimension_averages.A / 5) * 100) },
    { type: "Social", score: Math.round((scores.dimension_averages.S / 5) * 100) },
    { type: "Enterprising", score: Math.round((scores.dimension_averages.E / 5) * 100) },
    { type: "Conventional", score: Math.round((scores.dimension_averages.C / 5) * 100) }
  ];

  const barData = radarData.map(item => ({ ...item })).sort((a, b) => b.score - a.score);
  
  // Determine Primary Type
  const topTypeKey = scores.holland_code[0]; // e.g. "R"
  const typeMap = { R: "Realistic", I: "Investigative", A: "Artistic", S: "Social", E: "Enterprising", C: "Conventional" };
  const primaryTypeName = typeMap[topTypeKey];
  const primaryTypeScore = radarData.find(d => d.type === primaryTypeName)?.score || 0;

  const typeDescriptions = {
    Investigative: {
      title: "The Thinker",
      description: "You enjoy working with ideas and thinking. You like to search for facts and figure out problems mentally. You're analytical, intellectual, and curious.",
      careers: ["Scientist", "Engineer", "Researcher", "Data Analyst", "Mathematician"]
    },
    Enterprising: {
      title: "The Persuader",
      description: "You like to work with people and data. You enjoy leading and making decisions. You're ambitious, adventurous, and energetic.",
      careers: ["Entrepreneur", "Manager", "Sales Executive", "Lawyer", "Marketing Director"]
    },
    Realistic: {
      title: "The Doer",
      description: "You like to work with things and tools. You enjoy practical, hands-on work. You're practical, mechanical, and prefer working with objects.",
      careers: ["Engineer", "Architect", "Mechanic", "Pilot", "Chef"]
    },
    Artistic: {
        title: "The Creator",
        description: "You value self-expression and originality. You enjoy unstructured environments where you can create art, music, or new ideas.",
        careers: ["Graphic Designer", "Writer", "Musician", "Actor", "Architect"]
    },
    Social: {
        title: "The Helper",
        description: "You enjoy assisting, teaching, or counseling others. You are empathetic, patient, and skilled at communication.",
        careers: ["Teacher", "Counselor", "Nurse", "Social Worker", "HR Manager"]
    },
    Conventional: {
        title: "The Organizer",
        description: "You like structure and order. You enjoy working with data, numbers, and clear procedures.",
        careers: ["Accountant", "Data Entry", "Financial Analyst", "Librarian", "Banker"]
    }
  };

  const personalityInfo = typeDescriptions[primaryTypeName] || typeDescriptions.Investigative;

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 md:mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 shadow-xl">
            <Award className="w-10 h-10 text-white" />
          </div>
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-4 py-2">
            <Sparkles className="w-5 h-5 mr-2" />
            Profile Complete
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Career Profile</h1>
          <p className="text-xl text-muted-foreground">Based on your Holland Code: <span className="font-bold text-primary">{scores.holland_code}</span></p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="mb-8 border-2 border-primary/30 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-2xl">
                  <Brain className="w-16 h-16" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <Badge className="mb-2 bg-primary">Your Primary Type</Badge>
                  <h2 className="text-3xl font-bold mb-2">{primaryTypeName} - {personalityInfo.title}</h2>
                  <p className="text-muted-foreground mb-4">{personalityInfo.description}</p>
                  <div className="text-4xl font-bold text-primary">{primaryTypeScore}% Match</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>RIASEC Profile</CardTitle>
                <CardDescription>Your scores across all six personality types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" strokeWidth={2} />
                    <PolarAngleAxis dataKey="type" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Radar name="Score" dataKey="score" stroke="#1976D2" fill="#1976D2" fillOpacity={0.5} strokeWidth={3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Ranked Scores</CardTitle>
                <CardDescription>Your personality types from highest to lowest</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeWidth={1.5} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--foreground))", fontWeight: 600 }} />
                    <YAxis dataKey="type" type="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #1976D2", borderRadius: "12px", fontWeight: 600 }} />
                    <Bar dataKey="score" fill="#FB8C00" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Recommended Career Paths
              </CardTitle>
              <CardDescription>
                Based on your {primaryTypeName} profile {recommendedCareers.length > 0 ? `(${scores.holland_code})` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendedCareers.length > 0 ? (
                <div className="grid md:grid-cols-5 gap-4">
                  {recommendedCareers.map((career, index) => (
                    <div key={index} className="p-4 bg-card rounded-xl border-2 border-border hover:border-primary/50 transition-all cursor-pointer group">
                      <div className="text-2xl mb-2">💼</div>
                      <div className="font-medium text-sm mb-2">{career.job_title}</div>
                      <div className="text-xs text-muted-foreground">{career.median_salary}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Finding your perfect career matches...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg" onClick={() => navigate("/degrees")}>
            View Degree Recommendations
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate("/careers")}>Explore Careers</Button>
          <Button size="lg" variant="outline" className="rounded-xl" onClick={() => navigate("/quiz-intro")}>
            <RefreshCw className="mr-2 w-5 h-5" />
            Retake Quiz
          </Button>
        </div>
      </div>
    </div>
  );
}