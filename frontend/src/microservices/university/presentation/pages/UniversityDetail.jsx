import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { MapPin, Star, Users, ArrowLeft, Brain, Sparkles, Heart, Share2, ExternalLink, MessageSquare, ChevronLeft, ChevronRight, Navigation } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { getUniversityImage } from "@/shared/utils/universityImages";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { GoogleMap, LoadScript, MarkerF } from "@react-google-maps/api";

const API_BASE = "";
const mapContainerStyle = { width: "100%", height: "100%" };

export function UniversityDetail() {
  const { id } = useParams();

  const [universityName, setUniversityName] = React.useState("");
  const [stats, setStats] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Programs Pagination State
  const [programs, setPrograms] = React.useState([]);
  const [programsPage, setProgramsPage] = React.useState(1);
  const [programsTotalPages, setProgramsTotalPages] = React.useState(1);
  const [programsLoading, setProgramsLoading] = React.useState(false);
  const PROGRAMS_PER_PAGE = 5;

  // Scholarships State
  const [scholarships, setScholarships] = React.useState([]);
  const [scholarshipsLoading, setScholarshipsLoading] = React.useState(false);
  const [scholarshipsError, setScholarshipsError] = React.useState(null);
  const [activeScholarshipTab, setActiveScholarshipTab] = React.useState("all-pakistan");
  const [scholarshipPages, setScholarshipPages] = React.useState({
    "all-pakistan": 1,
    "balochistan-fata": 1,
    "university-specific": 1,
    "other": 1
  });
  const [expandedScholarships, setExpandedScholarships] = React.useState({});
  const SCHOLARSHIPS_PER_PAGE = 7;
  const [hostels, setHostels] = React.useState([]);
  const [hostelsLoading, setHostelsLoading] = React.useState(false);
  const [hostelsError, setHostelsError] = React.useState(null);
  const [hostelMapCenter, setHostelMapCenter] = React.useState({ lat: 33.6844, lng: 73.0479 });
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  React.useEffect(() => {
    const loadUniversityData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch University Details (works with ID or Name)
        // Encode the ID to handle spaces and special characters
        const uniRes = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(id)}`);
        if (!uniRes.ok) {
          throw new Error("University not found");
        }
        const uniData = await uniRes.json();

        const name = uniData.name || id;
        // Use apiName if available, otherwise normalize the full name
        const normalizedName = uniData.apiName || name
          .toUpperCase()
          .replace(/-/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        setUniversityName(name); // Use original name for display

        // 2. Fetch AI Stats
        let statsData = { stats: {} };
        try {
          const statsRes = await fetch(`${API_BASE}/api/reviews/${normalizedName}/stats`);
          if (statsRes.ok) {
            statsData = await statsRes.json();
          }
        } catch (e) {
          console.warn("Could not load stats:", e);
        }

        // 3. Merge Data
        setStats({
          ...statsData,
          university: uniData
        });

        // 4. Fetch Reviews (with alias fallback)
        let reviewsList = [];
        const reviewAliases = Array.from(new Set([normalizedName, name].filter(Boolean)));
        for (const alias of reviewAliases) {
          const reviewsRes = await fetch(`${API_BASE}/api/reviews/${encodeURIComponent(alias)}`);
          if (!reviewsRes.ok) continue;
          const reviewsData = await reviewsRes.json();
          const candidateReviews = (reviewsData.reviews || [])
            .map(r => ({
              text: r.reviewText || r.review_text || '',
              factor: r.factor || 'General',
              author: r.authorName || 'Anonymous',
              date: r.createdAt || new Date().toISOString(),
              aiRating: r.aiRating || 3.0
            }))
            .filter(r => r.text)
            .slice(0, 10);
          if (candidateReviews.length > 0) {
            reviewsList = candidateReviews;
            break;
          }
        }
        setReviews(reviewsList);

      } catch (err) {
        console.error(err);
        setError("Failed to load university data");
      } finally {
        setLoading(false);
      }
    };

    loadUniversityData();
  }, [id]);

  React.useEffect(() => {
    const fetchNearbyHostels = async () => {
      if (!id) return;
      setHostelsLoading(true);
      setHostelsError(null);
      try {
        const res = await fetch(`${API_BASE}/api/hostels/near/${encodeURIComponent(id)}?radius=3000`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to fetch nearby hostels");
        }
        const data = await res.json();
        setHostels(data.hostels || []);
        if (data?.university?.center?.lat && data?.university?.center?.lng) {
          setHostelMapCenter({
            lat: data.university.center.lat,
            lng: data.university.center.lng
          });
        }
      } catch (error) {
        console.error("Failed to fetch hostels:", error);
        setHostelsError(error.message || "Failed to fetch nearby hostels");
        setHostels([]);
      } finally {
        setHostelsLoading(false);
      }
    };

    fetchNearbyHostels();
  }, [id]);

  // Fetch Programs when page changes or ID changes
  React.useEffect(() => {
    const fetchPrograms = async () => {
      setProgramsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(id)}/programs?page=${programsPage}&limit=${PROGRAMS_PER_PAGE}`);
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs || []);
          setProgramsTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
      } finally {
        setProgramsLoading(false);
      }
    };

    fetchPrograms();
  }, [id, programsPage]);

  // Fetch Scholarships
  React.useEffect(() => {
    const fetchScholarships = async () => {
      if (!id) return;

      setScholarshipsLoading(true);
      setScholarshipsError(null);

      try {
        const res = await fetch(`${API_BASE}/api/universities/${encodeURIComponent(id)}/scholarships`);
        if (res.ok) {
          const data = await res.json();
          setScholarships(data.scholarships || []);
        } else {
          setScholarshipsError("Failed to load scholarships");
        }
      } catch (error) {
        console.error("Failed to fetch scholarships:", error);
        setScholarshipsError("Failed to load scholarships");
      } finally {
        setScholarshipsLoading(false);
      }
    };

    fetchScholarships();
  }, [id]);

  // Categorize scholarships
  const categorizeScholarships = React.useMemo(() => {
    const categories = {
      "all-pakistan": [],
      "balochistan-fata": [],
      "university-specific": [],
      "other": []
    };

    // Get clean university name variations for matching
    const uniName = (universityName || id || '').toLowerCase();
    const uniNameShort = uniName.split(',')[0].trim(); // "Air University" from "Air University, Islamabad"
    const uniNameParts = uniNameShort.split(/[\s-]+/); // ["air", "university"]

    scholarships.forEach(scholarship => {
      const area = (scholarship.area || '').toLowerCase();
      const matchReason = (scholarship.matchReason || '').toLowerCase();
      const offeredBy = (scholarship.offered_by || '').toLowerCase();
      const title = (scholarship.title || '').toLowerCase();
      const fullContent = (scholarship.full_content || '').toLowerCase();

      // Check if university-specific scholarship
      // Check in offered_by, title, or if university name appears in full_content list
      const isUniversitySpecific =
        offeredBy.includes(uniNameShort) ||
        title.includes(uniNameShort) ||
        (fullContent.includes(uniNameShort) && uniNameParts.length >= 2 &&
          uniNameParts.every(part => part.length < 4 || fullContent.includes(part)));

      if (isUniversitySpecific) {
        categories["university-specific"].push(scholarship);
      }
      // Check All Pakistan
      else if (area.includes('all pakistan') || matchReason.includes('all universities')) {
        categories["all-pakistan"].push(scholarship);
      }
      // Check Balochistan/FATA
      else if (area.includes('balochistan') || area.includes('fata') || area.includes('baloch gb')) {
        categories["balochistan-fata"].push(scholarship);
      }
      // Everything else
      else {
        categories["other"].push(scholarship);
      }
    });

    return categories;
  }, [scholarships, id, universityName]);

  // Get paginated scholarships for current tab
  const getPaginatedScholarships = (category) => {
    const scholarshipsInCategory = categorizeScholarships[category] || [];
    const currentPage = scholarshipPages[category];
    const startIndex = (currentPage - 1) * SCHOLARSHIPS_PER_PAGE;
    const endIndex = startIndex + SCHOLARSHIPS_PER_PAGE;
    return scholarshipsInCategory.slice(startIndex, endIndex);
  };

  // Get total pages for a category
  const getTotalPages = (category) => {
    const scholarshipsInCategory = categorizeScholarships[category] || [];
    return Math.ceil(scholarshipsInCategory.length / SCHOLARSHIPS_PER_PAGE);
  };

  // Handle scholarship page change
  const handleScholarshipPageChange = (category, newPage) => {
    setScholarshipPages(prev => ({
      ...prev,
      [category]: newPage
    }));
  };

  // Toggle scholarship expansion
  const toggleScholarshipExpansion = (scholarshipIndex) => {
    setExpandedScholarships(prev => ({
      ...prev,
      [scholarshipIndex]: !prev[scholarshipIndex]
    }));
  };
  const [selectedFactor, setSelectedFactor] = React.useState(null);

  const toDisplayFactor = (rawFactor) => {
    const normalized = String(rawFactor || "").replace(/\s+/g, "").trim();
    if (!normalized) return "General";
    if (normalized.toLowerCase() === "overall") return null;
    if (normalized === "JobSupport") return "Job Support";
    return normalized.replace(/([A-Z])/g, " $1").trim();
  };

  // Correct data path: stats.stats
  const parsedSentiment = (stats?.stats?.rating_breakdown && typeof stats.stats.rating_breakdown === 'object')
    ? Object.entries(stats.stats.rating_breakdown)
      .map(([cat, score]) => {
        const category = toDisplayFactor(cat);
        if (!category) return null;
        const parsedScore = typeof score === 'number' ? score : Number.parseFloat(score);
        return {
          category,
          score: Number.isFinite(parsedScore) ? Number(parsedScore.toFixed(1)) : 0
        };
      })
      .filter(Boolean)
    : [];

  // 0 means "no reliable signal yet" for that factor, not an actual low rating.
  const sentimentData = parsedSentiment.filter((item) => item.score > 0);
  const unratedFactors = parsedSentiment
    .filter((item) => item.score <= 0)
    .map((item) => item.category);

  // Categorical AI Summary
  const aiSummary = React.useMemo(() => {
    if (!sentimentData.length) return null;
    const sorted = [...sentimentData]
      .filter(f => f.score > 0 && f.category !== 'Overall')
      .sort((a, b) => b.score - a.score);

    if (sorted.length < 2) return "Based on student feedback, this university provides a balanced experience across most surveyed factors.";

    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];

    return `Students primarily praise ${top.category} (${top.score}/5), while noting that ${bottom.category} (${bottom.score}/5) could see further improvement.`;
  }, [sentimentData]);

  const filteredReviews = selectedFactor
    ? reviews.filter(r => r.factor.toLowerCase() === selectedFactor.toLowerCase())
    : reviews;

  const reviewDistribution = stats?.stats?.review_distribution
    ? [5, 4, 3, 2, 1].map(stars => ({
      name: `${stars} Star${stars > 1 ? "s" : ""}`,
      value: Math.round(stats.stats.review_distribution[stars] || 0),
      color: stars === 5 ? "#1976D2" : stars === 4 ? "#42A5F5" : stars === 3 ? "#90CAF9" : "#BBDEFB"
    })).filter(d => d.value > 0)
    : [];

  const overallRating = stats?.stats?.overall_rating
    ? Number(stats.stats.overall_rating).toFixed(1)
    : null;

  const totalReviews = stats?.stats?.total_reviews || 0;
  const hostelAvailability = stats?.hostelAvailability || null;

  const hostelPolicyBadge = React.useMemo(() => {
    const status = String(hostelAvailability?.status || '').toLowerCase();
    if (!status) return null;

    if (status === 'available') {
      return {
        label: 'Hostel Policy: Available',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      };
    }
    if (status === 'none') {
      return {
        label: 'Hostel Policy: Not Available',
        className: 'bg-slate-100 text-slate-700 border-slate-300'
      };
    }
    if (status === 'limited') {
      return {
        label: 'Hostel Policy: Limited',
        className: 'bg-amber-100 text-amber-800 border-amber-300'
      };
    }

    return {
      label: 'Hostel Policy: Unknown',
      className: 'bg-violet-100 text-violet-800 border-violet-300'
    };
  }, [hostelAvailability]);

  const handleChartClick = (data) => {
    if (data && data.activeLabel) {
      setSelectedFactor(prev => prev === data.activeLabel ? null : data.activeLabel);
    }
  };

  const handleProgramsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= programsTotalPages) {
      setProgramsPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4" />
          <p className="text-lg">Loading university insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center text-red-600 text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Back Button */}
      <Button variant="secondary" size="icon" onClick={() => window.history.back()} className="absolute top-24 right-8 z-50 shadow-lg rounded-full">
        <ArrowLeft className="w-5 h-5" />
      </Button>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <ImageWithFallback
          src={getUniversityImage(stats?.university?.apiName || universityName, "https://images.unsplash.com/photo-1595837979282-2db3e1e83e5e?q=80&w=2070")}
          alt={`${universityName} Campus`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="secondary" className="text-lg">#1 in Pakistan</Badge>
              <Badge className="bg-green-600">
                <Sparkles className="w-4 h-4 mr-2" /> AI Insights Live
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">{universityName}</h1>
            <div className="flex flex-wrap gap-6 text-lg">
              <div className="flex items-center gap-2"><MapPin className="w-6 h-6" /> Pakistan</div>
              <div className="flex items-center gap-2"><Users className="w-6 h-6" /> {totalReviews}+ Reviews</div>
              {overallRating && (
                <div className="flex items-center gap-2 font-bold text-yellow-400">
                  <Star className="w-6 h-6 fill-current" />
                  {overallRating}/5.0
                  <span className="text-sm font-normal text-white/80 ml-1">(AI Analyzed)</span>
                </div>
              )}
              {hostelPolicyBadge && (
                <Badge variant="outline" className={`text-sm ${hostelPolicyBadge.className}`}>
                  {hostelPolicyBadge.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="sentiments" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="programs">Programs</TabsTrigger>
                <TabsTrigger value="sentiments">AI Reviews</TabsTrigger>
                <TabsTrigger value="scholarships">Aid</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <Brain className="w-8 h-8 text-primary" />
                      About {universityName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">General Information</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Type</dt>
                            <dd className="font-medium">{stats?.university?.type || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Established</dt>
                            <dd className="font-medium">{stats?.university?.established || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Location</dt>
                            <dd className="font-medium">{stats?.university?.location || 'Islamabad'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Campus</dt>
                            <dd className="font-medium">{stats?.university?.campus || 'Main Campus'}</dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Statistics</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Total Students</dt>
                            <dd className="font-medium">{stats?.university?.totalStudents?.toLocaleString() || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Academic Staff</dt>
                            <dd className="font-medium">{stats?.university?.academicStaff?.toLocaleString() || 'N/A'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Student/Staff Ratio</dt>
                            <dd className="font-medium">{stats?.university?.studentStaffRatio || 'N/A'}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {stats?.university?.viceChancellor && typeof stats.university.viceChancellor === 'string' && (
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Leadership</h3>
                        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                            {stats.university.viceChancellor.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{stats.university.viceChancellor}</p>
                            <p className="text-sm text-muted-foreground">Vice Chancellor</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="programs">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Programs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {programsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading programs...</p>
                        </div>
                      ) : (
                        <>
                          {programs.map((prog, i) => (
                            <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div>
                                <h4 className="font-semibold">{prog.name}</h4>
                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                  <span>{prog.duration}</span>
                                  <span>•</span>
                                  <span>{prog.feePerSemester ? `PKR ${prog.feePerSemester}/sem` : 'Fee N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!programs || programs.length === 0) && (
                            <p className="text-muted-foreground text-center py-8">No program information available.</p>
                          )}
                        </>
                      )}

                      {/* Pagination Controls */}
                      {programsTotalPages > 1 && (
                        <div className="mt-6 flex justify-center items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleProgramsPageChange(programsPage - 1)}
                            disabled={programsPage === 1 || programsLoading}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>

                          <span className="text-sm font-medium">
                            Page {programsPage} of {programsTotalPages}
                          </span>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleProgramsPageChange(programsPage + 1)}
                            disabled={programsPage === programsTotalPages || programsLoading}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sentiments">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <Brain className="w-8 h-8 text-primary" />
                      AI-Powered Sentiment Analysis
                      <span className="text-sm font-normal text-muted-foreground">
                        • Based on {totalReviews} real student reviews
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* AI Insight Summary */}
                    {aiSummary && (
                      <div className="mb-8 p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
                        <Sparkles className="w-6 h-6 text-primary shrink-0 mt-1" />
                        <div>
                          <h4 className="font-bold text-primary mb-1 text-sm uppercase tracking-wider">AI Executive Summary</h4>
                          <p className="text-lg text-foreground italic leading-relaxed">
                            "{aiSummary}"
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Category Ratings */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg">Category Ratings</h3>
                          {selectedFactor && (
                            <Badge
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-white transition-colors"
                              onClick={() => setSelectedFactor(null)}
                            >
                              Filtering: {selectedFactor} ✕
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">💡 Click a bar to filter reviews by that category</p>
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={sentimentData}
                            onClick={handleChartClick}
                            margin={{ top: 8, right: 10, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="category"
                              interval={0}
                              angle={-35}
                              textAnchor="end"
                              height={95}
                              tick={{ fontSize: 12 }}
                              tickMargin={10}
                            />
                            <YAxis domain={[0, 5]} />
                            <Tooltip formatter={(v) => `${v}/5.0`} />
                            <Bar
                              dataKey="score"
                              fill="#1976D2"
                              radius={[8, 8, 0, 0]}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {sentimentData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={selectedFactor === entry.category ? "#FFA000" : "#1976D2"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        {unratedFactors.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Unrated factors (insufficient review signal): {unratedFactors.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Rating Distribution */}
                      <div>
                        <h3 className="font-bold text-lg mb-4">Rating Distribution</h3>
                        <ResponsiveContainer width="100%" height={320}>
                          <PieChart>
                            <Pie
                              data={reviewDistribution}
                              dataKey="value"
                              nameKey="name"
                              cx="50%" cy="50%"
                              outerRadius={110}
                              label={({ name, value }) => `${name}: ${value}%`}
                            >
                              {reviewDistribution.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => `${v}%`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Recent Reviews */}
                    {filteredReviews.length > 0 && (
                      <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg">
                            {selectedFactor ? `${selectedFactor} Reviews` : "Recent Student Reviews"}
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {filteredReviews.map((review, i) => (
                            <div key={i} className="p-6 bg-muted/30 rounded-lg border-l-4 border-primary shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className="text-sm font-semibold">{review.factor}</Badge>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${star <= Math.round(review.aiRating || 3) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                                    />
                                  ))}
                                  <span className="text-xs ml-1 font-semibold">{(review.aiRating || 3).toFixed(1)}</span>
                                </div>
                              </div>
                              <p className="text-base leading-relaxed mb-3 text-foreground/90">{review.text}</p>
                              <div className="flex items-center justify-between mt-4 text-muted-foreground">
                                <span className="text-sm font-medium flex items-center gap-2">
                                  <Users className="w-4 h-4" /> {review.author}
                                </span>
                                <span className="text-xs italic">{new Date(review.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="scholarships">
                <Card>
                  <CardHeader>
                    <CardTitle>Scholarships & Financial Aid (Bachelor Level)</CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">
                      {scholarshipsLoading ? "Loading..." : `${scholarships.length} scholarship${scholarships.length !== 1 ? 's' : ''} available for bachelor students`}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {scholarshipsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading scholarships...</p>
                      </div>
                    ) : scholarshipsError ? (
                      <div className="text-center py-8">
                        <p className="text-destructive">{scholarshipsError}</p>
                      </div>
                    ) : scholarships.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No scholarship information available yet.</p>
                    ) : (
                      <Tabs value={activeScholarshipTab} onValueChange={setActiveScholarshipTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2">
                          <TabsTrigger value="all-pakistan" className="text-xs md:text-sm">
                            All Pakistan ({categorizeScholarships["all-pakistan"].length})
                          </TabsTrigger>
                          <TabsTrigger value="balochistan-fata" className="text-xs md:text-sm">
                            Balochistan/FATA ({categorizeScholarships["balochistan-fata"].length})
                          </TabsTrigger>
                          <TabsTrigger value="university-specific" className="text-xs md:text-sm">
                            {(universityName || id).split(',')[0]} ({categorizeScholarships["university-specific"].length})
                          </TabsTrigger>
                          <TabsTrigger value="other" className="text-xs md:text-sm">
                            Other Regional ({categorizeScholarships["other"].length})
                          </TabsTrigger>
                        </TabsList>

                        {["all-pakistan", "balochistan-fata", "university-specific", "other"].map(category => (
                          <TabsContent key={category} value={category} className="mt-6">
                            {categorizeScholarships[category].length === 0 ? (
                              <p className="text-muted-foreground text-center py-8">
                                No scholarships in this category
                              </p>
                            ) : (
                              <>
                                <div className="space-y-4">
                                  {getPaginatedScholarships(category).map((scholarship, index) => {
                                    const globalIndex = `${category}-${index}`;
                                    const isExpanded = expandedScholarships[globalIndex];

                                    return (
                                      <Card key={index} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                              <CardTitle className="text-lg mb-2">{scholarship.title}</CardTitle>
                                              <div className="flex flex-wrap gap-2">
                                                {scholarship.matchReason && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    {scholarship.matchReason.split(';')[0]}
                                                  </Badge>
                                                )}
                                                {scholarship.type && (
                                                  <Badge variant="outline" className="text-xs">
                                                    {scholarship.type}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            {scholarship.application_link && (
                                              <Button
                                                variant="default"
                                                size="sm"
                                                asChild
                                              >
                                                <a
                                                  href={scholarship.application_link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-2"
                                                >
                                                  Apply Now
                                                  <ExternalLink className="w-4 h-4" />
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          {/* Compact Summary - Only one line initially */}
                                          {!isExpanded && (
                                            <div>
                                              <p className="text-sm text-muted-foreground line-clamp-1">
                                                {scholarship.eligibility || scholarship.summary || 'Financial assistance program for eligible students'}
                                              </p>
                                            </div>
                                          )}

                                          {/* Expanded Details - Show everything when expanded */}
                                          {isExpanded && (
                                            <div className="space-y-3">
                                              {/* Amount and Deadline */}
                                              <div className="grid grid-cols-2 gap-4 pb-3 border-b">
                                                {scholarship.amount && (
                                                  <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                                                    <p className="text-base font-semibold text-green-600">{scholarship.amount}</p>
                                                  </div>
                                                )}
                                                {scholarship.deadline && scholarship.deadline !== "N.A" && (
                                                  <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                                                    <p className="text-base font-semibold">{scholarship.deadline}</p>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Eligibility */}
                                              {scholarship.eligibility && (
                                                <div>
                                                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                                    <span>Eligibility</span>
                                                  </h4>
                                                  <p className="text-sm text-muted-foreground">{scholarship.eligibility}</p>
                                                </div>
                                              )}

                                              {/* Summary */}
                                              {scholarship.summary && (
                                                <div>
                                                  <p className="text-sm text-muted-foreground">{scholarship.summary}</p>
                                                </div>
                                              )}

                                              {/* Additional Details */}
                                              <div className="grid grid-cols-2 gap-3 text-sm pt-3 border-t">
                                                {scholarship.level && (
                                                  <div>
                                                    <span className="text-muted-foreground">Level:</span>
                                                    <span className="ml-2 font-medium">{scholarship.level}</span>
                                                  </div>
                                                )}
                                                {scholarship.area && (
                                                  <div>
                                                    <span className="text-muted-foreground">Area:</span>
                                                    <span className="ml-2 font-medium">{scholarship.area}</span>
                                                  </div>
                                                )}
                                                {scholarship.offered_by && (
                                                  <div className="col-span-2">
                                                    <span className="text-muted-foreground">Offered By:</span>
                                                    <span className="ml-2 font-medium">{scholarship.offered_by}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          {/* View More / Learn More Buttons */}
                                          <div className="flex items-center justify-between pt-3 border-t">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleScholarshipExpansion(globalIndex)}
                                              className="text-primary hover:text-primary"
                                            >
                                              {isExpanded ? "View Less" : "View More"}
                                            </Button>
                                            {scholarship.url && (
                                              <Button
                                                variant="link"
                                                size="sm"
                                                asChild
                                                className="text-primary"
                                              >
                                                <a
                                                  href={scholarship.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-1"
                                                >
                                                  Learn More
                                                  <ExternalLink className="w-3 h-3" />
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>

                                {/* Pagination */}
                                {getTotalPages(category) > 1 && (
                                  <div className="mt-6 flex justify-center items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleScholarshipPageChange(category, scholarshipPages[category] - 1)}
                                      disabled={scholarshipPages[category] === 1}
                                    >
                                      <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    <span className="text-sm font-medium">
                                      Page {scholarshipPages[category]} of {getTotalPages(category)}
                                    </span>

                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleScholarshipPageChange(category, scholarshipPages[category] + 1)}
                                      disabled={scholarshipPages[category] === getTotalPages(category)}
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="hostels">
                <Card>
                  <CardHeader>
                    <CardTitle>Hostel & Housing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hostelsLoading ? (
                      <p className="text-muted-foreground text-center py-8">Loading nearby hostels...</p>
                    ) : hostelsError ? (
                      <p className="text-destructive text-center py-8">{hostelsError}</p>
                    ) : hostels.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No nearby hostels found for this university.</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="h-72 rounded-lg overflow-hidden border">
                          {!googleMapsApiKey ? (
                            <div className="w-full h-full bg-muted flex items-center justify-center p-6 text-center text-muted-foreground">
                              Set `VITE_GOOGLE_MAPS_API_KEY` in frontend env to display map markers.
                            </div>
                          ) : (
                            <LoadScript googleMapsApiKey={googleMapsApiKey}>
                              <GoogleMap mapContainerStyle={mapContainerStyle} center={hostelMapCenter} zoom={13}>
                                <MarkerF position={hostelMapCenter} label="U" />
                                {hostels.map((hostel) => (
                                  hostel?.location?.lat && hostel?.location?.lng ? (
                                    <MarkerF
                                      key={hostel.id}
                                      position={{ lat: hostel.location.lat, lng: hostel.location.lng }}
                                      title={hostel.name}
                                    />
                                  ) : null
                                ))}
                              </GoogleMap>
                            </LoadScript>
                          )}
                        </div>

                        <div className="space-y-3 max-h-80 overflow-auto pr-1">
                          {hostels.map((hostel) => (
                            <div key={hostel.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-semibold">{hostel.name}</h4>
                                  <p className="text-sm text-muted-foreground">{hostel.address}</p>
                                </div>
                                {typeof hostel.rating === 'number' && (
                                  <Badge variant="outline">{hostel.rating.toFixed(1)} ⭐</Badge>
                                )}
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                  {hostel.distanceKm != null ? `${hostel.distanceKm} km from university` : 'Distance unavailable'}
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hostel.name} ${hostel.address || ''}`.trim())}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Open in Maps
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Rating</span>
                    <span className="font-bold text-primary text-2xl">{overallRating || '0.0'}/5.0</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 ${star <= Math.round(overallRating || 0) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {totalReviews} AI-analyzed student reviews
                </div>
              </CardContent>
            </Card>
          </div>
        </div >
      </div >
    </div >
  );
}
