import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const hasAttempted = React.useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified correctly!');
          
          // Optionally, wait a few seconds and then navigate to login
          setTimeout(() => {
            navigate('/auth');
          }, 4000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The token might be expired or invalid.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage('Network error during verification.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl shadow-bloom-pink/50 border border-gray-50 flex flex-col space-y-6 text-center"
      >
        <div className="flex justify-center">
          {status === 'loading' && <Loader2 className="w-16 h-16 text-bloom-rose animate-spin" />}
          {status === 'success' && <CheckCircle className="w-16 h-16 text-green-500" />}
          {status === 'error' && <XCircle className="w-16 h-16 text-red-500" />}
        </div>
        
        <h2 className={cn("text-2xl font-bold", 
          status === 'loading' ? "text-gray-800" :
          status === 'success' ? "text-green-600" : "text-red-600"
        )}>
          {status === 'loading' ? 'Verifying...' : 
           status === 'success' ? 'Verified!' : 'Verification Failed'}
        </h2>
        
        <p className="text-gray-600">
          {message}
        </p>
        
        {status === 'success' && (
          <p className="text-sm text-gray-400">
            Redirecting to login page...
          </p>
        )}
        
        {status === 'error' && (
          <Link 
            to="/auth" 
            className="w-full mt-4 bg-bloom-rose text-white py-3 rounded-full font-bold hover:bg-bloom-rose/90 transition-all shadow-md flex justify-center text-center"
          >
            Go to Login
          </Link>
        )}
      </motion.div>
    </div>
  );
}
