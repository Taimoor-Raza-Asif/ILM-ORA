import React from 'react';
import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { userProgressService } from "@/shared/services/userProgressService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Briefcase, TrendingUp, Banknote, Search, ArrowLeft, Users, PieChart as PieChartIcon, ChevronLeft, ChevronRight, Filter, Layers, TrendingDown, ArrowUp } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { careerService } from "../../application/careerService";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";
export function CareerInsights() {
  const { user } = useAuth();
  const [careers, setCareers] = useState([]);
  const [filteredCareers, setFilteredCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Log activity when component mounts
  useEffect(() => {
    if (user) {
      const userId = user.id || user.email;
      userProgressService.logActivity(userId, {
        type: 'careers_viewed',
        description: 'Explored Career Salary Insights',
        icon: 'Briefcase',
        color: 'text-teal-500'
      });
    }
  }, [user]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Filter state
  const [selectedField, setSelectedField] = useState("all");

  // Define field categories with keywords
  const fieldCategories = {
    all: { name: "All Fields", keywords: [] },
    medical: { name: "Medical & Healthcare", keywords: ["doctor", "physician", "nurse", "medical", "surgeon", "pharmacist", "dentist", "health", "clinical"] },
    computing: { name: "Computing & IT", keywords: ["software", "developer", "engineer", "programmer", "data", "analyst", "web", "computer", "it ", "technology", "network", "systems", "database", "qa", "quality assurance"] },
    engineering: { name: "Engineering", keywords: ["engineer", "engineering", "electrical", "mechanical", "civil", "chemical", "architect"] },
    business: { name: "Business & Management", keywords: ["manager", "business", "accountant", "finance", "marketing", "sales", "hr", "human resource", "consultant", "executive", "ceo", "director"] },
    education: { name: "Education", keywords: ["teacher", "professor", "lecturer", "instructor", "education", "academic"] },
    design: { name: "Design & Creative", keywords: ["designer", "graphic", "ui", "ux", "artist", "creative"] }
  };

  // Helper function to parse salary string to number
  const parseSalary = (salaryStr) => {
    if (salaryStr == null || salaryStr === "") return 0;
    const cleaned = String(salaryStr).replace(/[^0-9]/g, "");
    return parseInt(cleaned, 10) || 0;
  };

  // Helper function to categorize job
  const categorizeJob = (jobTitle) => {
    const title = (jobTitle ?? "").toLowerCase();
    for (const [key, category] of Object.entries(fieldCategories)) {
      if (key === "all") continue;
      if (category.keywords.some(keyword => title.includes(keyword))) {
        return key;
      }
    }
    return "other";
  };

  // Fetch careers data on mount
  useEffect(() => {
    const fetchCareers = async () => {
      setLoading(true);
      try {
        const data = await careerService.getAll();
        const careerData = data.careers || data || [];
        setCareers(careerData);
        applyFilters(careerData, selectedField, searchQuery);
        
        const statsData = await careerService.getStats();
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load careers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCareers();
  }, []);

  // Apply filters
  const applyFilters = (careerList, field, query) => {
    let filtered = careerList;

    // Apply field filter
    if (field !== "all") {
      filtered = filtered.filter(career =>
        categorizeJob(career.job_title || career.title) === field
      );
    }

    // Apply search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(career => {
        const title = (career.job_title || career.title || "").toLowerCase();
        return title.includes(lowerQuery);
      });
    }

    setFilteredCareers(filtered);
    setCurrentPage(1); // Reset to first page
  };

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilters(careers, selectedField, query);
  };

  // Handle field filter change
  const handleFieldChange = (field) => {
    setSelectedField(field);
    applyFilters(careers, field, searchQuery);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredCareers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCareers = filteredCareers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepare salary distribution data based on filtered careers
  const salaryRanges = [
    { range: "0-300k", min: 0, max: 300000, count: 0 },
    { range: "300k-600k", min: 300000, max: 600000, count: 0 },
    { range: "600k-1M", min: 600000, max: 1000000, count: 0 },
    { range: "1M-2M", min: 1000000, max: 2000000, count: 0 },
    { range: "2M+", min: 2000000, max: Infinity, count: 0 }
  ];

  filteredCareers.forEach(career => {
    const salary = parseSalary(career.average_salary);
    for (let range of salaryRanges) {
      if (salary >= range.min && salary < range.max) {
        range.count++;
        break;
      }
    }
  });

  // Gender distribution data from filtered careers
  const genderData = { male: 0, female: 0 };
  let genderCount = 0;
  filteredCareers.forEach(career => {
    if (career.gender) {
      const malePercent = parseFloat(career.gender.Male?.replace('%', '') || 0);
      const femalePercent = parseFloat(career.gender.Female?.replace('%', '') || 0);
      genderData.male += malePercent;
      genderData.female += femalePercent;
      genderCount++;
    }
  });

  const genderChartData = [
    { name: 'Male', value: genderCount > 0 ? Math.round(genderData.male / genderCount) : 0, color: '#1976D2' },
    { name: 'Female', value: genderCount > 0 ? Math.round(genderData.female / genderCount) : 0, color: '#FB8C00' }
  ];

  // Benefits data aggregation from filtered careers
  const benefitsAgg = { Medical: 0, Dental: 0, Vision: 0, None: 0 };
  let benefitsCount = 0;
  filteredCareers.forEach(career => {
    if (career.benefits) {
      Object.keys(benefitsAgg).forEach(key => {
        const raw = career.benefits[key];
        if (raw != null && raw !== "") {
          benefitsAgg[key] += parseFloat(String(raw).replace("%", "") || 0);
        }
      });
      benefitsCount++;
    }
  });

  const benefitsData = Object.keys(benefitsAgg).map(key => ({
    benefit: key,
    percentage: benefitsCount > 0 ? Math.round(benefitsAgg[key] / benefitsCount) : 0
  }));

  // Calculate filtered stats
  const filteredStats = {
    total_jobs: filteredCareers.length,
    min_salary: 0,
    max_salary: 0,
    avg_salary: 0,
    median_salary: 0
  };

  if (filteredCareers.length > 0) {
    const salaries = filteredCareers.map(career => parseSalary(career.average_salary)).filter(s => s > 0);
    if (salaries.length > 0) {
      const sorted = salaries.sort((a, b) => a - b);
      filteredStats.min_salary = Math.min(...salaries);
      filteredStats.max_salary = Math.max(...salaries);
      filteredStats.avg_salary = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
      filteredStats.median_salary = sorted[Math.floor(sorted.length / 2)];
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Career Insights</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Real salary data from {careers.length} careers in Pakistan
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="self-start sm:self-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Total Careers</div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredStats.total_jobs}</div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-green-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Avg Salary</div>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredStats.avg_salary > 0 ? `PKR ${(filteredStats.avg_salary / 1000).toFixed(0)}k` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-orange-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Min Salary</div>
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {filteredStats.min_salary > 0 ? `PKR ${(filteredStats.min_salary / 1000).toFixed(0)}k` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Max Salary</div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {filteredStats.max_salary > 0 ? `PKR ${(filteredStats.max_salary / 1000000).toFixed(1)}M` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Search careers (e.g., Software Engineer, Manager, Doctor)..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <Select value={selectedField} onValueChange={handleFieldChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by field" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldCategories).map(([key, category]) => (
                      <SelectItem key={key} value={key}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Salary Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Salary Distribution</CardTitle>
              <CardDescription>Number of jobs by salary range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salaryRanges}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fill: "currentColor", fontSize: 12 }} 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="currentColor"
                    className="text-foreground"
                  />
                  <YAxis 
                    tick={{ fill: "currentColor" }} 
                    stroke="currentColor"
                    className="text-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "2px solid #1976D2", 
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))"
                    }} 
                  />
                  <Bar dataKey="count" fill="#1976D2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
              <CardDescription>Average across all careers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      return (
                        <text 
                          x={0} 
                          y={0} 
                          fill="currentColor" 
                          className="text-foreground font-semibold"
                          textAnchor="middle"
                        >
                          {`${name}: ${value}%`}
                        </text>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))"
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: "hsl(var(--foreground))" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Benefits Coverage */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits Coverage</CardTitle>
              <CardDescription>Average benefits offered</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={benefitsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    tick={{ fill: "currentColor" }}
                    stroke="currentColor"
                    className="text-foreground"
                  />
                  <YAxis 
                    dataKey="benefit" 
                    type="category" 
                    tick={{ fill: "currentColor" }} 
                    width={70}
                    stroke="currentColor"
                    className="text-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "2px solid #FB8C00", 
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))"
                    }} 
                  />
                  <Bar dataKey="percentage" fill="#FB8C00" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Career Cards */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {searchQuery || selectedField !== "all" 
              ? `Showing ${filteredCareers.length} of ${careers.length} Careers` 
              : `All ${filteredCareers.length} Careers`}
          </h2>
          {totalPages > 1 && (
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentCareers.map((career, index) => (
            <Card key={index} className="hover:shadow-xl transition-all hover:scale-[1.02] border-2 hover:border-primary/50 flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2 leading-tight min-h-[3.5rem] line-clamp-2">
                    {career.job_title || career.title}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {career.median_salary}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <Banknote className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Average Salary</div>
                      <div className="font-bold text-sm">{career.average_salary}</div>
                      <div className="text-xs text-muted-foreground">{career.salary_period}</div>
                    </div>
                  </div>

                  {career.gender && (
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Gender Split</div>
                        <div className="text-xs font-medium">
                          M: {career.gender.Male} / F: {career.gender.Female}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {career.experience_levels && (
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground mb-2">Experience Growth:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(career.experience_levels).slice(0, 3).map(([level, growth], i) => (
                        <Badge 
                          key={i} 
                          variant="outline" 
                          className={`text-xs ${growth.includes('▲') ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {level.split(' ')[0]}: {growth}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-primary text-sm mt-auto" 
                  size="sm"
                  onClick={() => {
                    setSelectedCareer(career);
                    setDialogOpen(true);
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCareers.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No careers found. Try a different search term or filter.
            </p>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 || 
                  page === totalPages || 
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Career Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedCareer && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedCareer.job_title || selectedCareer.title}</DialogTitle>
                  <DialogDescription>{selectedCareer.summary}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Salary Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Banknote
                       className="w-5 h-5 text-green-600" />
                      Salary Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground mb-1">Average Salary</div>
                          <div className="text-xl font-bold">{selectedCareer.average_salary}</div>
                          <div className="text-xs text-muted-foreground">{selectedCareer.salary_period}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground mb-1">Median Salary</div>
                          <div className="text-xl font-bold">{selectedCareer.median_salary}</div>
                          <div className="text-xs text-muted-foreground">{selectedCareer.salary_period}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Gender Distribution */}
                  {selectedCareer.gender && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Gender Distribution
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground mb-1">Male</div>
                            <div className="text-2xl font-bold text-blue-600">{selectedCareer.gender.Male}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm text-muted-foreground mb-1">Female</div>
                            <div className="text-2xl font-bold text-pink-600">{selectedCareer.gender.Female}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Experience Level Growth */}
                  {selectedCareer.experience_levels && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-secondary" />
                        Salary Growth by Experience
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(selectedCareer.experience_levels).map(([level, growth], i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <div className="text-xs text-muted-foreground mb-1">{level}</div>
                              <div className={`text-lg font-bold ${growth.includes('▲') ? 'text-green-600' : 'text-red-600'}`}>
                                {growth}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {selectedCareer.benefits && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Benefits Coverage</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(selectedCareer.benefits).map(([benefit, percent], i) => (
                          <Card key={i}>
                            <CardContent className="p-4">
                              <div className="text-sm text-muted-foreground mb-1">{benefit}</div>
                              <div className="text-xl font-bold text-primary">{percent}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External Link */}
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full" 
                      onClick={() => window.open(selectedCareer.url, '_blank')}
                    >
                      View Full Details on PayScale
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}