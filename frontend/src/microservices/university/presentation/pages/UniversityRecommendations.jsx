import React from 'react';
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { userProgressService } from "@/shared/services/userProgressService";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Building2, MapPin, Banknote, Star, TrendingUp, Search, Heart, ArrowRight, ArrowLeft, Users, Award, Loader2, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { getUniversityImage } from "@/shared/utils/universityImages";

export function UniversityRecommendations() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [saved, setSaved] = useState([]);
  const [sentimentRatings, setSentimentRatings] = useState({});
  const [loadingSentiments, setLoadingSentiments] = useState(true);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const MAX_VISIBLE_PAGES = 7;

  // Mark university insights as viewed when component mounts
  useEffect(() => {
    if (user) {
      const userId = user.id || user.email;
      userProgressService.markUniversityInsightsViewed(userId);
      userProgressService.logActivity(userId, {
        type: 'universities_viewed',
        description: 'Explored University Recommendations',
        icon: 'Building2',
        color: 'text-orange-500'
      });
      console.log('✅ University insights view tracked for user:', userId);
    }
  }, [user]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const response = await fetch(`/api/universities?page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
        if (response.ok) {
          const data = await response.json();
          const mappedUniversities = data.universities.map((uni, index) => {
            // Get image using utility - tries apiName first, then name, then fallback
            const universityImage = getUniversityImage(uni.apiName || uni.name, "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070");
            
            return {
              id: uni._id || index,
              name: uni.name,
              apiName: uni.apiName || uni.name,
              location: uni.location || "Pakistan",
              country: "Pakistan",
              image: universityImage,
              tuitionFee: uni.tuitionFeeRange || "N/A",
              ranking: `#${index + 1} in Region`,
              accreditation: uni.affiliation || "HEC Recognized",
              programsOffered: uni.programsSample?.length ? uni.programsSample : ["N/A"],
              programCount: uni.programCount || 0,
              studentsCount: uni.totalStudents ? uni.totalStudents.toLocaleString() : "N/A"
            };
          });
          setUniversities(mappedUniversities);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          setCurrentPage(data.currentPage || 1);
        } else {
          setUniversities([]);
          setLoadError("Could not load universities right now. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch universities:", error);
        setUniversities([]);
        setLoadError("Could not load universities right now. Please check your connection and retry.");
      } finally {
        setLoading(false);
        setLoadingSentiments(false);
      }
    };

    fetchUniversities();
  }, [currentPage, retryCount]);

  // Effect to fetch sentiments if they weren't in the list
  useEffect(() => {
    if (universities.length === 0) return;

    const fetchSentiments = async () => {
      setLoadingSentiments(true);
      const ratings = {};
      for (const uni of universities) {
        try {
          const res = await fetch(`/api/reviews/${encodeURIComponent(uni.apiName)}/stats`);
          if (res.ok) {
            const data = await res.json();
            ratings[uni.id] = data.stats?.overall_rating ?? data.stats?.overallRating ?? 0;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setSentimentRatings(ratings);
      setLoadingSentiments(false);
    };
    fetchSentiments();
  }, [universities]);

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) || uni.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "all" || uni.location.includes(cityFilter);
    return matchesSearch && matchesCity;
  });

  const toggleSave = id => {
    setSaved(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getVisiblePages = () => {
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(MAX_VISIBLE_PAGES / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    if (end - start + 1 < MAX_VISIBLE_PAGES) {
      start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">University Recommendations</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Top universities in Pakistan & abroad matching your profile
                  {loadingSentiments && (
                    <span className="ml-2 inline-flex items-center gap-1 text-primary">
                      <Brain className="w-4 h-4 animate-pulse" />
                      Loading AI ratings...
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="self-start sm:self-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <Card className="mb-6 md:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input placeholder="Search universities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 sm:pl-10 text-sm sm:text-base" />
              </div>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Islamabad">Islamabad</SelectItem>
                  <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing {filteredUniversities.length} of {totalCount} universit{totalCount !== 1 ? "ies" : "y"}
          </p>
        </div>

        {loading && (
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
              <p className="font-medium">Loading universities...</p>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch recommendations.</p>
            </CardContent>
          </Card>
        )}

        {!loading && loadError && (
          <Card className="border-2 border-red-200 bg-red-50/40">
            <CardContent className="p-6 text-center">
              <p className="font-medium text-red-700">{loadError}</p>
              <Button className="mt-3" variant="outline" onClick={() => setRetryCount(prev => prev + 1)}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !loadError && filteredUniversities.length === 0 && (
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <p className="font-medium">No universities match your current filters.</p>
              <p className="text-sm text-muted-foreground mt-1">Try clearing search text or selecting "All Locations".</p>
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCityFilter("all");
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !loadError && filteredUniversities.length > 0 && <div className="grid gap-6">
          {filteredUniversities.map((university) => {
            const sentiment = sentimentRatings[university.id];
            const hasSentiment = sentiment && sentiment > 0;

            return (
              <Card key={university.id} className="hover:shadow-xl transition-all border-2 overflow-hidden hover:border-primary/50">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-80 h-64 lg:h-auto relative overflow-hidden">
                    <ImageWithFallback src={university.image} alt={university.name} className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        size="icon"
                        variant={saved.includes(university.id) ? "default" : "secondary"}
                        className="rounded-full shadow-lg"
                        onClick={() => toggleSave(university.id)}
                        aria-label={saved.includes(university.id) ? `Remove ${university.name} from saved` : `Save ${university.name}`}
                      >
                        <Heart className={`w-5 h-5 ${saved.includes(university.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="flex-1 p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{university.name}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{university.location}</div>
                              <Badge variant="outline">{university.ranking}</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-green-600" />
                            <div>
                              <div className="text-sm text-muted-foreground">Tuition Fee</div>
                              <div className="font-medium">{university.tuitionFee}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-secondary" />
                            <div>
                              <div className="text-sm text-muted-foreground">AI Sentiment Rating</div>
                              {loadingSentiments ? (
                                <div className="font-medium flex items-center gap-1">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading...
                                </div>
                              ) : hasSentiment ? (
                                <div className="font-medium flex items-center gap-1">
                                  {sentiment.toFixed(1)}/5.0 <TrendingUp className="w-4 h-4 text-green-600" />
                                  <Badge variant="outline" className="ml-1 text-xs">AI</Badge>
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">No reviews yet</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-primary" />
                          <div>
                            <div className="text-sm text-muted-foreground">Total Students</div>
                            <div className="font-medium">{university.studentsCount}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-accent" />
                          <div>
                            <div className="text-sm text-muted-foreground">Accreditation</div>
                            <div className="font-medium">{university.accreditation}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-sm text-muted-foreground mb-2">
                            Programs Offered {university.programCount > 0 ? `(${university.programCount})` : ""}
                          </div>
                          <div className="flex flex-wrap gap-2">{university.programsOffered.map((program, index) => <Badge key={index} variant="outline" className="bg-card">{program}</Badge>)}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        <Link to={`/university/${university.apiName}`} className="flex-1 min-w-[200px]"><Button className="w-full bg-primary hover:bg-primary/90">View Details <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
                        <Link
                          to={`/scholarships?university=${encodeURIComponent(university.apiName)}&name=${encodeURIComponent(university.name)}`}
                          className="flex-1 min-w-[150px]"
                        >
                          <Button variant="outline" className="w-full">Find Scholarships</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>}

        {/* Pagination Controls */}
        {!loading && !loadError && filteredUniversities.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {getVisiblePages().map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0"
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-2">
          <CardContent className="p-6 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="text-xl font-bold mb-2">View on Map</h3>
            <p className="text-muted-foreground mb-4">See all universities plotted on an interactive map</p>
            <Button variant="outline">Open Map View</Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}