import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Download, Eye, ArrowLeft, Loader2, Calendar, Plus, Pencil, Trash2, Upload, Link as LinkIcon, X, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserActivity, getArtPiecesByIds, addArtPiece, updateArtPiece, deleteArtPiece, getAllArtPieces } from '../lib/firebase/firestore';
import { uploadMultipleImages, deleteMultipleImages } from '../lib/firebase/storage';
import { ArtPiece, DownloadRecord, ViewRecord, ArtFormData } from '../types';
import Navbar from '../components/Navbar';

type TabType = 'likes' | 'downloads' | 'views' | 'artManage';

const ADMIN_EMAILS = ['ggamsire@gmail.com'];

const UserDashboard: React.FC = () => {
  const { user, userData, isLoading: authLoading, isAdmin: storeIsAdmin } = useAuth();

  // Fallback: check email directly if Firestore fails
  const isAdmin = storeIsAdmin || (user?.email && ADMIN_EMAILS.includes(user.email));
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('likes');
  const [isLoading, setIsLoading] = useState(true);

  const [likedArts, setLikedArts] = useState<ArtPiece[]>([]);
  const [downloadedArts, setDownloadedArts] = useState<{ art: ArtPiece; record: DownloadRecord }[]>([]);
  const [viewedArts, setViewedArts] = useState<{ art: ArtPiece; record: ViewRecord }[]>([]);

  // Admin state
  const [allArts, setAllArts] = useState<ArtPiece[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState<ArtPiece | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ArtFormData>({
    title: '',
    prompt: '',
    negativePrompt: '',
    author: '',
    model: '',
    ratio: '1:1',
    tags: [],
    isPublished: true
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  // Load all arts for admin
  useEffect(() => {
    const loadAllArts = async () => {
      if (!isAdmin) return;
      try {
        const arts = await getAllArtPieces();
        setAllArts(arts);
      } catch (error) {
        console.error('Error loading arts:', error);
      }
    };
    loadAllArts();
  }, [isAdmin]);

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

  // Admin functions
  const resetForm = () => {
    setFormData({
      title: '',
      prompt: '',
      negativePrompt: '',
      author: '',
      model: '',
      ratio: '1:1',
      tags: [],
      isPublished: true
    });
    setSelectedFiles([]);
    setExistingImages([]);
    setTagInput('');
    setUrlInput('');
    setImageInputMode('upload');
    setEditingArt(null);
  };

  const openModal = (art?: ArtPiece) => {
    if (art) {
      setEditingArt(art);
      setFormData({
        title: art.title,
        prompt: art.prompt,
        negativePrompt: art.negativePrompt || '',
        author: art.author,
        model: art.model,
        ratio: art.ratio,
        tags: art.tags,
        isPublished: art.isPublished ?? true
      });
      setExistingImages(art.imageUrls);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      setImageInputMode('upload');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const addImageUrl = () => {
    const url = urlInput.trim();
    if (url && !existingImages.includes(url)) {
      setExistingImages(prev => [...prev, url]);
      setUrlInput('');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      let imageUrls = [...existingImages];
      let originalUrls = [...(editingArt?.originalUrls || existingImages)]; // fallback to existing for old data

      if (selectedFiles.length > 0) {
        setUploadProgress(new Array(selectedFiles.length).fill(0));
        const uploaded = await uploadMultipleImages(
          selectedFiles,
          `arts/${Date.now()}`,
          (index, progress) => {
            setUploadProgress(prev => {
              const updated = [...prev];
              updated[index] = progress;
              return updated;
            });
          }
        );
        imageUrls = [...imageUrls, ...uploaded.thumbnailUrls];
        originalUrls = [...originalUrls, ...uploaded.originalUrls];
      }

      if (editingArt) {
        await updateArtPiece(editingArt.id, { ...formData, imageUrls, originalUrls });
      } else {
        await addArtPiece({ ...formData, imageUrls, originalUrls, uploadedBy: user.uid });
      }

      // Reload arts
      const arts = await getAllArtPieces();
      setAllArts(arts);
      closeModal();
    } catch (error) {
      console.error('Error saving art:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress([]);
    }
  };

  const handleDelete = async (art: ArtPiece) => {
    if (!confirm(`"${art.title}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await deleteMultipleImages(art.imageUrls);
      await deleteArtPiece(art.id);
      setAllArts(prev => prev.filter(a => a.id !== art.id));
    } catch (error) {
      console.error('Error deleting art:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
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
    { id: 'views', label: '조회 내역', icon: <Eye className="w-4 h-4" />, count: viewedArts.length },
    ...(isAdmin ? [{ id: 'artManage' as TabType, label: '아트 관리', icon: <Settings className="w-4 h-4" />, count: allArts.length }] : [])
  ];

  const renderArtGrid = (arts: ArtPiece[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
      {arts.map((art) => (
        <Link
          key={art.id}
          to={`/?art=${art.id}`}
          className="group relative aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gray-900"
        >
          <img
            src={art.imageUrls[0]}
            alt={art.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
              <p className="text-white text-xs md:text-sm font-medium truncate">{art.title}</p>
              <p className="text-gray-400 text-xs hidden md:block">{art.model}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderArtListWithDate = (items: { art: ArtPiece; record: { artId: string; downloadedAt?: { seconds: number }; viewedAt?: { seconds: number } } }[]) => (
    <div className="space-y-2 md:space-y-4">
      {items.map((item, index) => (
        <Link
          key={`${item.art.id}-${index}`}
          to={`/?art=${item.art.id}`}
          className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-[#151515] border border-gray-800 rounded-lg md:rounded-xl hover:bg-white/5 transition-colors"
        >
          <img
            src={item.art.imageUrls[0]}
            alt={item.art.title}
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm md:text-base font-medium truncate">{item.art.title}</p>
            <p className="text-gray-500 text-xs md:text-sm truncate">{item.art.prompt}</p>
            <p className="text-gray-600 text-xs mt-1 md:hidden">
              {formatDate(item.record.downloadedAt || item.record.viewedAt || { seconds: 0 })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm shrink-0">
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

      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || ''}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-indigo-500/50 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-white text-base md:text-lg font-bold">
                  {user?.displayName?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-white truncate">{user?.displayName}</h1>
              <p className="text-gray-400 text-xs md:text-sm truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs - Horizontal scroll on mobile */}
        <div className="flex gap-2 mb-6 md:mb-8 border-b border-gray-800 pb-3 md:pb-4 overflow-x-auto hide-scrollbar -mx-3 px-3 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
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

            {activeTab === 'artManage' && isAdmin && (
              <div>
                {/* Add button */}
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    새 아트 추가
                  </button>
                </div>

                {/* Art List */}
                {allArts.length > 0 ? (
                  <div className="space-y-3">
                    {allArts.map((art) => (
                      <div key={art.id} className="flex items-center gap-4 p-4 bg-[#151515] border border-gray-800 rounded-xl">
                        <img src={art.imageUrls[0]} alt={art.title} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{art.title}</p>
                          <p className="text-gray-500 text-sm truncate">{art.prompt}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Eye className="w-4 h-4" /> {art.views}
                          <Heart className="w-4 h-4 ml-2" /> {art.likes}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(art)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(art)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Settings className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">등록된 아트가 없습니다</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Art Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-[#151515] border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">
                  {editingArt ? '아트 수정' : '새 아트 추가'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Images */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">이미지</label>
                    <div className="flex bg-gray-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setImageInputMode('upload')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          imageInputMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3 inline mr-1" />업로드
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageInputMode('url')}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          imageInputMode === 'url' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3 inline mr-1" />URL
                      </button>
                    </div>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div className={`relative rounded-xl border-2 border-dashed transition-all mb-3 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700'
                  }`}>
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/20 rounded-xl z-10">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <p className="text-indigo-400 font-medium">이미지를 여기에 놓으세요</p>
                        </div>
                      </div>
                    )}

                    {/* Image Preview Grid */}
                    {(existingImages.length > 0 || selectedFiles.length > 0) && (
                      <div className="flex flex-wrap gap-3 p-3">
                        {existingImages.map((url, i) => (
                          <div key={i} className="relative">
                            <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                            <button type="button" onClick={() => removeExistingImage(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                        {selectedFiles.map((file, i) => (
                          <div key={`new-${i}`} className="relative">
                            <img src={URL.createObjectURL(file)} alt="" className="w-20 h-20 rounded-lg object-cover" />
                            <button type="button" onClick={() => removeFile(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-white" />
                            </button>
                            {uploadProgress[i] > 0 && uploadProgress[i] < 100 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                <span className="text-white text-xs">{Math.round(uploadProgress[i])}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Area */}
                    {imageInputMode === 'upload' ? (
                      <label className={`flex items-center justify-center w-full h-24 cursor-pointer hover:bg-white/5 transition-colors ${
                        existingImages.length > 0 || selectedFiles.length > 0 ? 'border-t border-gray-800' : ''
                      }`}>
                        <div className="flex flex-col items-center">
                          <Upload className="w-6 h-6 text-gray-500 mb-1" />
                          <span className="text-gray-500 text-sm">클릭 또는 드래그하여 업로드</span>
                        </div>
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                      </label>
                    ) : (
                      <div className={`flex gap-2 p-3 ${
                        existingImages.length > 0 || selectedFiles.length > 0 ? 'border-t border-gray-800' : ''
                      }`}>
                        <input
                          type="text"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                          placeholder="이미지 URL을 입력하세요..."
                          className="flex-1 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                        />
                        <button type="button" onClick={addImageUrl} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">추가</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">프롬프트</label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                    required
                    rows={4}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Author & Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">작성자</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      required
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">AI 모델</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="GPT-4o, Midjourney..."
                      className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">태그</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm flex items-center gap-1">
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="태그 입력 후 Enter"
                      className="flex-1 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    />
                    <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">추가</button>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">취소</button>
                  <button
                    type="submit"
                    disabled={isSubmitting || (existingImages.length === 0 && selectedFiles.length === 0)}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
