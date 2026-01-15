import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Heart, Search, Upload, X, Loader2, Link } from 'lucide-react';
import { useAllArtPieces } from '../../hooks/useArtPieces';
import { useAuth } from '../../hooks/useAuth';
import { addArtPiece, updateArtPiece, deleteArtPiece } from '../../lib/firebase/firestore';
import { uploadMultipleImages, deleteMultipleImages } from '../../lib/firebase/storage';
import { ArtPiece, ArtFormData } from '../../types';

const AdminArtPage: React.FC = () => {
  const { artPieces, isLoading, refresh } = useAllArtPieces();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState<ArtPiece | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  // Form state
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

  const filteredArts = artPieces.filter(art =>
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const addImageUrl = () => {
    const url = urlInput.trim();
    if (url && !existingImages.includes(url)) {
      setExistingImages(prev => [...prev, url]);
      setUrlInput('');
    }
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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      let imageUrls = [...existingImages];

      if (selectedFiles.length > 0) {
        setUploadProgress(new Array(selectedFiles.length).fill(0));
        const newUrls = await uploadMultipleImages(
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
        imageUrls = [...imageUrls, ...newUrls];
      }

      if (editingArt) {
        await updateArtPiece(editingArt.id, {
          ...formData,
          imageUrls
        });
      } else {
        await addArtPiece({
          ...formData,
          imageUrls,
          uploadedBy: user.uid
        });
      }

      refresh();
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
      refresh();
    } catch (error) {
      console.error('Error deleting art:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">아트 관리</h1>
          <p className="text-gray-400 mt-1">총 {artPieces.length}개의 아트</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          새 아트 추가
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="아트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#151515] border border-gray-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Art List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredArts.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-[#151515] border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">이미지</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">제목</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">모델</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">상태</th>
                  <th className="text-left text-gray-400 font-medium px-6 py-4">통계</th>
                  <th className="text-right text-gray-400 font-medium px-6 py-4">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredArts.map((art) => (
                  <tr
                    key={art.id}
                    onClick={() => openModal(art)}
                    className="hover:bg-white/5 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <img
                        src={art.imageUrls[0]}
                        alt={art.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{art.title}</p>
                      <p className="text-gray-500 text-sm truncate max-w-xs">{art.prompt}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{art.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        art.isPublished !== false
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {art.isPublished !== false ? '공개' : '비공개'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {art.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" /> {art.likes}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openModal(art); }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(art); }}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {filteredArts.map((art) => (
              <div
                key={art.id}
                onClick={() => openModal(art)}
                className="bg-[#151515] border border-gray-800 rounded-xl p-4 cursor-pointer active:bg-white/5"
              >
                <div className="flex gap-4">
                  <img
                    src={art.imageUrls[0]}
                    alt={art.title}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white font-medium truncate">{art.title}</p>
                      <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${
                        art.isPublished !== false
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {art.isPublished !== false ? '공개' : '비공개'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm truncate mt-1">{art.prompt}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {art.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {art.likes}
                      </span>
                      {art.model && <span>{art.model}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(art); }}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> 수정
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(art); }}
                    className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">아트가 없습니다</p>
        </div>
      )}

      {/* Modal */}
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">이미지</label>
                  <div className="flex bg-gray-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        imageInputMode === 'upload'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      업로드
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        imageInputMode === 'url'
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-3 h-3 inline mr-1" />
                      URL
                    </button>
                  </div>
                </div>

                {/* Existing images preview */}
                <div className="flex flex-wrap gap-3 mb-3">
                  {existingImages.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.map((file, i) => (
                    <div key={`new-${i}`} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
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

                {/* Upload or URL input */}
                {imageInputMode === 'upload' ? (
                  <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors">
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-gray-500 mb-1" />
                      <span className="text-gray-500 text-sm">클릭하여 이미지 업로드</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      placeholder="이미지 URL 입력..."
                      className="flex-1 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      추가
                    </button>
                  </div>
                )}
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">작성자/모델명</label>
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

              {/* Ratio & Published */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">비율</label>
                  <select
                    value={formData.ratio}
                    onChange={(e) => setFormData(prev => ({ ...prev, ratio: e.target.value }))}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1:1">1:1</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="2:3">2:3</option>
                    <option value="3:2">3:2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">공개 여부</label>
                  <select
                    value={formData.isPublished ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.value === 'true' }))}
                    className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="true">공개</option>
                    <option value="false">비공개</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">태그</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-sm flex items-center gap-1"
                    >
                      #{tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3" />
                      </button>
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
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                  >
                    추가
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (existingImages.length === 0 && selectedFiles.length === 0)}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
};

export default AdminArtPage;
