import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Award, Search, DollarSign, Calendar, Heart, ArrowLeft } from "lucide-react";

const fallbackScholarships = [
  {
    id: 1,
    title: "HEC Need-Based Scholarship",
    amount: "Up to PKR 200,000/year",
    deadline: "August 15, 2025",
    eligibility: "Pakistani students with financial need, GPA > 3.0",
    country: "Pakistan",
    type: "Need-based"
  },
  {
    id: 2,
    title: "NUST Merit Scholarship",
    amount: "50-100% tuition waiver",
    deadline: "Rolling basis",
    eligibility: "Top performers in NET entry test",
    country: "Pakistan",
    type: "Merit-based"
  },
  {
    id: 3,
    title: "Fulbright Scholarship (Pakistan)",
    amount: "$30,000/year",
    deadline: "October 15, 2025",
    eligibility: "Pakistani citizens, GPA > 3.5, leadership potential",
    country: "USA",
    type: "Merit-based"
  }
];

const normalizeScholarship = (item, index) => {
  const rawDeadline = String(item.deadline || "").trim();
  const matchedDate = rawDeadline.match(
    /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/
  );
  const cleanDeadline = matchedDate
    ? matchedDate[1]
    : rawDeadline.toLowerCase().includes("n.a")
      ? "N/A"
      : "N/A";

  return {
    id: item.id || item._id || `${item.title || item.name || "sch"}-${index}`,
    title: item.title || item.name || "Scholarship",
    amount: item.amount || "N/A",
    deadline: cleanDeadline,
    eligibility: item.eligibility || item.summary || "See details",
    country: item.country || "Pakistan",
    type: String(item.type || "General"),
    matchReason: item.matchReason || "",
    link: item.application_link || item.url || ""
  };
};

const compactLabel = (value, max = 24) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

export function ScholarshipFinder() {
  const [searchParams] = useSearchParams();
  const universityParam = searchParams.get("university");
  const preferredUniversityName = searchParams.get("name");

  const [saved, setSaved] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [scholarships, setScholarships] = useState(fallbackScholarships);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedUniversityName, setResolvedUniversityName] = useState(preferredUniversityName || "");

  useEffect(() => {
    if (!universityParam) {
      setScholarships(fallbackScholarships);
      setResolvedUniversityName(preferredUniversityName || "");
      setError(null);
      return;
    }

    const fetchUniversityScholarships = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/universities/${encodeURIComponent(universityParam)}/scholarships`);
        if (!response.ok) {
          throw new Error("Failed to fetch scholarships for selected university");
        }
        const data = await response.json();
        setResolvedUniversityName(data.universityName || preferredUniversityName || universityParam);
        setScholarships((data.scholarships || []).map(normalizeScholarship));
      } catch (fetchError) {
        setError(fetchError.message || "Failed to fetch scholarships");
        setScholarships([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUniversityScholarships();
  }, [universityParam, preferredUniversityName]);

  const filteredScholarships = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const country = countryFilter.trim().toLowerCase();

    return scholarships.filter((scholarship) => {
      const inKeyword =
        !keyword ||
        scholarship.title.toLowerCase().includes(keyword) ||
        String(scholarship.eligibility).toLowerCase().includes(keyword) ||
        String(scholarship.matchReason).toLowerCase().includes(keyword);
      const inCountry = !country || String(scholarship.country).toLowerCase().includes(country);
      return inKeyword && inCountry;
    });
  }, [scholarships, searchTerm, countryFilter]);

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-5">
        <Button variant="ghost" onClick={() => window.history.back()} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Scholarship Finder</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {resolvedUniversityName
                  ? `Showing scholarships for ${resolvedUniversityName}`
                  : "Find funding for Pakistani & international universities"}
              </p>
            </div>
          </div>
        </div>

        <Card className="border">
          <CardContent className="p-4 sm:p-6">
            <div className="grid md:grid-cols-3 gap-3 sm:gap-4 items-center">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search scholarships..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <Input
                placeholder="Filter by country/area"
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground px-1">
          Showing {filteredScholarships.length} scholarship{filteredScholarships.length !== 1 ? "s" : ""}
          {resolvedUniversityName ? ` for ${resolvedUniversityName}` : ""}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading scholarships...</p>
        ) : error ? (
          <p className="text-destructive">{error}</p>
        ) : filteredScholarships.length === 0 ? (
          <p className="text-muted-foreground">
            {universityParam
              ? "No scholarships found for this university."
              : "No scholarships found with current filters."}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {filteredScholarships.map((scholarship) => (
              <Card key={scholarship.id} className="h-full hover:shadow-xl transition-all border-2 hover:border-primary/50">
                <CardContent className="h-full p-4 md:p-6">
                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold leading-tight break-words">{scholarship.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline">{compactLabel(scholarship.type)}</Badge>
                          {scholarship.matchReason && <Badge variant="secondary">Matched</Badge>}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant={saved.includes(scholarship.id) ? "default" : "outline"}
                        onClick={() =>
                          setSaved((prev) =>
                            prev.includes(scholarship.id)
                              ? prev.filter((id) => id !== scholarship.id)
                              : [...prev, scholarship.id]
                          )
                        }
                      >
                        <Heart className={`w-5 h-5 ${saved.includes(scholarship.id) ? "fill-current" : ""}`} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-xs text-muted-foreground">Amount</div>
                          <div className="font-medium text-sm break-words">{scholarship.amount}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground">Deadline</div>
                          <div className="font-medium text-sm">{scholarship.deadline}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-3">
                      <Button
                        className={`w-full h-10 bg-blue-600 text-white hover:bg-blue-700 ${!scholarship.link ? "opacity-70" : ""}`}
                        onClick={() => scholarship.link && window.open(scholarship.link, "_blank", "noopener,noreferrer")}
                      >
                        Learn More
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}