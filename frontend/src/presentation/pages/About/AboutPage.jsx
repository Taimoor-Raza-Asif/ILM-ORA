import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./../../../shared/components/ui/card";
import { Button } from "./../../../shared/components/ui/button";
import { Input } from "./../../../shared/components/ui/input";
import { Textarea } from "./../../../shared/components/ui/textarea";
import { Label } from "./../../../shared/components/ui/label";
import { Mail, Github, Linkedin, Twitter, Users, Target, Heart, Send, CheckCircle2, AlertCircle, Loader2, Phone, MessageSquare, Sparkles, Award, TrendingUp, Database, GraduationCap, Briefcase, Building2, ClipboardList, Globe } from "lucide-react";
import { axiosClient } from "@/shared/utils/axiosClient";
import { motion } from "framer-motion";

export function AboutPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await axiosClient.post('/contact/submit', formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const team = [{
    name: "Taimoor Raza Asif",
    role: "Full Stack Developer",
    img: ""
  }, {
    name: "Hamza Aftab",
    role: "UX Designer",
    img: ""
  }, {
    name: "Abdullah Ghani",
    role: "Data Scientist",
    img: ""
  }];

  const stats = [
    { icon: Users, value: "50,000+", label: "Students Helped" },
    { icon: Award, value: "500+", label: "Universities" },
    { icon: TrendingUp, value: "95%", label: "Success Rate" },
    { icon: Sparkles, value: "4.8/5", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {/* <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            About ILM-ORA
          </h1> */}
          <p className="text-lg text-muted-foreground max-w-2xl mt-8 mx-auto">
            Empowering students to make informed decisions about their educational journey
          </p>
        </motion.div>

        {/* Mission, Values, Impact - Horizontal Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="border-l-4 border-l-primary hover:shadow-md transition-all p-6 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Our Mission</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Democratizing access to quality education through intelligent university matching
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="border-l-4 border-l-purple-600 hover:shadow-md transition-all p-6 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Our Values</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Student-first approach with data-driven insights and educational excellence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card className="border-l-4 border-l-accent hover:shadow-md transition-all p-6 h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Our Impact</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Guiding 50,000+ students to their ideal university and career paths
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Data Sources Section */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 tracking-wide uppercase">
              <Database className="w-3.5 h-3.5" />
              How we built the platform
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Our Data Sources
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every recommendation on ILM-ORA is powered by curated, real-world data. Here's where each module gets its information from.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: GraduationCap,
                title: "Scholarships",
                subtitle: "Funding opportunities",
                sources: ["EduVision"],
                description: "Bachelor-level scholarship listings, eligibility criteria and deadlines curated from EduVision's scholarship directory.",
                gradient: "from-blue-500 to-indigo-600",
                ring: "ring-blue-500/20",
                chipBg: "bg-blue-50 dark:bg-blue-950/40",
                chipText: "text-blue-700 dark:text-blue-300",
                chipBorder: "border-blue-200 dark:border-blue-900"
              },
              {
                icon: Briefcase,
                title: "Career & Salary",
                subtitle: "Compensation insights",
                sources: ["PayScale"],
                description: "Role-wise salary benchmarks, growth trends and compensation ranges sourced from PayScale to power career insights.",
                gradient: "from-purple-500 to-fuchsia-600",
                ring: "ring-purple-500/20",
                chipBg: "bg-purple-50 dark:bg-purple-950/40",
                chipText: "text-purple-700 dark:text-purple-300",
                chipBorder: "border-purple-200 dark:border-purple-900"
              },
              {
                icon: Building2,
                title: "Universities",
                subtitle: "Programs & profiles",
                sources: ["EduVision", "University Sites"],
                description: "University profiles and program details aggregated from EduVision and augmented by scraping official university websites.",
                gradient: "from-emerald-500 to-teal-600",
                ring: "ring-emerald-500/20",
                chipBg: "bg-emerald-50 dark:bg-emerald-950/40",
                chipText: "text-emerald-700 dark:text-emerald-300",
                chipBorder: "border-emerald-200 dark:border-emerald-900"
              },
              {
                icon: ClipboardList,
                title: "Student Reviews",
                subtitle: "Factor-based sentiment",
                sources: ["Google Survey", "Uni Groups", "LinkedIn"],
                description: "Factor-wise sentiment reviews gathered via a Google survey circulated across university student groups and LinkedIn pages.",
                gradient: "from-amber-500 to-orange-600",
                ring: "ring-amber-500/20",
                chipBg: "bg-amber-50 dark:bg-amber-950/40",
                chipText: "text-amber-700 dark:text-amber-300",
                chipBorder: "border-amber-200 dark:border-amber-900"
              }
            ].map((source, index) => {
              const Icon = source.icon;
              return (
                <motion.div
                  key={source.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  viewport={{ once: true }}
                  className="h-full"
                >
                  <Card className="group relative overflow-hidden h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-border/60">
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${source.gradient}`} />
                    <CardContent className="p-6 flex flex-col h-full items-start">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${source.gradient} flex items-center justify-center mb-5 shadow-lg ring-4 ${source.ring} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                      </div>
                      <h3 className="font-bold text-lg leading-tight mb-1">{source.title}</h3>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        {source.subtitle}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
                        {source.description}
                      </p>
                      <div className="w-full pt-4 border-t border-border/50">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Sourced from
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {source.sources.map((s) => (
                            <span
                              key={s}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold leading-none border ${source.chipBg} ${source.chipText} ${source.chipBorder} whitespace-nowrap`}
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span>{s}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Team Section - Simple & Clean */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold mb-2">Meet Our Team</h2>
            <p className="text-muted-foreground">Passionate professionals dedicated to your success</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <h4 className="font-bold mb-1">{member.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Github className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Linkedin className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Section - Clean Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
        >
          <Card>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Get in Touch</CardTitle>
              <CardDescription>
                Have questions? We'd love to hear from you
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Taimoor Raza Asif"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="raza@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="General Inquiry"
                      value={formData.subject}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="resize-none"
                  />
                </div>

                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-900"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">Message sent successfully! We'll get back to you soon.</p>
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-900"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">Failed to send message. Please try again.</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}