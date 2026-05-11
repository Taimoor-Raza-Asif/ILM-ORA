import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "./../../../shared/components/ui/button";
import { Card } from "./../../../shared/components/ui/card";
import { ArrowRight, Brain, Target, TrendingUp, Users, Award, Globe } from "lucide-react";
import { ImageWithFallback } from "./../../../shared/components/ImageWithFallback";
import landingPageImage from "./../../../shared/assets/landingPageImage.png";
export function LandingPage() {
  const features = [{
    icon: Brain,
    title: "AI-Powered Recommendations",
    description: "Get personalized degree and university suggestions based on advanced AI algorithms"
  }, {
    icon: Target,
    title: "Career-Focused Quiz",
    description: "Take our gamified RIASEC quiz to discover your perfect career path"
  }, {
    icon: TrendingUp,
    title: "Career Insights",
    description: "Explore salary trends, growth rates, and career opportunities"
  }, {
    icon: Users,
    title: "Student Sentiments",
    description: "Read real reviews and sentiments from current students and alumni"
  }, {
    icon: Award,
    title: "Scholarship Finder",
    description: "Discover scholarships that match your profile and goals"
  }, {
    icon: Globe,
    title: "University Database",
    description: "Access comprehensive information about universities worldwide"
  }];
  const stats = [{
    value: "500+",
    label: "Universities"
  }, {
    value: "1000+",
    label: "Degree Programs"
  }, {
    value: "50K+",
    label: "Students Helped"
  }, {
    value: "98%",
    label: "Satisfaction Rate"
  }];
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">AI-Powered Career Guidance</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Find Your Perfect <span className="text-primary">Degree</span> & <span className="text-secondary">University</span> with AI
              </h1>
              <p className="text-xl text-muted-foreground">Discover your ideal career path with our intelligent recommendation system. Take the quiz, explore universities, and make informed decisions about your future.</p>

              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    Start Your Journey
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/universities">
                  <Button size="lg" variant="outline" className="rounded-xl hover:scale-105 transition-all">Explore Universities</Button>
                </Link>
              </div>

              <div className="flex gap-8 pt-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-end">
              <div className="relative z-10 pl-8">
                <ImageWithFallback
                  src={landingPageImage}
                  alt="Students studying"
                  className=""
                />
              </div>

              <div className="absolute top-10 -right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-secondary/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose ILM-ORA?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Our platform combines cutting-edge AI technology with comprehensive university data to guide your educational journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary/50">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to Start Your Journey?</h2>
          <p className="text-xl text-muted-foreground">Join thousands of students who found their perfect match with ILM-ORA</p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
              Get Started Free
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}