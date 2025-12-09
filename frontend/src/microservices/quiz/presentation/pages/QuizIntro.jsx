import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { userProgressService } from "@/shared/services/userProgressService";
import { useQuizStore } from "../../application/quizStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { Brain, Clock, Target, Lightbulb, Users, Wrench, Briefcase, Palette, UserCheck, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function QuizIntro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  
  const handleStartQuiz = () => {
    if (user) {
      const userId = user.id || user.email;
      userProgressService.logActivity(userId, {
        type: 'quiz_started',
        description: 'Started Career Assessment Quiz',
        icon: 'ClipboardList',
        color: 'text-blue-500'
      });
    }
    // Clear any previous quiz state before navigating to quiz questions page
    useQuizStore.getState().reset();
    navigate('/quiz');
  };
  const riasecTypes = [
    {
      icon: Wrench,
      title: "Realistic",
      color: "text-blue-600",
      bg: "bg-blue-100",
      description: "Hands-on, practical work"
    },
    {
      icon: Brain,
      title: "Investigative",
      color: "text-purple-600",
      bg: "bg-purple-100",
      description: "Research and analysis"
    },
    {
      icon: Palette,
      title: "Artistic",
      color: "text-pink-600",
      bg: "bg-pink-100",
      description: "Creative expression"
    },
    {
      icon: Users,
      title: "Social",
      color: "text-green-600",
      bg: "bg-green-100",
      description: "Helping others"
    },
    {
      icon: Briefcase,
      title: "Enterprising",
      color: "text-orange-600",
      bg: "bg-orange-100",
      description: "Leadership & business"
    },
    {
      icon: UserCheck,
      title: "Conventional",
      color: "text-teal-600",
      bg: "bg-teal-100",
      description: "Organization & detail"
    }
  ];

  const benefits = [
    "Discover careers that match your personality",
    "Get personalized degree recommendations",
    "Understand your strengths and interests",
    "Make informed educational decisions"
  ];

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Gamified Career Interest Quiz</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Discover your ideal career path through our AI-powered assessment based on the RIASEC model
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.history.back()} 
              className="self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* What to Expect Card */}
        <Card className="mb-8 border-2 border-primary/20 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">What to Expect</CardTitle>
            <CardDescription>A fun, interactive quiz designed to understand your interests and personality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quiz Info Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="font-semibold">10-15 Minutes</div>
                <div className="text-sm text-muted-foreground">Estimated time</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <Target className="w-8 h-8 mx-auto mb-2 text-secondary" />
                <div className="font-semibold">30 Questions</div>
                <div className="text-sm text-muted-foreground">Scenario-based</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-accent" />
                <div className="font-semibold">AI-Powered</div>
                <div className="text-sm text-muted-foreground">Smart insights</div>
              </div>
            </div>

            {/* RIASEC Types */}
            <div>
              <h3 className="font-semibold mb-4 text-center">We'll Measure 6 Career Personality Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {riasecTypes.map((type, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center p-4 rounded-xl bg-card border-2 hover:border-primary/50 transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className={`w-14 h-14 rounded-full ${type.bg} flex items-center justify-center mb-2`}>
                      <type.icon className={`w-7 h-7 ${type.color}`} />
                    </div>
                    <div className="font-semibold text-sm text-center">{type.title}</div>
                    <div className="text-xs text-muted-foreground text-center">{type.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6">
              <h3 className="font-semibold mb-4">What You'll Get:</h3>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Details (Expandable) */}
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    Tips for Best Results:
                  </h4>
                  <ul className="space-y-2 text-sm ml-7">
                    <li>• Answer honestly based on your true preferences</li>
                    <li>• Don't overthink - go with your first instinct</li>
                    <li>• There are no right or wrong answers</li>
                    <li>• You can retake the quiz anytime</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={handleStartQuiz}
              >
                Start Quiz Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide Details" : "Learn More"}
              </Button>
            </div>

            {/* Progress Badge */}
            <div className="text-center">
              <Badge variant="outline" className="text-sm">
                <Progress value={0} className="w-16 h-2 mr-2" />
                0% Complete
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Your responses are private and will only be used to generate personalized recommendations</p>
        </div>
      </div>
    </div>
  );
}