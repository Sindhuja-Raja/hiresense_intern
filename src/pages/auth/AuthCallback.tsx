import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Callback Page
 * Handles the redirect from OAuth providers (Google, GitHub)
 * Extracts token from URL and logs the user in
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('OAuth authentication failed. Please try again.');
      setTimeout(() => navigate('/auth/signin'), 3000);
      return;
    }

    if (token && role) {
      // Store token and redirect based on role
      localStorage.setItem('token', token);
      
      // Fetch user data and complete login
      completeOAuthLogin(token, role);
    } else {
      setError('Invalid callback. Missing token or role.');
      setTimeout(() => navigate('/auth/signin'), 3000);
    }
  }, [searchParams, navigate]);

  const completeOAuthLogin = async (token: string, role: string) => {
    try {
      // Fetch user data using the token
      const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      // Complete login through AuthContext
      login(token, data.data.user);

      // Redirect based on role
      if (role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/applicant');
      }
    } catch (err) {
      console.error('OAuth login error:', err);
      setError('Failed to complete login. Please try again.');
      localStorage.removeItem('token');
      setTimeout(() => navigate('/auth/signin'), 3000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">{error}</div>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <div className="text-lg font-medium">Completing sign in...</div>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
