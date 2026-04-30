// frontend/src/presentation/components/layout/Navigation.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./../../../shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./../../../shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./../../../shared/components/ui/dropdown-menu";
import {
  GraduationCap,
  Home,
  ClipboardList,
  Building2,
  Briefcase,
  Mail,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from "lucide-react";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { useAuth } from "../../../app/providers/AuthProvider";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Destructure user along with isAuthenticated and logout
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();

  // Public links visible to unauthenticated users
  const publicLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Contact", path: "/about", icon: Mail },
  ];

  const isAdmin = user?.role === "admin";

  // Protected links only for authenticated users
  const authenticatedLinks = [
    { name: "Dashboard", path: "/dashboard", icon: Home, hideForAdmin: true },
    { name: "Quiz", path: "/quiz-intro", icon: ClipboardList, hideForAdmin: true },
    { name: "Universities", path: "/universities", icon: Building2 },
    { name: "Careers", path: "/careers", icon: Briefcase },
    { name: "Feedback", path: "/feedback", icon: Mail },
    { name: "Contact", path: "/about", icon: Mail, hideForAdmin: true },
    { name: "Console", path: "/admin", icon: ShieldCheck, adminOnly: true },
  ];

  // Determine which links to show based on auth state and role
  const navLinks = isAuthenticated
    ? authenticatedLinks.filter((link) => {
        if (link.adminOnly && !isAdmin) return false;
        if (link.hideForAdmin && isAdmin) return false;
        return true;
      })
    : publicLinks;

  // Helper to generate initials from name (e.g., "Demo User" -> "DU")
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12  flex items-center justify-center">
              <img src="/ilm-ora-logo.png" alt="ILM-ORA Logo" className="w-12 h-12" />
            </div>
            <span className="text-2xl mt-2 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ILM-ORA
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={location.pathname === link.path ? "default" : "ghost"}
                  className={location.pathname === link.path ? "bg-primary" : ""}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            {/* Desktop: Show User Menu and Logout if Authenticated, else Show Login Button */}
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden md:flex text-red-600 hover:text-red-600 hover:bg-red-100/10" 
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src="" alt={user?.name || "User"} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.name && <p className="font-medium">{user.name}</p>}
                      {user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant={location.pathname === link.path ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    location.pathname === link.path ? "bg-primary" : ""
                  }`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.name}
                </Button>
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            {!isAuthenticated ? (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-primary hover:bg-primary/90 mt-4">
                  Get Started
                </Button>
              </Link>
            ) : (
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center gap-3 px-2 mb-4">
                   <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                   </Avatar>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                   </div>
                </div>
                {!isAdmin && (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100/10" 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}