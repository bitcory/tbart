import React from 'react';
import { Image, Users, Eye, Heart, TrendingUp, Clock } from 'lucide-react';
import { useStats } from '../../hooks/useStats';
import { useAllArtPieces } from '../../hooks/useArtPieces';

const AdminDashboard: React.FC = () => {
  const { stats, isLoading: statsLoading } = useStats();
  const { artPieces, isLoading: artsLoading } = useAllArtPieces();

  const statsCards = [
    {
      label: '총 아트',
      value: stats?.totalArtPieces || artPieces.length || 0,
      icon: Image,
      color: 'bg-indigo-500'
    },
    {
      label: '총 사용자',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      label: '총 조회수',
      value: stats?.totalViews || 0,
      icon: Eye,
      color: 'bg-blue-500'
    },
    {
      label: '총 좋아요',
      value: stats?.totalLikes || 0,
      icon: Heart,
      color: 'bg-pink-500'
    }
  ];

  const recentArts = artPieces.slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">대시보드</h1>
        <p className="text-gray-400 mt-1">TB 아트콜렉션 관리자 페이지</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#151515] border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {statsLoading ? '...' : card.value.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Arts */}
      <div className="bg-[#151515] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">최근 아트</h2>
          <a href="/admin/arts" className="text-indigo-400 text-sm hover:underline">
            전체 보기
          </a>
        </div>

        {artsLoading ? (
          <p className="text-gray-400">로딩 중...</p>
        ) : recentArts.length > 0 ? (
          <div className="space-y-4">
            {recentArts.map((art) => (
              <div
                key={art.id}
                className="flex items-center gap-4 p-3 bg-[#1a1a1a] rounded-lg"
              >
                <img
                  src={art.imageUrls[0]}
                  alt={art.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{art.title}</p>
                  <p className="text-gray-400 text-sm truncate">{art.author}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {art.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {art.likes}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Image className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">아직 등록된 아트가 없습니다</p>
            <a
              href="/admin/arts"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              첫 아트 추가하기
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
