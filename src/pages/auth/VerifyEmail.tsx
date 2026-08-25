import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recruiterApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await recruiterApi.verifyEmail(token);
        setStatus('success');
        setMessage(response.data?.message || 'Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. The link may have expired.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Verifying Email...</h2>
              <p className="text-muted-foreground">Please wait while we verify your company email address</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center animate-fade-in">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-700">Email Verified! 🎉</h2>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  You are now a Verified Employer
                </div>
              </div>
              <p className="text-muted-foreground">{message}</p>
              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Your job postings will now show the verified badge, increasing trust with candidates.
                </p>
                <Button 
                  variant="gradient" 
                  size="lg" 
                  onClick={() => navigate('/recruiter/profile')}
                  className="w-full"
                >
                  Go to Profile
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center animate-fade-in">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-700">Verification Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  The verification link may have expired. Please request a new verification email from your profile.
                </p>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => navigate('/recruiter/profile')}
                  className="w-full"
                >
                  Back to Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
