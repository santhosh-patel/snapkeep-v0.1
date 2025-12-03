import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import logoImage from '@/assets/logo.png';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({ title: "Login failed", description: "Invalid email or password", variant: "destructive" });
          } else {
            toast({ title: "Login failed", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Welcome back!", description: "You have been logged in successfully" });
          navigate('/browse');
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          }
        });
        if (error) {
          if (error.message.includes('User already registered')) {
            toast({ title: "Sign up failed", description: "This email is already registered. Try logging in instead.", variant: "destructive" });
          } else {
            toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Account created!", description: "You can now log in with your credentials" });
          navigate('/browse');
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/browse`,
        }
      });
      if (error) {
        toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/browse');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-area-top safe-area-bottom">
      {/* Logo */}
      <div className="mb-8 animate-float">
        <img src={logoImage} alt="SnapKeep" className="w-20 h-20" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        {isLogin ? 'Sign in to access your documents' : 'Sign up to secure your documents'}
      </p>

      {/* Google Sign In */}
      <Button
        onClick={handleGoogleAuth}
        variant="outline"
        size="lg"
        className="w-full max-w-sm mb-4 gap-3"
        disabled={isLoading}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center gap-4 w-full max-w-sm my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email Form */}
      <form onSubmit={handleEmailAuth} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            isLogin ? 'Sign In' : 'Sign Up'
          )}
        </Button>
      </form>

      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground"
      >
        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>

      <button
        onClick={handleSkip}
        className="mt-6 text-sm text-primary hover:underline"
      >
        Skip for now
      </button>

      <p className="text-xs text-muted-foreground mt-8 text-center max-w-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}