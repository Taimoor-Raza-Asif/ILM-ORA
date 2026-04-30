// frontend/src/microservices/auth/presentation/pages/AuthPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { GraduationCap, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";

// export function AuthPage() {
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const auth = useAuth();

//   // form fields
//   const [loginEmail, setLoginEmail] = useState('');
//   const [loginPassword, setLoginPassword] = useState('');
//   const [regName, setRegName] = useState('');
//   const [regEmail, setRegEmail] = useState('');
//   const [regPassword, setRegPassword] = useState('');
//   const [regConfirm, setRegConfirm] = useState('');

//   const handleSubmit = async (e, type) => {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);

//     try {
//       if (type === 'login') {
//         // FIX 1: Pass an object, not separate strings
//         await auth.login({ 
//           email: loginEmail, 
//           password: loginPassword 
//         });
//       } else {
//         if (regPassword !== regConfirm) throw new Error('Passwords do not match');
        
//         // FIX 2: Pass an object here too
//         await auth.register({
//           email: regEmail,
//           password: regPassword,
//           name: regName
//         });
//       }
//       navigate('/dashboard');
//     } catch (err) {
//       console.error("Auth Error:", err); // Added logging for debugging
//       setError(err.message || 'Authentication failed');
//     } finally {
//       setIsLoading(false);
//     }
//   };


export function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = useAuth();

  // Dual guard system: ref + timestamp
  const submittingRef = React.useRef(false);
  const lastSubmitTimeRef = React.useRef(0);
  const MIN_SUBMIT_INTERVAL = 1000; // 1 second minimum between submissions

  // form fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    
    // GUARD 1: Check if already submitting
    if (submittingRef.current) {
      console.warn('⚠️ Submission already in progress, blocked by ref guard');
      return;
    }

    // GUARD 2: Check timestamp to prevent rapid submissions
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    if (timeSinceLastSubmit < MIN_SUBMIT_INTERVAL) {
      console.warn(`⚠️ Submission blocked: only ${timeSinceLastSubmit}ms since last submit (min: ${MIN_SUBMIT_INTERVAL}ms)`);
      return;
    }

    console.log('✅ Submission allowed:', type);
    
    submittingRef.current = true;
    lastSubmitTimeRef.current = now;
    setError(null);
    setIsLoading(true);

    try {
      if (type === 'login') {
        const user = await auth.login({ 
          email: loginEmail, 
          password: loginPassword 
        });
        navigate(user?.role === "admin" ? "/admin" : "/dashboard");
      } else {
        if (regPassword !== regConfirm) {
          throw new Error('Passwords do not match');
        }
        
        await auth.register({
          email: regEmail,
          password: regPassword,
          name: regName
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
      submittingRef.current = false; // Reset guard
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute top-8 left-4 z-50 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-white hover:bg-white/10"
            type="button"
            onClick={() => navigate("/home")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1620650764255-6797e68c7904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMHN0dWR5aW5nJTIwdW5pdmVyc2l0eXxlbnwxfHx8fDE3NjAyMDQ1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Students"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8">
              <GraduationCap className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Welcome to ILM-ORA</h1>
            <p className="text-xl mb-8 text-white/90">
              Your AI-powered companion for discovering the perfect degree and university match
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span>Personalized career recommendations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span>Comprehensive university insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span>AI-driven decision support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile back button */}
          <div className="mb-4 lg:hidden flex">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              type="button"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          <div className="mb-8 lg:hidden text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ILM-ORA
              </span>
            </div>
          </div>

          <Card className="p-8 shadow-xl border-2">
            {/* Error Message Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={(e) => handleSubmit(e, "register")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must contain 8+ chars, uppercase, lowercase, and number.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        required
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" type="button">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              By signing up, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}