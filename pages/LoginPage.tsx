import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginButton from '../components/auth/LoginButton';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        홈으로
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-200">TB</span>
            {' '}아트콜렉션
          </h1>
          <p className="text-gray-400">로그인하여 더 많은 기능을 이용하세요</p>
        </div>

        <div className="bg-[#151515] border border-gray-800 rounded-2xl p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">로그인</h2>
              <p className="text-sm text-gray-400">Google 계정으로 간편하게 시작하세요</p>
            </div>

            <LoginButton className="w-full justify-center" />

            <div className="text-center text-xs text-gray-500">
              로그인 시 <a href="#" className="text-indigo-400 hover:underline">이용약관</a>과{' '}
              <a href="#" className="text-indigo-400 hover:underline">개인정보처리방침</a>에 동의하게 됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
