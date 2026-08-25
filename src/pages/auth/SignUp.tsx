import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Brain, Briefcase, User, ArrowRight, Mail, Lock, UserCircle, Target, CheckCircle, TrendingUp } from 'lucide-react';

// Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// 3D Floating Card Component
const FloatingCard = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div
    className={`floating-card ${className}`}
    style={{ animationDelay: `${delay}s` }}
  >
    {children}
  </div>
);

// 3D Visual Scene for Sign Up
const Visual3DScene = () => (
  <div className="relative w-full h-full flex items-center justify-center perspective-1000">
    {/* Background Gradient Orbs */}
    <div className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-purple-400/30 to-indigo-600/20 blur-3xl animate-pulse-slow" />
    <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s', top: '10%', right: '15%' }} />
    <div className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s', bottom: '20%', left: '10%' }} />
    
    {/* 3D Floating Cards Container */}
    <div className="relative transform-3d-scene">
      {/* Main Hero Card - Career Growth */}
      <FloatingCard className="absolute z-30 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" delay={0}>
        <div className="w-72 md:w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Start Your Journey</h3>
              <p className="text-sm text-gray-500">Join thousands of professionals</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Matching</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-cyan-600" />
              <span className="text-sm font-medium text-gray-700">Skill Gap Analysis</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">Career Insights</span>
            </div>
          </div>
        </div>
      </FloatingCard>
      
      {/* Floating Success Card - Top Right */}
      <FloatingCard className="absolute z-20 -right-8 -top-16 md:right-4 md:-top-12" delay={0.3}>
        <div className="w-52 md:w-56 bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-white/50 transform rotate-y-[12deg] rotate-x-[-8deg]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">This Week</p>
              <p className="font-bold text-gray-800">+2,847 Hired</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-emerald-400 to-green-500 rounded-sm"
                style={{ height: `${20 + Math.random() * 30}px` }}
              />
            ))}
          </div>
        </div>
      </FloatingCard>
      
      {/* Floating Role Card - Bottom Left */}
      <FloatingCard className="absolute z-10 -left-12 bottom-0 md:-left-8 md:bottom-4" delay={0.5}>
        <div className="w-56 md:w-64 bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-white/50 transform rotate-y-[-12deg] rotate-x-[6deg]">
          <p className="text-xs text-gray-500 mb-3">Choose your path</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Recruiter</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Job Seeker</span>
            </div>
          </div>
        </div>
      </FloatingCard>
      
      {/* Mini Badge Card - Top Left */}
      <FloatingCard className="absolute z-20 -left-4 -top-12 md:left-8 md:-top-8" delay={0.7}>
        <div className="w-44 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg p-3 border border-white/50 transform rotate-y-[8deg] rotate-x-[-4deg]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs">
              ✨
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Smart Hiring</p>
              <p className="text-[10px] text-gray-400">Built for the future</p>
            </div>
          </div>
        </div>
      </FloatingCard>
    </div>
  </div>
);

// Inspirational quotes that rotate
const inspirationalQuotes = [
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
  { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
];

const SignUp = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'recruiter' | 'applicant'>('applicant');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % inspirationalQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'recruiter' ? '/recruiter' : '/applicant');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = () => {
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    window.location.href = `${apiUrl}/api/auth/google?role=${role}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signUp(fullName, email, password, role);
    
    if (result.success) {
      toast({
        title: "Welcome to Recruitment Portal!",
        description: "Your account has been created successfully.",
      });
    } else {
      toast({
        title: "Sign up failed",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/50">
      {/* Left Panel - 3D Visual Scene */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-indigo-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-transparent to-transparent" />
        
        {/* 3D Scene */}
        <div className="relative z-10 w-full h-full flex flex-col">
          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Recruitment Portal</span>
          </div>
          
          {/* 3D Visual */}
          <div className="flex-1 flex items-center justify-center px-8">
            <Visual3DScene />
          </div>
          
          {/* Bottom Text - Rotating Quotes */}
          <div className="absolute bottom-8 left-8 right-8 z-20">
            <div className="min-h-[60px] transition-all duration-500">
              <p className="text-white/80 text-sm italic transition-opacity duration-500" key={quoteIndex}>
                "{inspirationalQuotes[quoteIndex].quote}"
              </p>
              <p className="text-white/50 text-xs mt-1 transition-opacity duration-500">
                — {inspirationalQuotes[quoteIndex].author}
              </p>
            </div>
            {/* Quote indicator dots */}
            <div className="flex gap-1.5 mt-3">
              {inspirationalQuotes.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === quoteIndex ? 'bg-white/80 w-4' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile Header */}
        <div className="lg:hidden px-6 py-4 flex items-center justify-center bg-gradient-to-r from-indigo-950 to-purple-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Recruitment Portal</span>
          </div>
        </div>
        
        {/* Mobile 3D Preview */}
        <div className="lg:hidden h-40 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="transform scale-[0.5] origin-center">
              <div className="w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/50 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Start Your Journey</h3>
                    <p className="text-xs text-gray-500">Join today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="w-full max-w-md auth-form-enter">
            {/* Auth Card */}
            <div className="auth-card bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-white/80">
              <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-500">Start your AI-powered hiring journey</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <div className={`relative group transition-all duration-300 ${focused === 'fullName' ? 'transform scale-[1.02]' : ''}`}>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'fullName' ? 'text-purple-500' : 'text-gray-400'}`}>
                      <UserCircle className="w-5 h-5" />
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() => setFocused('fullName')}
                      onBlur={() => setFocused(null)}
                      required
                      className={`h-12 pl-12 pr-4 bg-white/80 border-2 rounded-xl transition-all duration-300 ${
                        focused === 'fullName' 
                          ? 'border-purple-400 ring-4 ring-purple-100 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                  <div className={`relative group transition-all duration-300 ${focused === 'email' ? 'transform scale-[1.02]' : ''}`}>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'email' ? 'text-purple-500' : 'text-gray-400'}`}>
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      required
                      className={`h-12 pl-12 pr-4 bg-white/80 border-2 rounded-xl transition-all duration-300 ${
                        focused === 'email' 
                          ? 'border-purple-400 ring-4 ring-purple-100 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className={`relative group transition-all duration-300 ${focused === 'password' ? 'transform scale-[1.02]' : ''}`}>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focused === 'password' ? 'text-purple-500' : 'text-gray-400'}`}>
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      required
                      minLength={6}
                      className={`h-12 pl-12 pr-4 bg-white/80 border-2 rounded-xl transition-all duration-300 ${
                        focused === 'password' 
                          ? 'border-purple-400 ring-4 ring-purple-100 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Role Selection - Pill Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">I want to</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value) => setRole(value as 'recruiter' | 'applicant')}
                    className="grid grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="recruiter"
                      className={`relative flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        role === 'recruiter' 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]' 
                          : 'bg-white/80 border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value="recruiter" id="recruiter" className="sr-only" />
                      <Briefcase className="w-5 h-5" />
                      <span className="font-semibold">Hire Talent</span>
                    </Label>

                    <Label
                      htmlFor="applicant"
                      className={`relative flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        role === 'applicant' 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-[1.02]' 
                          : 'bg-white/80 border-2 border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <RadioGroupItem value="applicant" id="applicant" className="sr-only" />
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Find Jobs</span>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 group" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/70 text-gray-400">or continue with</span>
                  </div>
                </div>

                {/* Google Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={handleGoogleSignIn}
                >
                  <GoogleIcon />
                  <span className="ml-3 font-medium">Continue with Google</span>
                </Button>

                {/* Sign In Link */}
                <p className="text-center text-gray-500 mt-5">
                  Already have an account?{' '}
                  <Link 
                    to="/signin" 
                    className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-all"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            </div>
            
            {/* Footer */}
            <p className="text-center text-gray-400 text-sm mt-6">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-gray-500 hover:text-gray-700 underline">Terms</a>
              {' '}and{' '}
              <a href="#" className="text-gray-500 hover:text-gray-700 underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
