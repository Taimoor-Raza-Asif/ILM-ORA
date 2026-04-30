import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Database,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCog,
  Users,
  Download,
  Activity,
  ShieldCheck,
  AlertTriangle,
  LayoutDashboard,
  MessageSquareText,
  Inbox,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Star
} from "lucide-react";
import { axiosClient } from "@/shared/utils/axiosClient";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const CHART_COLORS = {
  primary: "#2563eb",
  primarySoft: "#60a5fa",
  success: "#16a34a",
  warn: "#f59e0b",
  danger: "#dc2626",
  muted: "#94a3b8",
  accent: "#8b5cf6"
};

const PIE_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warn,
  CHART_COLORS.danger,
  CHART_COLORS.accent,
  CHART_COLORS.muted
];

const toRoleBadgeVariant = (role) => role === "admin" ? "default" : "outline";

const formatDate = (value) => {
  if (!value) return "n/a";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "n/a" : date.toLocaleString();
};

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || "n/a";
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0] || "*"}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

const ADMIN_SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "reviews", label: "Student Reviews", icon: MessageSquareText },
  { id: "contacts", label: "Contact Messages", icon: Inbox }
];

export function AdminDashboard() {
  const [section, setSection] = useState("overview");

  // Overview state
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyRoleId, setBusyRoleId] = useState(null);
  const [hidePii, setHidePii] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Reviews moderation state
  const [reviewUniversities, setReviewUniversities] = useState([]);
  const [selectedReviewUniversity, setSelectedReviewUniversity] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("pending");
  const [moderationReviews, setModerationReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewBusyId, setReviewBusyId] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  // Contact messages state
  const [contactMessages, setContactMessages] = useState([]);
  const [contactTypeFilter, setContactTypeFilter] = useState("all");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactBusyId, setContactBusyId] = useState(null);
  const [contactError, setContactError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, analyticsRes, usersRes, logsRes, auditRes] = await Promise.all([
        axiosClient.get("/admin/dashboard"),
        axiosClient.get("/admin/analytics"),
        axiosClient.get("/admin/users"),
        axiosClient.get("/admin/logs"),
        axiosClient.get("/admin/audit?limit=25")
      ]);
      setDashboard(dashboardRes.data);
      setAnalytics(analyticsRes.data?.analytics || null);
      setUsers(usersRes.data?.users || []);
      setLogs(logsRes.data?.logs || []);
      setAuditEntries(auditRes.data?.entries || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load admin console");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!users.length) {
      setSelectedUser(null);
      return;
    }
    setSelectedUser((current) => {
      if (current && users.some((user) => user._id === current._id)) return current;
      return users[0];
    });
  }, [users]);

  // ---- Reviews moderation ----
  const loadReviewUniversities = useCallback(async () => {
    try {
      const res = await axiosClient.get("/admin/reviews/universities");
      setReviewUniversities(res.data?.universities || []);
    } catch (err) {
      // Non-blocking
    }
  }, []);

  const loadModerationReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewError(null);
    try {
      const params = new URLSearchParams();
      params.set("status", reviewStatusFilter);
      params.set("limit", "100");
      if (selectedReviewUniversity) params.set("university", selectedReviewUniversity);
      const res = await axiosClient.get(`/admin/reviews/moderation?${params.toString()}`);
      setModerationReviews(res.data?.reviews || []);
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to load reviews");
      setModerationReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewStatusFilter, selectedReviewUniversity]);

  useEffect(() => {
    if (section === "reviews") {
      loadReviewUniversities();
      loadModerationReviews();
    }
  }, [section, loadReviewUniversities, loadModerationReviews]);

  const moderateReview = async (review, status) => {
    setReviewBusyId(review._id);
    try {
      await axiosClient.patch(`/admin/reviews/${review._id}/moderate`, { status });
      await Promise.all([loadModerationReviews(), loadReviewUniversities()]);
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to update review");
    } finally {
      setReviewBusyId(null);
    }
  };

  const deleteReview = async (review) => {
    if (!window.confirm("Delete this review permanently? This cannot be undone.")) return;
    setReviewBusyId(review._id);
    try {
      await axiosClient.delete(`/admin/reviews/${review._id}`);
      await Promise.all([loadModerationReviews(), loadReviewUniversities()]);
    } catch (err) {
      setReviewError(err.response?.data?.error || "Failed to delete review");
    } finally {
      setReviewBusyId(null);
    }
  };

  // ---- Contact messages ----
  const loadContactMessages = useCallback(async () => {
    setContactsLoading(true);
    setContactError(null);
    try {
      const params = new URLSearchParams();
      if (contactTypeFilter !== "all") params.set("type", contactTypeFilter);
      params.set("limit", "100");
      const res = await axiosClient.get(`/admin/contact-messages?${params.toString()}`);
      const list = res.data?.messages || [];
      setContactMessages(list);
      setSelectedContact((current) => {
        if (current && list.some((m) => m._id === current._id)) return current;
        return list[0] || null;
      });
    } catch (err) {
      setContactError(err.response?.data?.error || "Failed to load contact messages");
      setContactMessages([]);
      setSelectedContact(null);
    } finally {
      setContactsLoading(false);
    }
  }, [contactTypeFilter]);

  useEffect(() => {
    if (section === "contacts") {
      loadContactMessages();
    }
  }, [section, loadContactMessages]);

  const updateContactStatus = async (messageId, status) => {
    setContactBusyId(messageId);
    try {
      await axiosClient.patch(`/admin/contact-messages/${messageId}/status`, { status });
      await loadContactMessages();
    } catch (err) {
      setContactError(err.response?.data?.error || "Failed to update status");
    } finally {
      setContactBusyId(null);
    }
  };

  const deleteContactMessage = async (messageId) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    setContactBusyId(messageId);
    try {
      await axiosClient.delete(`/admin/contact-messages/${messageId}`);
      await loadContactMessages();
    } catch (err) {
      setContactError(err.response?.data?.error || "Failed to delete message");
    } finally {
      setContactBusyId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      [user.email, user.name, user.role].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [users, search]);

  const alerts = dashboard?.insights?.alerts || [];

  const trackAuditEvent = async (action, details = {}, targetType = "system", targetId = null) => {
    try {
      await axiosClient.post("/admin/audit/event", { action, details, targetType, targetId });
    } catch {
      // Non-blocking for UI actions
    }
  };

  const exportUsersCsv = async () => {
    const header = ["name", "email", "role", "createdAt"];
    const rows = filteredUsers.map((u) => [
      (u.name || "").replace(/,/g, " "),
      (hidePii ? maskEmail(u.email) : (u.email || "")).replace(/,/g, " "),
      u.role || "student",
      u.createdAt || ""
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    await trackAuditEvent("USER_EXPORT_CSV", { count: filteredUsers.length, masked: hidePii }, "user-list");
  };

  const changeUserRole = async (user, nextRole) => {
    setBusyRoleId(user._id);
    try {
      await axiosClient.patch(`/admin/users/${user._id}/role`, { role: nextRole });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update role");
    } finally {
      setBusyRoleId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin console...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5" />
                Admin Access Error
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={loadAll} variant="outline">Retry</Button>
              <Button onClick={() => setError(null)} variant="ghost">Dismiss</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totals = analytics?.totals || dashboard?.stats || { users: 0, universities: 0, reviews: 0 };
  const roleBreakdown = analytics?.roleBreakdown || dashboard?.insights?.roleBreakdown || {};
  const moderation = analytics?.moderation || dashboard?.insights?.moderation || {};
  const cards = [
    { label: "Total Users", value: totals.users ?? 0, icon: Users },
    { label: "Universities", value: totals.universities ?? 0, icon: Database },
    { label: "Total Reviews", value: totals.reviews ?? 0, icon: FileText }
  ];

  // --- Chart datasets ---
  const usersTrendData = (analytics?.trends?.usersByDay || []).map((row) => ({
    date: String(row.date || "").slice(5),
    users: Number(row.users || 0)
  }));
  const reviewsTrendData = (analytics?.trends?.reviewsByDay || []).map((row) => ({
    date: String(row.date || "").slice(5),
    reviews: Number(row.reviews || 0)
  }));
  const activityTrendData = usersTrendData.map((row, idx) => ({
    date: row.date,
    users: row.users,
    reviews: reviewsTrendData[idx]?.reviews ?? 0
  }));
  const moderationChartData = [
    { name: "Pending", value: Number(moderation.pending || 0), color: CHART_COLORS.warn },
    { name: "Approved", value: Number(moderation.approved || 0), color: CHART_COLORS.success },
    { name: "Rejected", value: Number(moderation.rejected || 0), color: CHART_COLORS.danger },
    { name: "Reported", value: Number(moderation.reported || 0), color: CHART_COLORS.accent }
  ];
  const roleChartData = [
    { name: "Admins", value: Number(roleBreakdown.admin || 0), color: CHART_COLORS.primary },
    { name: "Students", value: Number(roleBreakdown.student || 0), color: CHART_COLORS.success },
    { name: "Unknown", value: Number(roleBreakdown.unknown || 0), color: CHART_COLORS.muted }
  ].filter((entry) => entry.value > 0);
  const factorBreakdownData = (analytics?.factorBreakdown || []).map((row) => ({
    factor: row.factor || "General",
    count: Number(row.count || 0),
    avgRating: Number(row.avgRating || 0)
  }));
  const ratingDistributionData = (analytics?.ratingDistribution || []).map((row) => ({
    label: `${row.rating}★`,
    rating: Number(row.rating || 0),
    count: Number(row.count || 0)
  }));
  const funnel = analytics?.funnel || {};
  const funnelData = [
    { stage: "Registered", value: Number(funnel.registered || 0) },
    { stage: "Quiz Completed", value: Number(funnel.quizCompleted || 0) },
    { stage: "Recommendations", value: Number(funnel.recommendationsViewed || 0) },
    { stage: "Feedback", value: Number(funnel.feedbackSubmitted || 0) }
  ];
  const hasAnyTrend = activityTrendData.some((row) => (row.users || 0) + (row.reviews || 0) > 0);
  const hasModerationData = moderationChartData.some((entry) => entry.value > 0);
  const hasRoleData = roleChartData.length > 0;
  const hasFactorData = factorBreakdownData.some((row) => row.count > 0);
  const hasRatingDistribution = ratingDistributionData.some((row) => row.count > 0);
  const hasFunnelData = funnelData.some((entry) => entry.value > 0);

  const refreshCurrentSection = () => {
    if (section === "reviews") {
      loadReviewUniversities();
      loadModerationReviews();
    } else if (section === "contacts") {
      loadContactMessages();
    } else {
      loadAll();
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-2 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">Admin Control Center</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Governance dashboard with moderation, analytics, alerts, and auditability
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {section === "overview" && (
              <Button variant="outline" size="sm" onClick={exportUsersCsv}>
                <Download className="w-4 h-4 mr-2" />
                Export Users
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={refreshCurrentSection}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Admin sub-navbar */}
        <Card className="p-2">
          <div className="flex flex-wrap gap-2">
            {ADMIN_SECTIONS.map((item) => {
              const Icon = item.icon;
              const isActive = section === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSection(item.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </Card>

        {section === "overview" && (
          <>
            {!!alerts.length && (
              <div className="grid md:grid-cols-2 gap-4">
                {alerts.map((alert, index) => (
                  <Card key={`${alert.title}-${index}`} className={alert.severity === "critical" ? "border-destructive" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {alert.severity === "critical" ? <AlertTriangle className="w-5 h-5 text-destructive" /> : <ShieldCheck className="w-5 h-5 text-primary" />}
                        <div>
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.message}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {cards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <card.icon className="w-7 h-7 text-primary" />
                      <Badge variant="outline">Live</Badge>
                    </div>
                    <div className="text-3xl font-bold mb-1">{Number(card.value).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Analytics charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Platform Activity (last 7 days)</CardTitle>
                  <CardDescription>New users and review submissions per day</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  {hasAnyTrend ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityTrendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="reviewsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke={CHART_COLORS.primary}
                          fillOpacity={1}
                          fill="url(#usersGrad)"
                          name="New users"
                        />
                        <Area
                          type="monotone"
                          dataKey="reviews"
                          stroke={CHART_COLORS.success}
                          fillOpacity={1}
                          fill="url(#reviewsGrad)"
                          name="New reviews"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No recent activity to display.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Review Moderation</CardTitle>
                  <CardDescription>Queue status breakdown</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  {hasModerationData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={moderationChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {moderationChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={32} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No moderation data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                  <CardDescription>
                    Admin share: {analytics?.ratios?.adminSharePct ?? 0}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {hasRoleData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {roleChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No role data yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                  <CardDescription>How students rate across all reviews</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {hasRatingDistribution ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingDistributionData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis allowDecimals={false} fontSize={12} />
                        <Tooltip formatter={(value) => [value, "Reviews"]} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {ratingDistributionData.map((entry) => {
                            const color = entry.rating >= 4
                              ? CHART_COLORS.success
                              : entry.rating === 3
                                ? CHART_COLORS.warn
                                : CHART_COLORS.danger;
                            return <Cell key={entry.label} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No ratings to display yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Review Topics Breakdown</CardTitle>
                <CardDescription>
                  Which aspects students talk about most (factor distribution with average rating)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {hasFactorData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={factorBreakdownData}
                      layout="vertical"
                      margin={{ top: 5, right: 24, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" allowDecimals={false} fontSize={12} />
                      <YAxis dataKey="factor" type="category" width={120} fontSize={12} />
                      <Tooltip
                        formatter={(value, key, ctx) => {
                          if (key === "count") return [value, "Reviews"];
                          return value;
                        }}
                        labelFormatter={(label, payload) => {
                          const row = payload?.[0]?.payload;
                          if (!row) return label;
                          return `${label} — avg ${row.avgRating}★`;
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {factorBreakdownData.map((entry, index) => (
                          <Cell key={entry.factor} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No factor data yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Engagement Funnel</CardTitle>
                <CardDescription>
                  Registered → Quiz → Recommendations → Feedback submitted
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {hasFunnelData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="stage" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {funnelData.map((entry, index) => (
                          <Cell key={entry.stage} fill={PIE_PALETTE[index % PIE_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Funnel data will appear once students start engaging.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Role-based control, PII masking, and export audit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search by name, email, role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={hidePii} onCheckedChange={(checked) => setHidePii(Boolean(checked))} />
                      Hide emails (PII safe)
                    </label>
                  </div>

                  <div className="overflow-x-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">Name</th>
                          <th className="text-left p-3">Email</th>
                          <th className="text-left p-3">Role</th>
                          <th className="text-left p-3">Created</th>
                          <th className="text-right p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user._id} className="border-t cursor-pointer hover:bg-muted/30" onClick={() => setSelectedUser(user)}>
                            <td className="p-3">{user.name || "n/a"}</td>
                            <td className="p-3">{hidePii ? maskEmail(user.email) : (user.email || "n/a")}</td>
                            <td className="p-3">
                              <Badge variant={toRoleBadgeVariant(user.role)}>{user.role || "student"}</Badge>
                            </td>
                            <td className="p-3">{formatDate(user.createdAt)}</td>
                            <td className="p-3">
                              <div className="flex justify-end gap-2">
                                {user.role === "admin" ? (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={busyRoleId === user._id}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      changeUserRole(user, "student");
                                    }}
                                  >
                                    Make Student
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    disabled={busyRoleId === user._id}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      changeUserRole(user, "admin");
                                    }}
                                  >
                                    Make Admin
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td className="p-6 text-center text-muted-foreground" colSpan={5}>No users found for current filter.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Moderation KPIs</CardTitle>
                  <CardDescription>Queue control and review quality</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Pending</span><span className="font-semibold">{moderation.pending || 0}</span></div>
                  <div className="flex justify-between"><span>Approved</span><span className="font-semibold">{moderation.approved || 0}</span></div>
                  <div className="flex justify-between"><span>Rejected</span><span className="font-semibold">{moderation.rejected || 0}</span></div>
                  <div className="flex justify-between"><span>Reported</span><span className="font-semibold">{moderation.reported || 0}</span></div>
                  <div className="pt-2 mt-2 border-t flex justify-between text-muted-foreground">
                    <span>Avg reviews / university</span>
                    <span>{analytics?.ratios?.reviewPerUniversity ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Detail</CardTitle>
                  <CardDescription>Selected profile metadata</CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedUser ? (
                    <div className="text-sm text-muted-foreground">No user selected.</div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div><span className="text-muted-foreground">Name:</span> {selectedUser.name || "n/a"}</div>
                      <div><span className="text-muted-foreground">Email:</span> {hidePii ? maskEmail(selectedUser.email) : (selectedUser.email || "n/a")}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Role:</span>
                        <Badge variant={toRoleBadgeVariant(selectedUser.role)}>{selectedUser.role || "student"}</Badge>
                      </div>
                      <div><span className="text-muted-foreground">Created:</span> {formatDate(selectedUser.createdAt)}</div>
                      <div><span className="text-muted-foreground">User ID:</span> {selectedUser._id}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Activity
                  </CardTitle>
                  <CardDescription>Generated operational events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-72 overflow-auto">
                  {logs.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No logs available.</div>
                  ) : logs.map((log, index) => (
                    <div key={`${log.timestamp}-${index}`} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={log.level === "warn" || log.level === "critical" ? "destructive" : "outline"}>{log.level || "info"}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</span>
                      </div>
                      <div className="text-sm">{log.message}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>Admin actions for accountability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-72 overflow-auto">
                  {auditEntries.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No audit entries found.</div>
                  ) : auditEntries.map((entry) => (
                    <div key={entry._id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{entry.action}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Actor: {entry.actor?.id || "unknown"} ({entry.actor?.role || "n/a"})
                      </div>
                      {!!entry.details && (
                        <div className="text-xs mt-1 text-muted-foreground break-all">
                          {JSON.stringify(entry.details)}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {section === "reviews" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="w-5 h-5" />
                  Student Review Moderation
                </CardTitle>
                <CardDescription>
                  Approve, reject, or delete reviews submitted by students for a specific university.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">University</label>
                    <select
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={selectedReviewUniversity}
                      onChange={(e) => setSelectedReviewUniversity(e.target.value)}
                    >
                      <option value="">All universities</option>
                      {reviewUniversities.map((u) => (
                        <option key={u.name} value={u.name}>
                          {u.name} ({u.total} total{u.pending ? `, ${u.pending} pending` : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-48">
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <select
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      value={reviewStatusFilter}
                      onChange={(e) => setReviewStatusFilter(e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>

                {reviewError && (
                  <div className="text-sm text-destructive border border-destructive/40 rounded-md p-3">
                    {reviewError}
                  </div>
                )}

                {reviewsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading reviews...</div>
                ) : moderationReviews.length === 0 ? (
                  <div className="text-sm text-muted-foreground border rounded-md p-6 text-center">
                    No reviews match the current filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {moderationReviews.map((review) => {
                      const text = review.reviewText || review.review_text || "(no content)";
                      const status = review.moderationStatus || (review.isApproved ? "approved" : "pending");
                      const statusVariant = status === "approved"
                        ? "default"
                        : status === "rejected"
                          ? "destructive"
                          : "outline";
                      return (
                        <div key={review._id} className="border rounded-md p-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{review.university || "Unknown"}</Badge>
                              <Badge variant="outline">{review.factor || "General"}</Badge>
                              <Badge variant={statusVariant}>{status}</Badge>
                              {review.isReported && <Badge variant="destructive">Reported</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{text}</p>
                          <div className="text-xs text-muted-foreground">
                            By {review.authorName || "Anonymous"}
                            {review.city ? ` • ${review.city}` : ""}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {status !== "approved" && (
                              <Button
                                size="sm"
                                disabled={reviewBusyId === review._id}
                                onClick={() => moderateReview(review, "approved")}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {status !== "rejected" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewBusyId === review._id}
                                onClick={() => moderateReview(review, "rejected")}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={reviewBusyId === review._id}
                              onClick={() => deleteReview(review)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {section === "contacts" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="w-5 h-5" />
                  Contact Messages
                </CardTitle>
                <CardDescription>
                  Messages and feedback submitted by students through the contact form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "contact", label: "Contact" },
                    { id: "feedback", label: "Feedback" }
                  ].map((opt) => (
                    <Button
                      key={opt.id}
                      size="sm"
                      variant={contactTypeFilter === opt.id ? "default" : "outline"}
                      onClick={() => setContactTypeFilter(opt.id)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>

                {contactError && (
                  <div className="text-sm text-destructive border border-destructive/40 rounded-md p-3">
                    {contactError}
                  </div>
                )}

                {contactsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : contactMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground border rounded-md p-6 text-center">
                    No contact messages yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
                    {contactMessages.map((msg) => {
                      const isSelected = selectedContact?._id === msg._id;
                      const fromName = msg.name || msg.userName || "Anonymous";
                      const fromEmail = msg.email || msg.userEmail || "n/a";
                      const preview = msg.type === "feedback"
                        ? (msg.comments || "(no comments)")
                        : (msg.message || msg.subject || "(no content)");
                      return (
                        <button
                          type="button"
                          key={msg._id}
                          onClick={() => setSelectedContact(msg)}
                          className={`w-full text-left border rounded-md p-3 transition ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={msg.type === "feedback" ? "secondary" : "outline"}>
                                {msg.type === "feedback" ? "Feedback" : "Contact"}
                              </Badge>
                              {msg.status && msg.status !== "new" && (
                                <Badge variant="outline">{msg.status}</Badge>
                              )}
                              {msg.type === "feedback" && msg.ratings?.overall ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  {msg.ratings.overall}/5
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                          </div>
                          <div className="text-sm font-medium">{fromName}</div>
                          <div className="text-xs text-muted-foreground">{fromEmail}</div>
                          <div className="text-sm mt-1 line-clamp-2">{preview}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Detail</CardTitle>
                <CardDescription>Review, mark as read, or delete the selected message.</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedContact ? (
                  <div className="text-sm text-muted-foreground">No message selected.</div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={selectedContact.type === "feedback" ? "secondary" : "outline"}>
                        {selectedContact.type === "feedback" ? "Feedback" : "Contact"}
                      </Badge>
                      <Badge variant="outline">{selectedContact.status || "new"}</Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">From</div>
                      <div className="font-medium">{selectedContact.name || selectedContact.userName || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {selectedContact.email || selectedContact.userEmail || "n/a"}
                      </div>
                      {selectedContact.phone && (
                        <div className="text-xs text-muted-foreground">Phone: {selectedContact.phone}</div>
                      )}
                    </div>
                    {selectedContact.subject && (
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">Subject</div>
                        <div>{selectedContact.subject}</div>
                      </div>
                    )}
                    {selectedContact.type === "feedback" && selectedContact.ratings && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {["ux", "accuracy", "overall"].map((key) => (
                          <div key={key} className="border rounded-md p-2">
                            <div className="text-xs text-muted-foreground capitalize">{key}</div>
                            <div className="font-semibold">{selectedContact.ratings?.[key] ?? 0}/5</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="text-muted-foreground text-xs mb-0.5">
                        {selectedContact.type === "feedback" ? "Comments" : "Message"}
                      </div>
                      <div className="whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                        {selectedContact.type === "feedback"
                          ? (selectedContact.comments || "(no comments)")
                          : (selectedContact.message || "(no content)")}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Received: {formatDate(selectedContact.createdAt)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.status !== "read" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={contactBusyId === selectedContact._id}
                          onClick={() => updateContactStatus(selectedContact._id, "read")}
                        >
                          Mark as Read
                        </Button>
                      )}
                      {selectedContact.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={contactBusyId === selectedContact._id}
                          onClick={() => updateContactStatus(selectedContact._id, "archived")}
                        >
                          Archive
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={contactBusyId === selectedContact._id}
                        onClick={() => deleteContactMessage(selectedContact._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
