import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { userProgressService } from "@/shared/services/userProgressService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "./../../../shared/components/ui/button";
import { Progress } from "./../../../shared/components/ui/progress";
import { Badge } from "./../../../shared/components/ui/badge";
import { 
  ClipboardList, GraduationCap, Building2, TrendingUp, 
  Award, Target, CheckCircle2, ArrowRight, History, 
  Sparkles, Zap, Trophy, Clock, Calendar, Activity, Briefcase
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, Legend } from "recharts";

// This is the correct way — named export + const arrow function
export const Dashboard = () => {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState(
    userProgressService.getDefaultProgress()
  );
  const [isVisible, setIsVisible] = useState(false);

  // Load user progress on mount and when user changes
  useEffect(() => {
    if (user?.id || user?.email) {
      const userId = user.id || user.email;
      const progress = userProgressService.getProgress(userId);
      setUserProgress(progress);
    }
    // Trigger animations
    setIsVisible(true);
  }, [user]);

  // Main journey steps (for progress tracking)
  const journeySteps = [
    {
      title: "Start Career Quiz",
      description: "Discover your perfect career path with our AI quiz",
      icon: ClipboardList,
      link: "/quiz-intro",
      color: "from-blue-500 to-blue-600",
      completed: userProgress.quizCompleted,
      stats: "15 min"
    },
    {
      title: "Degree Recommendations",
      description: "View personalized degree suggestions",
      icon: GraduationCap,
      link: "/degrees",
      color: "from-purple-500 to-purple-600",
      completed: userProgress.degreeRecommendationsViewed,
      stats: "10+ options"
    },
    {
      title: "University Insights",
      description: "Explore top universities for your profile",
      icon: Building2,
      link: "/universities",
      color: "from-orange-500 to-orange-600",
      completed: userProgress.universityInsightsViewed,
      stats: "50+ unis"
    }
  ];

  // Additional quick access (not part of progress)
  const quickLinks = [
    {
      title: "Quiz History",
      description: "View all your past quiz attempts",
      icon: History,
      link: "/quiz-history",
      color: "from-teal-500 to-teal-600"
    }
  ];

  // Calculate completion percentage (only from journey steps)
  const completedCount = journeySteps.filter(step => step.completed).length;
  const totalCount = journeySteps.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  // Data for progress chart
  const progressData = [
    { name: 'Completed', value: completedCount, color: '#10b981' },
    { name: 'Remaining', value: totalCount - completedCount, color: '#e5e7eb' }
  ];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Icon mapping for activity types
  const iconMap = {
    ClipboardList,
    CheckCircle: CheckCircle2,
    GraduationCap,
    Building2,
    Briefcase: Briefcase,
    History,
    Activity
  };

  // Get recent activities from userProgressService
  const getRecentActivities = () => {
    if (!user) return [];
    
    const userId = user.id || user.email;
    const activities = userProgressService.getRecentActivities(userId, 5);
    
    // Map activities to component format with icons and time formatting
    return activities.map(activity => ({
      icon: iconMap[activity.icon] || Activity,
      text: activity.description,
      time: formatTimeAgo(activity.timestamp),
      color: activity.color
    }));
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  const recentActivities = getRecentActivities();

  return (
    <div className="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track your progress and continue your career discovery journey
          </p>
        </div>

        {/* Progress Overview with Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Chart */}
          <Card className="lg:col-span-2 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Your Exploration Progress
              </CardTitle>
              <CardDescription>Track your journey towards career clarity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-48 h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold text-primary">{completionPercentage}%</p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  {journeySteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white flex-shrink-0`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">{step.title}</p>
                          {step.completed && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <Progress 
                          value={step.completed ? 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 3).map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${activity.color} flex-shrink-0`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.text}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No activities yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start exploring to see your activity here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Journey Steps */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Career Discovery Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journeySteps.map((step, index) => (
              <Link key={index} to={step.link}>
                <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 border-2 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center text-white`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      {step.completed && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{step.stats}</span>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary group-hover:text-white">
                        {step.completed ? 'Review' : 'Start'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Link key={index} to={link.link}>
                <Card className="hover:shadow-lg transition-all hover:border-primary/50 border-2 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${link.color} flex items-center justify-center text-white mb-3`}>
                      <link.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold mb-1">{link.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary group-hover:text-white">
                      Open <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
