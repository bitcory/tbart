import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Download, Eye, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserActivity, getArtPiecesByIds } from '../lib/firebase/firestore';
import { ArtPiece, DownloadRecord, ViewRecord } from '../types';
import Navbar from '../components/Navbar';

type TabType = 'likes' | 'downloads' | 'views';

const UserDashboard: React.FC = () => {
  const { user, userData, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('likes');
  const [isLoading, setIsLoading] = useState(true);

  const [likedArts, setLikedArts] = useState<ArtPiece[]>([]);
  const [downloadedArts, setDownloadedArts] = useState<{ art: ArtPiece; record: DownloadRecord }[]>([]);
  const [viewedArts, setViewedArts] = useState<{ art: ArtPiece; record: ViewRecord }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const loadActivity = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const activity = await getUserActivity(user.uid);

        // Load liked arts
        const likedArtPieces = await getArtPiecesByIds(activity.likedArts);
        setLikedArts(likedArtPieces);

        // Load downloaded arts with records
        const downloadedArtIds = [...new Set(activity.downloadedArts.map(d => d.artId))];
        const downloadedArtPieces = await getArtPiecesByIds(downloadedArtIds);
        const downloadedWithRecords = activity.downloadedArts
          .map(record => {
            const art = downloadedArtPieces.find(a => a.id === record.artId);
            return art ? { art, record } : null;
          })
          .filter((item): item is { art: ArtPiece; record: DownloadRecord } => item !== null)
          .sort((a, b) => b.record.downloadedAt.seconds - a.record.downloadedAt.seconds);
        setDownloadedArts(downloadedWithRecords);

        // Load viewed arts with records
        const viewedArtIds = [...new Set(activity.viewedArts.map(v => v.artId))];
        const viewedArtPieces = await getArtPiecesByIds(viewedArtIds);
        const viewedWithRecords = activity.viewedArts
          .map(record => {
            const art = viewedArtPieces.find(a => a.id === record.artId);
            return art ? { art, record } : null;
          })
          .filter((item): item is { art: ArtPiece; record: ViewRecord } => item !== null)
          .sort((a, b) => b.record.viewedAt.seconds - a.record.viewedAt.seconds);
        setViewedArts(viewedWithRecords);
      } catch (error) {
        console.error('Error loading user activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadActivity();
    }
  }, [user]);

  const formatDate = (timestamp: { seconds: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'likes', label: '좋아요', icon: <Heart className="w-4 h-4" />, count: likedArts.length },
    { id: 'downloads', label: '다운로드', icon: <Download className="w-4 h-4" />, count: downloadedArts.length },
    { id: 'views', label: '조회 내역', icon: <Eye className="w-4 h-4" />, count: viewedArts.length }
  ];

  const renderArtGrid = (arts: ArtPiece[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {arts.map((art) => (
        <Link
          key={art.id}
          to={`/?art=${art.id}`}
          className="group relative aspect-square rounded-xl overflow-hidden bg-gray-900"
        >
          <img
            src={art.imageUrls[0]}
            alt={art.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-sm font-medium truncate">{art.title}</p>
              <p className="text-gray-400 text-xs">{art.model}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderArtListWithDate = (items: { art: ArtPiece; record: { artId: string; downloadedAt?: { seconds: number }; viewedAt?: { seconds: number } } }[]) => (
    <div className="space-y-4">
      {items.map((item, index) => (
        <Link
          key={`${item.art.id}-${index}`}
          to={`/?art=${item.art.id}`}
          className="flex items-center gap-4 p-4 bg-[#151515] border border-gray-800 rounded-xl hover:bg-white/5 transition-colors"
        >
          <img
            src={item.art.imageUrls[0]}
            alt={item.art.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{item.art.title}</p>
            <p className="text-gray-500 text-sm truncate">{item.art.prompt}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            {formatDate(item.record.downloadedAt || item.record.viewedAt || { seconds: 0 })}
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="w-12 h-12 rounded-full border-2 border-indigo-500/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {user?.displayName?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{user?.displayName}</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-800'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'likes' && (
              likedArts.length > 0 ? (
                renderArtGrid(likedArts)
              ) : (
                <div className="text-center py-20">
                  <Heart className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">좋아요한 아트가 없습니다</p>
                </div>
              )
            )}

            {activeTab === 'downloads' && (
              downloadedArts.length > 0 ? (
                renderArtListWithDate(downloadedArts)
              ) : (
                <div className="text-center py-20">
                  <Download className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">다운로드 내역이 없습니다</p>
                </div>
              )
            )}

            {activeTab === 'views' && (
              viewedArts.length > 0 ? (
                renderArtListWithDate(viewedArts)
              ) : (
                <div className="text-center py-20">
                  <Eye className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500">조회 내역이 없습니다</p>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
