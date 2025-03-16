'use client';

import { useState } from 'react';

interface VerificationCodeFormProps {
  phone: string;
  onVerify: (phone: string, code: string) => Promise<void>;
  onBack: () => void;
}

export default function VerificationCodeForm({ phone, onVerify, onBack }: VerificationCodeFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onVerify(phone, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white p-8 rounded-lg shadow-md" suppressHydrationWarning>
      <h2 className="text-2xl font-bold text-center mb-6">Verify your phone</h2>
      
      <p className="mb-4 text-center text-gray-600">
        We sent a verification code to <span className="font-medium">{phone}</span>
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
          
          <button
            type="button"
            onClick={onBack}
            className="w-full bg-white text-indigo-600 border border-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
} 