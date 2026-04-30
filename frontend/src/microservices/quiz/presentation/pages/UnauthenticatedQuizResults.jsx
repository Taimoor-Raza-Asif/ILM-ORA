import React from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Award, Lock, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useQuizStore } from "../../application/quizStore";

/**
 * UnauthenticatedQuizResults
 * 
 * Shown to users who completed the quiz but are NOT logged in.
 * Displays limited quiz info and gives options to:
 * - Sign Up (if no account)
 * - Log In (if has account)
 * - Go Back to Dashboard
 */
export function UnauthenticatedQuizResults() {
  const navigate = useNavigate();
  const { scores } = useQuizStore();

  // Determine Primary Type for display
  const topTypeKey = scores?.holland_code?.[0]; // e.g. "R"
  const typeMap = {
    R: "Realistic",
    I: "Investigative",
    A: "Artistic",
    S: "Social",
    E: "Enterprising",
    C: "Conventional"
  };
  const primaryTypeName = typeMap[topTypeKey] || "Unknown";

  const typeDescriptions = {
    Investigative: {
      title: "The Thinker",
      description: "You enjoy working with ideas and thinking. You like to search for facts and figure out problems mentally.",
    },
    Enterprising: {
      title: "The Persuader",
      description: "You like to work with people and data. You enjoy leading and making decisions.",
    },
    Realistic: {
      title: "The Doer",
      description: "You like to work with things and tools. You enjoy practical, hands-on work.",
    },
    Artistic: {
      title: "The Creator",
      description: "You value self-expression and originality. You enjoy unstructured environments where you can create.",
    },
    Social: {
      title: "The Helper",
      description: "You enjoy assisting, teaching, or counseling others. You are empathetic and skilled at communication.",
    },
    Conventional: {
      title: "The Organizer",
      description: "You like structure and order. You enjoy working with data, numbers, and clear procedures.",
    }
  };

  const personalityInfo = typeDescriptions[primaryTypeName];

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 shadow-xl">
            <Award className="w-10 h-10 text-white" />
          </div>
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-lg px-4 py-2">
            <Sparkles className="w-5 h-5 mr-2" />
            Quiz Completed
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Quiz Complete!</h1>
          <p className="text-xl text-muted-foreground">Your Holland Code: <span className="font-bold text-primary">{scores?.holland_code}</span></p>
        </motion.div>

        {/* Limited Preview of Results */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-2 border-primary/30 shadow-xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-2xl">
                  <span className="text-4xl">🎯</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <Badge className="mb-2 bg-primary">Your Primary Type</Badge>
                  <h2 className="text-3xl font-bold mb-2">{primaryTypeName} - {personalityInfo?.title}</h2>
                  <p className="text-muted-foreground">{personalityInfo?.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Locked Features Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-amber-900">Full Results Locked</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 mb-4">
                To unlock your complete career recommendations, detailed personality analysis, and personalized career paths, please log in or create an account.
              </p>
              <div className="space-y-2 text-sm text-amber-700">
                <p>✓ Detailed RIASEC Profile Analysis</p>
                <p>✓ Personalized Career Recommendations (Top 5)</p>
                <p>✓ Degree Program Recommendations</p>
                <p>✓ Career Salary Insights</p>
                <p>✓ Save Quiz Results & History</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Auth Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-primary/30">
            <CardHeader>
              <CardTitle>Continue to View Full Results</CardTitle>
              <CardDescription>Choose your preferred option below</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 rounded-xl shadow-lg"
                >
                  Log In to Your Account
                </Button>
                
                <Button
                  onClick={() => navigate("/auth")}
                  size="lg"
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  Create New Account
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate("/")}
                  size="lg"
                  variant="ghost"
                  className="w-full rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-sm text-muted-foreground"
        >
          <p>
            Your quiz progress is saved. Log in anytime to continue and view your full results.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
