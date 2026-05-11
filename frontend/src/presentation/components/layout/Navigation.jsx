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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./../../../shared/components/ui/tooltip";
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
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { useAuth } from "../../../app/providers/AuthProvider";

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();

  // Public links visible to unauthenticated users
  const publicLinks = [
    { name: "Contact", path: "/about", icon: Mail },
  ];

  const isAdmin = user?.role === "admin";

  // Protected links only for authenticated users
  const authenticatedLinks = [
    { name: "Dashboard", path: "/dashboard", icon: Home, hideForAdmin: true },
    { name: "Quiz", path: "/quiz-intro", icon: ClipboardList, hideForAdmin: true },
    { name: "Universities", path: "/universities", icon: Building2 },
    { name: "Careers", path: "/careers", icon: Briefcase },
    { name: "Feedback", path: "/feedback", icon: MessageSquare },
    { name: "Contact", path: "/about", icon: Mail, hideForAdmin: true },
    { name: "Console", path: "/admin", icon: ShieldCheck, adminOnly: true },
  ];

  const navLinks = isAuthenticated
    ? authenticatedLinks.filter((link) => {
        if (link.adminOnly && !isAdmin) return false;
        if (link.hideForAdmin && isAdmin) return false;
        return true;
      })
    : publicLinks;

  // Split links into left side (primary) and right side (utilities)
  const leftNavLinks = navLinks.filter(link => link.name !== "Feedback" && link.name !== "Contact");
  const rightNavLinks = navLinks.filter(link => link.name === "Feedback" || link.name === "Contact");

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
    <nav className="bg-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between relative">
          
          {/* Logo (Left) */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/ilm-ora-logo.png" alt="ILM-ORA Logo" className="w-10 h-10" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ILM-ORA
            </span>
          </Link>

          {/* Desktop Primary Navigation Links (Center) */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {leftNavLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={location.pathname === link.path ? "default" : "ghost"}
                  className={`py-1.5 px-3 h-9 ${
                    location.pathname === link.path 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-accent"
                  }`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.name}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5">
            {/* Utility Links (Feedback, Contact) */}
            <div className="hidden md:flex items-center gap-1">
              {rightNavLinks.map((link) => (
                <Tooltip key={link.path}>
                  <TooltipTrigger asChild>
                    <Link to={link.path}>
                      <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent">
                        <link.icon className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{link.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-accent" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* User Section */}
            {isAuthenticated ? (
              <>
                {/* Divider before User */}
                <div className="hidden md:block w-[1px] h-6 bg-border/50 mx-2" />
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="hidden md:flex items-center justify-center h-9 w-9 rounded-full border border-border hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.profilePicture || ""} alt={user?.name || "User"} className="object-cover" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
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
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth" className="hidden md:block ml-2">
                <Button className="bg-primary hover:bg-primary/90 h-9 py-1.5 px-4">Get Started</Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-card">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button
                  variant={location.pathname === link.path ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    location.pathname === link.path ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.name}
                </Button>
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            {!isAuthenticated ? (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block mt-4">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            ) : (
              <div className="pt-4 border-t border-border/50 mt-4">
                <div className="flex items-center gap-3 px-2 mb-4">
                   <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profilePicture || ""} alt={user?.name || "User"} className="object-cover" />
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
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 mt-1" 
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