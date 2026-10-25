'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SiteContent, MemoryItem, LoveReason, FutureMilestone } from '@/types/content';
import {
  Settings,
  Heart,
  Image as ImageIcon,
  Mail,
  Send,
  Eye,
  LogOut,
  Save,
  Plus,
  Trash2,
  Menu,
  X,
  Smartphone,
  Upload,
  CheckCircle,
  Sparkles,
  Lock,
  ArrowUp,
  ArrowDown,
  Star,
  Clock,
  Film,
  Play,
  Check,
  Edit3,
  AlertTriangle,
  Layers,
  Filter,
  Camera,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import MemoryPhotoReveal from '@/components/MemoryPhotoReveal';
import {
  isVideoUrl,
  getValidPosterUrl,
  getPlayableVideoUrl,
  generateVideoThumbnail,
} from '@/lib/videoUtils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'opening' | 'memories' | 'letter' | 'reasons' | 'future' | 'reveal' | 'settings'>('general');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewingMemory, setPreviewingMemory] = useState<MemoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [uploadingMemoryId, setUploadingMemoryId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Memories Gallery Manager states
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [isCreatingMemory, setIsCreatingMemory] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<MemoryItem | null>(null);
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>('all');
  const [previewingVideoMemory, setPreviewingVideoMemory] = useState<MemoryItem | null>(null);
  const [isUploadingMediaModal, setIsUploadingMediaModal] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Check auth & load data
  useEffect(() => {
    fetch('/api/auth')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
        } else {
          loadContent();
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  const loadContent = () => {
    fetch('/api/content')
      .then((res) => res.json())
      .then((data) => setContent(data))
      .catch((err) => console.error(err));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('All changes saved and published to live website! ✨');
      } else {
        showToast(data.error || 'Failed to save changes');
      }
    } catch (e) {
      showToast('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    memoryIdOrCallback: string | null | ((url: string) => void),
    maybeCallback?: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let memoryId: string | null = null;
    let callback: ((url: string) => void) | undefined;

    if (typeof memoryIdOrCallback === 'function') {
      callback = memoryIdOrCallback;
      memoryId = null;
    } else {
      memoryId = memoryIdOrCallback;
      callback = maybeCallback;
    }

    if (memoryId) setUploadingMemoryId(memoryId);

    const isHeic = /\.(heic|heif)$/i.test(file.name) || file.type.toLowerCase().includes('heic');
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
    showToast(
      isVideo
        ? 'Uploading video memory (this may take a few moments)... 🎬'
        : isHeic
        ? 'Converting HEIC photograph to web-ready JPEG...'
        : 'Uploading photograph...'
    );

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (callback) callback(data.url);
        if (memoryId) {
          setBrokenImages((prev) => ({ ...prev, [memoryId]: false }));
        }

        // Auto-generate video thumbnail poster on upload
        if (isVideo) {
          try {
            const thumb = await generateVideoThumbnail(file);
            const thumbForm = new FormData();
            const cleanBase = file.name.replace(/\.[^/.]+$/, '');
            thumbForm.append('file', thumb.blob, `${cleanBase}-poster.jpg`);
            const thumbRes = await fetch('/api/upload', { method: 'POST', body: thumbForm });
            const thumbData = await thumbRes.json();
            if (thumbRes.ok && thumbData.url) {
              setEditingMemory((prev) =>
                prev
                  ? {
                      ...prev,
                      videoUrl: data.url,
                      imageUrl: thumbData.url,
                      posterUrl: thumbData.url,
                      thumbnailUrl: thumbData.url,
                      videoDuration: prev.videoDuration || thumb.duration,
                      aspect: prev.aspect || thumb.aspect,
                    }
                  : null
              );
            }
          } catch (tErr) {
            console.warn('Auto poster extraction error:', tErr);
          }
        }

        showToast(
          data.isConvertedHeic
            ? 'HEIC converted & uploaded successfully! Click Save to publish. ✨'
            : isVideo
            ? 'Video & poster thumbnail generated successfully! Click Save to publish. 🎬'
            : 'Photograph uploaded successfully! Click Save to publish. ✨'
        );
      } else {
        showToast(data.error || 'Upload failed. Please check file format and size.');
      }
    } catch (err) {
      showToast('Network error during upload. Please try again.');
    } finally {
      if (memoryId) setUploadingMemoryId(null);
      e.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  const handleOpenAddMemory = () => {
    const newIndex = (content?.chapter3.memories.length || 0) + 1;
    setEditingMemory({
      id: `mem-${Date.now()}`,
      title: 'Our Special Moment',
      mediaType: 'photo',
      imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1200&q=80',
      videoUrl: '',
      posterUrl: '',
      date: 'Today',
      location: 'Our Special Place',
      caption: 'A moment I never want to forget...',
      fullStory: 'The unforgettable story behind this photograph...',
      collection: 'Our Little Adventures',
      displaySize: 'medium',
      featured: false,
      published: true,
      showInStorySection: false,
      starPosition: newIndex,
    });
    setIsCreatingMemory(true);
  };

  const handleOpenEditMemory = (mem: MemoryItem) => {
    setEditingMemory({ ...mem });
    setIsCreatingMemory(false);
  };

  const handleSaveMemoryModal = () => {
    if (!editingMemory || !content) return;
    if (!editingMemory.title.trim()) {
      showToast('Please provide a title for this memory');
      return;
    }
    const list = [...content.chapter3.memories];
    if (isCreatingMemory) {
      setContent({
        ...content,
        chapter3: {
          ...content.chapter3,
          memories: [editingMemory, ...list],
        },
      });
      showToast(`Memory "${editingMemory.title}" added to gallery! ✨ Remember to click Save.`);
    } else {
      const idx = list.findIndex((m) => m.id === editingMemory.id);
      if (idx !== -1) {
        list[idx] = editingMemory;
        setContent({
          ...content,
          chapter3: {
            ...content.chapter3,
            memories: list,
          },
        });
        showToast(`Memory "${editingMemory.title}" updated! ✨ Remember to click Save.`);
      }
    }
    setEditingMemory(null);
    setIsCreatingMemory(false);
  };

  const handleDeleteConfirmed = () => {
    if (!memoryToDelete || !content) return;
    const updated = content.chapter3.memories.filter((m) => m.id !== memoryToDelete.id);
    setContent({
      ...content,
      chapter3: { ...content.chapter3, memories: updated },
    });
    showToast(`Memory "${memoryToDelete.title}" deleted.`);
    setMemoryToDelete(null);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !content) return;

    const filesArray = Array.from(fileList);
    setIsBulkUploading(true);
    showToast(`Uploading ${filesArray.length} memories in bulk... ⚡`);

    const formData = new FormData();
    filesArray.forEach((f) => {
      formData.append('files', f);
    });

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.files && data.files.length > 0) {
        const aspects: ('portrait' | 'square' | 'landscape' | 'tall')[] = [
          'portrait',
          'square',
          'landscape',
          'tall',
        ];
        const newMemories: MemoryItem[] = [];

        for (let idx = 0; idx < data.files.length; idx++) {
          const item = data.files[idx];
          const isVideo = item.mediaType === 'video';
          const originalFile = filesArray.find((f) => f.name === item.originalName) || filesArray[idx];

          let posterUrl: string | undefined = undefined;
          let videoDuration: string | undefined = undefined;
          let chosenAspect = aspects[idx % aspects.length];

          if (isVideo && originalFile) {
            try {
              const thumb = await generateVideoThumbnail(originalFile);
              videoDuration = thumb.duration;
              chosenAspect = thumb.aspect;
              const thumbForm = new FormData();
              const cleanBase = originalFile.name.replace(/\.[^/.]+$/, '');
              thumbForm.append('file', thumb.blob, `${cleanBase}-poster.jpg`);
              const thumbRes = await fetch('/api/upload', { method: 'POST', body: thumbForm });
              const thumbData = await thumbRes.json();
              if (thumbRes.ok && thumbData.url) {
                posterUrl = thumbData.url;
              }
            } catch (tErr) {
              console.warn('Auto poster generation skipped in bulk upload:', tErr);
            }
          }

          const cleanName = item.originalName
            ? item.originalName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
            : `Memory ${Date.now() + idx}`;

          newMemories.push({
            id: `mem-${Date.now()}-${idx}`,
            title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
            mediaType: isVideo ? 'video' : 'photo',
            imageUrl: posterUrl || item.url,
            videoUrl: isVideo ? item.url : undefined,
            posterUrl: posterUrl,
            thumbnailUrl: posterUrl,
            videoDuration: videoDuration,
            aspect: chosenAspect,
            date: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            caption: 'Captured together in our little universe',
            collection: 'Our Little Adventures',
            displaySize: 'medium',
            featured: false,
            published: true,
            starPosition: (content.chapter3.memories.length || 0) + idx + 1,
            order: (content.chapter3.memories.length || 0) + idx + 1,
          });
        }

        setContent({
          ...content,
          chapter3: {
            ...content.chapter3,
            memories: [...newMemories, ...content.chapter3.memories],
          },
        });
        showToast(`✨ ${newMemories.length} memories added! Remember to click Save Changes.`);
      } else {
        showToast(data.error || 'Bulk upload failed');
      }
    } catch (err) {
      showToast('Network error during bulk upload');
    } finally {
      setIsBulkUploading(false);
      e.target.value = '';
    }
  };

  const handleAutoGeneratePoster = async (mem: MemoryItem) => {
    const videoSrc = getPlayableVideoUrl(mem);
    if (!videoSrc) {
      showToast('No valid video URL found for this memory');
      return;
    }
    showToast(`Generating poster for "${mem.title}"... 📸`);
    try {
      const thumb = await generateVideoThumbnail(videoSrc);
      const thumbForm = new FormData();
      thumbForm.append('file', thumb.blob, `${mem.id}-poster.jpg`);
      const thumbRes = await fetch('/api/upload', { method: 'POST', body: thumbForm });
      const thumbData = await thumbRes.json();
      if (thumbRes.ok && thumbData.url && content) {
        const list = [...content.chapter3.memories];
        const idx = list.findIndex((m) => m.id === mem.id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            posterUrl: thumbData.url,
            thumbnailUrl: thumbData.url,
            imageUrl: thumbData.url,
            videoDuration: list[idx].videoDuration || thumb.duration,
            aspect: list[idx].aspect || thumb.aspect,
          };
          setContent({
            ...content,
            chapter3: { ...content.chapter3, memories: list },
          });
          setBrokenImages((prev) => ({ ...prev, [mem.id]: false }));
          showToast(`Poster generated for "${mem.title}"! Remember to click Save Changes. ✨`);
        }
      } else {
        showToast('Failed to upload generated poster');
      }
    } catch (err: any) {
      showToast(`Poster generation error: ${err.message || 'Check browser video playback'}`);
    }
  };

  const handleCaptureVideoFrame = () => {
    const videoEl = document.getElementById('edit-video-preview') as HTMLVideoElement | null;
    if (!videoEl || !videoEl.videoWidth) {
      showToast('Please wait for video to load, or play/pause at desired frame');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const form = new FormData();
        form.append('file', blob, `${editingMemory?.id || 'video'}-poster.jpg`);
        showToast('Saving captured frame as poster... 📸');
        const res = await fetch('/api/upload', { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok && data.url && editingMemory) {
          setEditingMemory({
            ...editingMemory,
            posterUrl: data.url,
            thumbnailUrl: data.url,
            imageUrl: data.url,
          });
          showToast('Frame captured and set as poster! ✨');
        } else {
          showToast('Failed to save captured frame');
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      showToast('Could not capture frame from video');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Admin password updated successfully');
        setNewPassword('');
      } else {
        showToast(data.error || 'Failed to update password');
      }
    } catch (e) {
      showToast('Password update error');
    }
  };

  if (!content) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090a14',
          color: 'var(--color-gold)',
        }}
      >
        <span>Loading Admin Panel...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#090a14',
        color: '#f0f0f5',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Mobile Bar */}
      <header
        style={{
          padding: '14px 20px',
          background: 'rgba(18, 14, 28, 0.95)',
          borderBottom: '1px solid rgba(243, 207, 122, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn-icon"
            style={{ width: '40px', height: '40px' }}
            aria-label="Toggle navigation drawer"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--color-champagne)' }}>
              Aether Love Admin
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
              Curating {content.general.recipientName}&apos;s Birthday
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowPreviewModal(true)}
            className="btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.78rem', minHeight: '38px' }}
            title="Preview Mobile Site"
          >
            <Smartphone size={14} />
            <span>Preview</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem', minHeight: '38px' }}
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Navigation Drawer (Sidebar on desktop, slide-over on mobile) */}
        <aside
          style={{
            position: isMobileMenuOpen ? 'fixed' : 'relative',
            inset: isMobileMenuOpen ? '0 auto 0 0' : 'auto',
            width: isMobileMenuOpen ? '280px' : '240px',
            background: 'rgba(14, 11, 24, 0.98)',
            borderRight: '1px solid rgba(243, 207, 122, 0.15)',
            zIndex: 60,
            display: isMobileMenuOpen ? 'block' : 'none',
            padding: '20px 14px',
            boxShadow: isMobileMenuOpen ? '0 0 30px rgba(0,0,0,0.8)' : 'none',
          }}
          className="admin-sidebar"
        >
          <div style={{ marginBottom: '20px', paddingLeft: '8px' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-gold)', letterSpacing: '0.08em' }}>
              Management Chapters
            </span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'general', label: 'General Info', icon: Heart },
              { id: 'opening', label: 'Ch 1: Opening Envelope', icon: Sparkles },
              { id: 'memories', label: 'Ch 2 & 3: Memories & 3D', icon: ImageIcon },
              { id: 'letter', label: 'Ch 4: Letter & Audio', icon: Mail },
              { id: 'reasons', label: 'Ch 5: Reasons I Love You', icon: Heart },
              { id: 'future', label: 'Ch 6: Live Story Counter', icon: Clock },
              { id: 'reveal', label: 'Ch 7: Final Reveal', icon: Sparkles },
              { id: 'settings', label: 'Theme & Visibility', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isActive ? 'linear-gradient(135deg, rgba(226, 88, 127, 0.3) 0%, rgba(243, 207, 122, 0.15) 100%)' : 'transparent',
                    border: isActive ? '1px solid var(--color-gold)' : '1px solid transparent',
                    color: isActive ? 'var(--color-gold)' : 'var(--text-muted)',
                    fontSize: '0.88rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                color: 'var(--color-blush)',
                textDecoration: 'none',
                fontSize: '0.85rem',
              }}
            >
              <Eye size={16} />
              <span>View Live Website</span>
            </Link>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                color: 'var(--text-faint)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Content Editor Panel */}
        <main style={{ flex: 1, padding: '24px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {/* Mobile Tab Quick Selector (Always visible on mobile) */}
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '8px',
              paddingBottom: '14px',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {[
              { id: 'general', label: 'General' },
              { id: 'opening', label: 'Opening' },
              { id: 'memories', label: 'Photos' },
              { id: 'letter', label: 'Letter' },
              { id: 'reasons', label: 'Reasons' },
              { id: 'future', label: 'Future' },
              { id: 'reveal', label: 'Reveal' },
              { id: 'settings', label: 'Settings' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: activeTab === t.id ? 'var(--color-rose)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === t.id ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '16px' }}>
                General Love Story Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Recipient&apos;s Full Name
                  </label>
                  <input
                    type="text"
                    value={content.general.recipientName}
                    onChange={(e) =>
                      setContent({ ...content, general: { ...content.general, recipientName: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Sweet Nickname (Shown in floating badges)
                  </label>
                  <input
                    type="text"
                    value={content.general.recipientNickname}
                    onChange={(e) =>
                      setContent({ ...content, general: { ...content.general, recipientNickname: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Partner Signature Name
                  </label>
                  <input
                    type="text"
                    value={content.general.partnerName}
                    onChange={(e) =>
                      setContent({ ...content, general: { ...content.general, partnerName: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Occasion / Date Note
                  </label>
                  <input
                    type="text"
                    value={content.general.occasion}
                    onChange={(e) =>
                      setContent({ ...content, general: { ...content.general, occasion: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPENING CHAPTER */}
          {activeTab === 'opening' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '16px' }}>
                Chapter 1: The Cinematic Opening
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Top Badge Text
                  </label>
                  <input
                    type="text"
                    value={content.chapter1.badge}
                    onChange={(e) =>
                      setContent({ ...content, chapter1: { ...content.chapter1, badge: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Opening Headline
                  </label>
                  <input
                    type="text"
                    value={content.chapter1.headline}
                    onChange={(e) =>
                      setContent({ ...content, chapter1: { ...content.chapter1, headline: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Opening Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={content.chapter1.subtitle}
                    onChange={(e) =>
                      setContent({ ...content, chapter1: { ...content.chapter1, subtitle: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Entrance Button Call to Action
                  </label>
                  <input
                    type="text"
                    value={content.chapter1.ctaText}
                    onChange={(e) =>
                      setContent({ ...content, chapter1: { ...content.chapter1, ctaText: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEDICATED MEMORIES GALLERY MANAGER (CHAPTER 2 & 3) */}
          {activeTab === 'memories' && (() => {
            const allCollections = Array.from(
              new Set([
                'Our Little Adventures',
                'The Moments I Replay',
                'Just You Being You',
                ...(content.chapter2?.collections || []),
                ...content.chapter3.memories.map((m) => m.collection).filter(Boolean) as string[],
              ])
            );

            const filteredMemories =
              selectedCollectionFilter === 'all'
                ? content.chapter3.memories
                : content.chapter3.memories.filter(
                    (m) => (m.collection || 'Our Little Adventures') === selectedCollectionFilter
                  );

            const totalCount = content.chapter3.memories.length;
            const publishedCount = content.chapter3.memories.filter((m) => m.published !== false).length;
            const draftCount = content.chapter3.memories.filter((m) => m.published === false).length;
            const videoCount = content.chapter3.memories.filter((m) => m.mediaType === 'video').length;
            const photoCount = totalCount - videoCount;
            const featuredCount = content.chapter3.memories.filter((m) => m.featured).length;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Header with Title and Add Button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--color-rose-glow)',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      Chapter 2 &amp; 3 Management
                    </span>
                    <h2
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.45rem',
                        color: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>Memories Gallery Manager</span>
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Curate photographs, cinematic videos, display sizes, and stories for &ldquo;Every Little Moment, Forever Ours&rdquo;.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <label
                      className="btn-outline"
                      style={{
                        padding: '10px 18px',
                        fontSize: '0.85rem',
                        minHeight: '42px',
                        cursor: isBulkUploading ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(243, 207, 122, 0.1)',
                        borderColor: 'var(--color-gold)',
                        color: 'var(--color-gold)',
                      }}
                    >
                      <Upload size={16} />
                      <span>{isBulkUploading ? 'Uploading Memories...' : '⚡ Bulk Upload (Multi-Select)'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*,.heic,.heif"
                        disabled={isBulkUploading}
                        style={{ display: 'none' }}
                        onChange={handleBulkUpload}
                      />
                    </label>

                    <button
                      onClick={handleOpenAddMemory}
                      className="btn-primary"
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.85rem',
                        minHeight: '42px',
                        boxShadow: '0 4px 18px rgba(226, 88, 127, 0.35)',
                      }}
                    >
                      <Plus size={16} />
                      <span>Add New Memory</span>
                    </button>
                  </div>
                </div>

                {/* Gallery Live Stats Bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(18, 14, 28, 0.75)',
                      borderRadius: '10px',
                      border: '1px solid rgba(243, 207, 122, 0.2)',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Memories</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-champagne)' }}>{totalCount}</span>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(18, 14, 28, 0.75)',
                      borderRadius: '10px',
                      border: '1px solid rgba(100, 220, 140, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Published Live</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#7fe3a6' }}>{publishedCount}</span>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(18, 14, 28, 0.75)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 180, 80, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Drafts (Hidden)</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffc875' }}>{draftCount}</span>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(18, 14, 28, 0.75)',
                      borderRadius: '10px',
                      border: '1px solid rgba(243, 207, 122, 0.2)',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Photographs</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-champagne)' }}>{photoCount}</span>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(18, 14, 28, 0.75)',
                      borderRadius: '10px',
                      border: '1px solid rgba(226, 88, 127, 0.25)',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Videos 🎬</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ff92b5' }}>{videoCount}</span>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(18, 14, 28, 0.75)',
                      borderRadius: '10px',
                      border: '1px solid rgba(243, 207, 122, 0.35)',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Featured Finale</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gold)' }}>★ {featuredCount}</span>
                  </div>
                </div>

                {/* Chapter 2 Presentation & Custom Quotes Card */}
                <div
                  className="glass-card"
                  style={{
                    padding: '18px 20px',
                    border: '1px solid rgba(243, 207, 122, 0.25)',
                    background: 'rgba(16, 12, 26, 0.7)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Sparkles size={16} color="var(--color-gold)" />
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--color-champagne)', fontWeight: 600 }}>
                      Chapter 2 Gallery Presentation &amp; Quotes
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                        Gallery Main Heading
                      </label>
                      <input
                        type="text"
                        value={content.chapter2?.heading || content.chapter2?.title || 'Every Little Moment, Forever Ours'}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            chapter2: {
                              ...content.chapter2,
                              heading: e.target.value,
                              title: e.target.value,
                            },
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(10,11,20,0.7)',
                          border: '1px solid rgba(243,207,122,0.25)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                        Gallery Subtitle
                      </label>
                      <input
                        type="text"
                        value={
                          content.chapter2?.subtitle ||
                          'A thousand little moments, countless reasons to smile, and a lifetime of memories I want to keep with you.'
                        }
                        onChange={(e) =>
                          setContent({
                            ...content,
                            chapter2: { ...content.chapter2, subtitle: e.target.value },
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(10,11,20,0.7)',
                          border: '1px solid rgba(243,207,122,0.25)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                        }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                        Final Grand Reveal Quote (Anchors the bottom of Chapter 2)
                      </label>
                      <input
                        type="text"
                        value={
                          content.chapter2?.finalQuote ||
                          "If I could relive a thousand moments, I'd still choose every one with you. ♡"
                        }
                        onChange={(e) =>
                          setContent({
                            ...content,
                            chapter2: { ...content.chapter2, finalQuote: e.target.value },
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(10,11,20,0.7)',
                          border: '1px solid rgba(243,207,122,0.25)',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Story Section Status Callout */}
                <div
                  style={{
                    background: 'rgba(226, 88, 127, 0.1)',
                    border: '1px solid rgba(226, 88, 127, 0.3)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={16} color="#ff92b5" />
                    <span style={{ fontSize: '0.8rem', color: '#ffc5d7' }}>
                      <strong>Story Section:</strong> Below the main collage, exactly 4 handpicked memories with personalized stories are featured.
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      background: 'rgba(226, 88, 127, 0.25)',
                      color: '#ffffff',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                      border: '1px solid rgba(226, 88, 127, 0.4)',
                    }}
                  >
                    {content.chapter3.memories.filter((m) => m.showInStorySection).length} of 4 Selected
                  </span>
                </div>

                {/* Collection Filter Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    paddingBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginRight: '4px',
                    }}
                  >
                    <Filter size={13} />
                    <span>Filter:</span>
                  </span>

                  <button
                    onClick={() => setSelectedCollectionFilter('all')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: selectedCollectionFilter === 'all' ? 600 : 400,
                      background:
                        selectedCollectionFilter === 'all'
                          ? 'linear-gradient(135deg, rgba(243,207,122,0.25) 0%, rgba(226,88,127,0.25) 100%)'
                          : 'rgba(18, 14, 28, 0.7)',
                      border:
                        selectedCollectionFilter === 'all'
                          ? '1px solid var(--color-gold)'
                          : '1px solid rgba(243,207,122,0.2)',
                      color: selectedCollectionFilter === 'all' ? 'var(--color-gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    All ({totalCount})
                  </button>

                  {allCollections.map((col) => {
                    const count = content.chapter3.memories.filter(
                      (m) => (m.collection || 'Our Little Adventures') === col
                    ).length;
                    const isActive = selectedCollectionFilter === col;
                    return (
                      <button
                        key={col}
                        onClick={() => setSelectedCollectionFilter(col)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: isActive ? 600 : 400,
                          background: isActive
                            ? 'linear-gradient(135deg, rgba(243,207,122,0.25) 0%, rgba(226,88,127,0.25) 100%)'
                            : 'rgba(18, 14, 28, 0.7)',
                          border: isActive ? '1px solid var(--color-gold)' : '1px solid rgba(243,207,122,0.2)',
                          color: isActive ? 'var(--color-gold)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {col} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Memories List */}
                {filteredMemories.length === 0 ? (
                  <div
                    style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      background: 'rgba(15, 12, 24, 0.5)',
                      borderRadius: '12px',
                      border: '1px dashed rgba(243, 207, 122, 0.2)',
                    }}
                  >
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px' }}>
                      No memories found in this collection filter.
                    </p>
                    <button onClick={handleOpenAddMemory} className="btn-outline" style={{ padding: '8px 16px' }}>
                      <Plus size={14} />
                      <span>Add First Memory Here</span>
                    </button>
                  </div>
                ) : (
                  filteredMemories.map((mem) => {
                    // Global index in original list for reordering
                    const originalIdx = content.chapter3.memories.findIndex((m) => m.id === mem.id);
                    const isFirst = originalIdx === 0;
                    const isLast = originalIdx === content.chapter3.memories.length - 1;
                    const isVideo = mem.mediaType === 'video';

                    return (
                      <div
                        key={mem.id}
                        className="glass-card"
                        style={{
                          padding: '18px 20px',
                          border: mem.featured
                            ? '1.5px solid rgba(243, 207, 122, 0.45)'
                            : '1px solid rgba(243, 207, 122, 0.15)',
                          background: mem.featured
                            ? 'linear-gradient(135deg, rgba(28, 20, 36, 0.85) 0%, rgba(35, 18, 30, 0.85) 100%)'
                            : 'rgba(16, 12, 26, 0.75)',
                          boxShadow: mem.featured ? '0 8px 30px rgba(243, 207, 122, 0.12)' : 'none',
                        }}
                      >
                        {/* Top Card Bar: Order, Move buttons, Badges, Quick Actions */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                            paddingBottom: '12px',
                            marginBottom: '14px',
                            borderBottom: '1px solid rgba(243, 207, 122, 0.12)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Move Up / Down Buttons */}
                            <div style={{ display: 'inline-flex', gap: '4px', marginRight: '6px' }}>
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => {
                                  const list = [...content.chapter3.memories];
                                  const temp = list[originalIdx];
                                  list[originalIdx] = list[originalIdx - 1];
                                  list[originalIdx - 1] = temp;
                                  setContent({
                                    ...content,
                                    chapter3: { ...content.chapter3, memories: list },
                                  });
                                }}
                                className="btn-icon"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  opacity: isFirst ? 0.3 : 1,
                                  cursor: isFirst ? 'not-allowed' : 'pointer',
                                }}
                                title="Move Earlier in Gallery"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => {
                                  const list = [...content.chapter3.memories];
                                  const temp = list[originalIdx];
                                  list[originalIdx] = list[originalIdx + 1];
                                  list[originalIdx + 1] = temp;
                                  setContent({
                                    ...content,
                                    chapter3: { ...content.chapter3, memories: list },
                                  });
                                }}
                                className="btn-icon"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  opacity: isLast ? 0.3 : 1,
                                  cursor: isLast ? 'not-allowed' : 'pointer',
                                }}
                                title="Move Later in Gallery"
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>

                            {/* Order Number */}
                            <span
                              style={{
                                fontSize: '0.82rem',
                                color: 'var(--color-gold)',
                                fontWeight: 700,
                              }}
                            >
                              #{originalIdx + 1}
                            </span>

                            {/* Media Type Badge */}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: isVideo ? 'rgba(226, 88, 127, 0.25)' : 'rgba(243, 207, 122, 0.2)',
                                color: isVideo ? '#ff92b5' : 'var(--color-gold)',
                                border: `1px solid ${isVideo ? 'rgba(226, 88, 127, 0.4)' : 'rgba(243, 207, 122, 0.3)'}`,
                                fontWeight: 600,
                              }}
                            >
                              {isVideo ? <Film size={11} /> : <ImageIcon size={11} />}
                              <span>{isVideo ? 'VIDEO' : 'PHOTO'}</span>
                            </span>

                            {/* Size Badge */}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: 'var(--color-champagne)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {mem.displaySize || 'medium'}
                            </span>

                            {/* Collection Badge */}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                background: 'rgba(243, 207, 122, 0.1)',
                                color: 'var(--color-champagne)',
                                border: '1px solid rgba(243, 207, 122, 0.2)',
                              }}
                            >
                              {mem.collection || 'Our Little Adventures'}
                            </span>

                            {/* Aspect Ratio Badge */}
                            {mem.aspect && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  background: 'rgba(100, 200, 255, 0.12)',
                                  color: '#7ed4fc',
                                  border: '1px solid rgba(100, 200, 255, 0.25)',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {mem.aspect}
                              </span>
                            )}

                            {/* Video Duration Badge */}
                            {isVideo && mem.videoDuration && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  background: 'rgba(255, 100, 150, 0.12)',
                                  color: '#ff88ad',
                                  border: '1px solid rgba(255, 100, 150, 0.25)',
                                }}
                              >
                                ⏱ {mem.videoDuration}
                              </span>
                            )}

                            {/* Status: Published vs Draft */}
                            {mem.published === false ? (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(255, 180, 80, 0.2)',
                                  color: '#ffc875',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  border: '1px solid rgba(255, 180, 80, 0.4)',
                                  fontWeight: 600,
                                }}
                              >
                                Draft · Hidden
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(100, 220, 140, 0.18)',
                                  color: '#7fe3a6',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  border: '1px solid rgba(100, 220, 140, 0.35)',
                                  fontWeight: 600,
                                }}
                              >
                                Published
                              </span>
                            )}

                            {/* Featured Star Pill */}
                            {mem.featured && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(243, 207, 122, 0.25)',
                                  color: 'var(--color-gold)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  border: '1px solid rgba(243, 207, 122, 0.5)',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <Star size={11} fill="var(--color-gold)" />
                                <span>Grand Finale Featured</span>
                              </span>
                            )}

                            {/* Story Section Pill */}
                            {mem.showInStorySection && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(226, 88, 127, 0.22)',
                                  color: '#ff92b5',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  border: '1px solid rgba(226, 88, 127, 0.5)',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <BookOpen size={11} color="#ff92b5" />
                                <span>Story Section</span>
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Quick Story Section Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...content.chapter3.memories];
                                const currentSelected = list.filter((m) => m.showInStorySection && m.id !== mem.id).length;
                                const nextVal = !list[originalIdx].showInStorySection;
                                if (nextVal && currentSelected >= 4) {
                                  showToast('Only 4 memories can be in the Story Section at once. Please uncheck another memory first.');
                                  return;
                                }
                                list[originalIdx] = { ...list[originalIdx], showInStorySection: nextVal };
                                setContent({
                                  ...content,
                                  chapter3: { ...content.chapter3, memories: list },
                                });
                                showToast(
                                  nextVal
                                    ? `"${mem.title}" selected for Story Section (${currentSelected + 1}/4)! Click Save Changes to publish. ✨`
                                    : `"${mem.title}" removed from Story Section (${currentSelected}/4).`
                                );
                              }}
                              className="btn-icon"
                              style={{
                                width: '32px',
                                height: '32px',
                                color: mem.showInStorySection ? '#ff92b5' : 'var(--text-muted)',
                              }}
                              title={
                                mem.showInStorySection
                                  ? 'In Story Section (Click to remove)'
                                  : 'Select for Curated 4 Story Section'
                              }
                            >
                              <BookOpen size={14} color={mem.showInStorySection ? '#ff92b5' : 'var(--text-muted)'} />
                            </button>

                            {/* Quick Featured Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...content.chapter3.memories];
                                list[originalIdx] = { ...list[originalIdx], featured: !list[originalIdx].featured };
                                setContent({
                                  ...content,
                                  chapter3: { ...content.chapter3, memories: list },
                                });
                                showToast(
                                  list[originalIdx].featured
                                    ? `Marked "${mem.title}" as Grand Finale Featured! ★`
                                    : `Unmarked featured on "${mem.title}".`
                                );
                              }}
                              className="btn-icon"
                              style={{
                                width: '32px',
                                height: '32px',
                                color: mem.featured ? 'var(--color-gold)' : 'var(--text-muted)',
                              }}
                              title={mem.featured ? 'Featured Memory (Click to unfeature)' : 'Mark as Grand Finale Featured'}
                            >
                              <Star size={14} fill={mem.featured ? 'var(--color-gold)' : 'none'} />
                            </button>

                            {/* Quick Publish / Unpublish Toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                const list = [...content.chapter3.memories];
                                const nextState = list[originalIdx].published === false ? true : false;
                                list[originalIdx] = { ...list[originalIdx], published: nextState };
                                setContent({
                                  ...content,
                                  chapter3: { ...content.chapter3, memories: list },
                                });
                                showToast(
                                  nextState ? `"${mem.title}" is now Published! ✨` : `"${mem.title}" moved to Drafts.`
                                );
                              }}
                              className="btn-icon"
                              style={{
                                width: '32px',
                                height: '32px',
                                color: mem.published !== false ? '#7fe3a6' : '#ffc875',
                              }}
                              title={mem.published !== false ? 'Published (Click to hide/draft)' : 'Draft (Click to publish)'}
                            >
                              {mem.published !== false ? <Eye size={14} /> : <Eye size={14} style={{ opacity: 0.5 }} />}
                            </button>

                            {/* Preview Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (isVideo) {
                                  setPreviewingVideoMemory(mem);
                                } else {
                                  setPreviewingMemory(mem);
                                }
                              }}
                              className="btn-outline"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                minHeight: '32px',
                                gap: '4px',
                              }}
                              title="Preview memory reveal"
                            >
                              {isVideo ? <Play size={12} /> : <Eye size={12} />}
                              <span>Preview</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditMemory(mem)}
                              className="btn-outline"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.75rem',
                                minHeight: '32px',
                                gap: '4px',
                                borderColor: 'rgba(243, 207, 122, 0.4)',
                                color: 'var(--color-gold)',
                              }}
                              title="Edit all fields, media, and layout"
                            >
                              <Edit3 size={12} />
                              <span>Edit</span>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setMemoryToDelete(mem)}
                              className="btn-icon"
                              style={{ width: '32px', height: '32px', color: '#ff6b8b' }}
                              title="Delete memory"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Card Body: Thumbnail + Info */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          {/* Media Thumbnail */}
                          <div
                            onClick={() => {
                              if (isVideo) setPreviewingVideoMemory(mem);
                              else setPreviewingMemory(mem);
                            }}
                            style={{
                              width: '110px',
                              height: '110px',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              background: '#151322',
                              flexShrink: 0,
                              border: '1.5px solid rgba(243, 207, 122, 0.35)',
                              position: 'relative',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Click to preview media"
                          >
                            {uploadingMemoryId === mem.id ? (
                              <div style={{ textAlign: 'center', padding: '8px' }}>
                                <Sparkles size={20} color="var(--color-gold)" className="animate-spin" />
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-blush)', display: 'block', marginTop: '4px' }}>
                                  Uploading...
                                </span>
                              </div>
                            ) : !isVideo && brokenImages[mem.id] ? (
                              <div style={{ textAlign: 'center', padding: '8px' }}>
                                <ImageIcon size={22} color="#ff6b8b" />
                                <span style={{ fontSize: '0.65rem', color: '#ff9494', display: 'block', marginTop: '2px' }}>
                                  Missing
                                </span>
                              </div>
                            ) : isVideo ? (
                              <>
                                {getValidPosterUrl(mem) ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={getValidPosterUrl(mem)!}
                                    alt={mem.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : getPlayableVideoUrl(mem) ? (
                                  <video
                                    src={`${getPlayableVideoUrl(mem)}#t=0.5`}
                                    preload="metadata"
                                    muted
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px',
                                      background: 'linear-gradient(135deg, #1c1528 0%, #291428 100%)',
                                      padding: '8px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <Film size={24} color="var(--color-gold)" />
                                    <span style={{ fontSize: '0.65rem', color: 'var(--color-blush)' }}>Watch memory</span>
                                  </div>
                                )}
                                <div
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: 'rgba(226, 88, 127, 0.9)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 0 12px rgba(226, 88, 127, 0.6)',
                                    }}
                                  >
                                    <Play size={14} color="#ffffff" style={{ marginLeft: '2px' }} />
                                  </div>
                                </div>
                                {mem.videoDuration && (
                                  <span
                                    style={{
                                      position: 'absolute',
                                      bottom: '4px',
                                      right: '4px',
                                      background: 'rgba(0,0,0,0.75)',
                                      color: '#fff',
                                      fontSize: '0.62rem',
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      pointerEvents: 'none',
                                    }}
                                  >
                                    {mem.videoDuration}
                                  </span>
                                )}
                              </>
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={mem.imageUrl}
                                alt={mem.title}
                                onError={() => setBrokenImages((prev) => ({ ...prev, [mem.id]: true }))}
                                onLoad={() => setBrokenImages((prev) => ({ ...prev, [mem.id]: false }))}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                          </div>

                          {/* Details Column */}
                          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                              <h4
                                style={{
                                  fontFamily: 'var(--font-serif)',
                                  fontSize: '1.05rem',
                                  color: 'var(--color-champagne)',
                                  margin: 0,
                                }}
                              >
                                {mem.title || 'Untitled Memory'}
                              </h4>
                              {(mem.date || mem.location) && (
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                  {mem.date} {mem.location ? `· 📍 ${mem.location}` : ''}
                                </span>
                              )}
                            </div>

                            {mem.caption && (
                              <p
                                style={{
                                  fontSize: '0.82rem',
                                  color: 'var(--color-blush)',
                                  fontStyle: 'italic',
                                  margin: 0,
                                }}
                              >
                                &ldquo;{mem.caption}&rdquo;
                              </p>
                            )}

                            {mem.fullStory && (
                              <p
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--text-faint)',
                                  margin: 0,
                                  lineHeight: 1.45,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {mem.fullStory}
                              </p>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditMemory(mem)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: 'var(--color-gold)',
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                }}
                              >
                                Edit Details &amp; Media &rarr;
                              </button>

                              {isVideo && !getValidPosterUrl(mem) && (
                                <button
                                  type="button"
                                  onClick={() => handleAutoGeneratePoster(mem)}
                                  className="btn-outline"
                                  style={{
                                    padding: '3px 8px',
                                    fontSize: '0.7rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderColor: 'rgba(243, 207, 122, 0.4)',
                                    color: 'var(--color-gold)',
                                  }}
                                  title="Capture frame and set as poster"
                                >
                                  <Camera size={11} />
                                  <span>Generate Poster</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}

          {/* TAB 4: LOVE LETTER & VOICE NOTE */}
          {activeTab === 'letter' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '16px' }}>
                Chapter 4: Love Letter &amp; Voice Recording
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Salutation
                  </label>
                  <input
                    type="text"
                    value={content.chapter4.letter.salutation}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        chapter4: {
                          ...content.chapter4,
                          letter: { ...content.chapter4.letter, salutation: e.target.value },
                        },
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                {content.chapter4.letter.paragraphs.map((para, pIdx) => (
                  <div key={pIdx}>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                      Paragraph #{pIdx + 1}
                    </label>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => {
                        const paras = [...content.chapter4.letter.paragraphs];
                        paras[pIdx] = e.target.value;
                        setContent({
                          ...content,
                          chapter4: {
                            ...content.chapter4,
                            letter: { ...content.chapter4.letter, paragraphs: paras },
                          },
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        lineHeight: 1.6,
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                      Closing
                    </label>
                    <input
                      type="text"
                      value={content.chapter4.letter.closing}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          chapter4: {
                            ...content.chapter4,
                            letter: { ...content.chapter4.letter, closing: e.target.value },
                          },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                      Signature
                    </label>
                    <input
                      type="text"
                      value={content.chapter4.letter.signature}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          chapter4: {
                            ...content.chapter4,
                            letter: { ...content.chapter4.letter, signature: e.target.value },
                          },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                {/* Voice Note Settings */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '12px' }}>
                    Voice Recording Configuration
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                        Audio Title
                      </label>
                      <input
                        type="text"
                        value={content.chapter4.voiceNote.title}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            chapter4: {
                              ...content.chapter4,
                              voiceNote: { ...content.chapter4.voiceNote, title: e.target.value },
                            },
                          })
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10,11,20,0.7)',
                          border: '1px solid rgba(243,207,122,0.25)',
                          borderRadius: '8px',
                          color: '#ffffff',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                        Audio File URL or Upload Voice MP3:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={content.chapter4.voiceNote.audioUrl}
                          onChange={(e) =>
                            setContent({
                              ...content,
                              chapter4: {
                                ...content.chapter4,
                                voiceNote: { ...content.chapter4.voiceNote, audioUrl: e.target.value },
                              },
                            })
                          }
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            background: 'rgba(10,11,20,0.7)',
                            border: '1px solid rgba(243,207,122,0.25)',
                            borderRadius: '8px',
                            color: '#ffffff',
                          }}
                        />
                        <label
                          className="btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                          }}
                        >
                          <Upload size={14} />
                          <span>Upload MP3</span>
                          <input
                            type="file"
                            accept="audio/*"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              handleFileUpload(e, (url) => {
                                setContent({
                                  ...content,
                                  chapter4: {
                                    ...content.chapter4,
                                    voiceNote: { ...content.chapter4.voiceNote, audioUrl: url },
                                  },
                                });
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REASONS I LOVE YOU */}
          {activeTab === 'reasons' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)' }}>
                  Reasons I Love You ({content.chapter5.reasons.length})
                </h2>
                <button
                  onClick={() => {
                    const newR: LoveReason = {
                      id: `r-${Date.now()}`,
                      number: `0${content.chapter5.reasons.length + 1}`,
                      title: 'Another Beautiful Reason',
                      description: 'Write why you adore this aspect of her soul...',
                    };
                    setContent({
                      ...content,
                      chapter5: { ...content.chapter5, reasons: [...content.chapter5.reasons, newR] },
                    });
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem', minHeight: '38px' }}
                >
                  <Plus size={14} />
                  <span>Add Reason</span>
                </button>
              </div>

              {content.chapter5.reasons.map((reason, idx) => (
                <div key={reason.id} className="glass-card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-gold)', fontWeight: 700 }}>
                      Reason {reason.number}
                    </span>
                    <button
                      onClick={() => {
                        const updated = content.chapter5.reasons.filter((r) => r.id !== reason.id);
                        setContent({ ...content, chapter5: { ...content.chapter5, reasons: updated } });
                      }}
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', color: '#ff6b8b' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={reason.title}
                      placeholder="Title"
                      onChange={(e) => {
                        const updated = [...content.chapter5.reasons];
                        updated[idx].title = e.target.value;
                        setContent({ ...content, chapter5: { ...content.chapter5, reasons: updated } });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                    />

                    <textarea
                      rows={2}
                      value={reason.description}
                      placeholder="Description"
                      onChange={(e) => {
                        const updated = [...content.chapter5.reasons];
                        updated[idx].description = e.target.value;
                        setContent({ ...content, chapter5: { ...content.chapter5, reasons: updated } });
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: LIVE RELATIONSHIP COUNTER */}
          {activeTab === 'future' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <Clock size={20} color="var(--color-gold)" />
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', margin: 0 }}>
                  Chapter 6: Live Relationship Counter
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Main Heading
                  </label>
                  <input
                    type="text"
                    value={content.chapter6.title}
                    onChange={(e) =>
                      setContent({ ...content, chapter6: { ...content.chapter6, title: e.target.value } })
                    }
                    placeholder="Every Second With You"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Subtitle Narrative
                  </label>
                  <textarea
                    rows={2}
                    value={content.chapter6.subtitle}
                    onChange={(e) =>
                      setContent({ ...content, chapter6: { ...content.chapter6, subtitle: e.target.value } })
                    }
                    placeholder="Since July 18, 2025, every moment has been a little more beautiful because you're in my life."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                      Relationship Start Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={content.chapter6.startDate || '2025-07-18'}
                      onChange={(e) =>
                        setContent({ ...content, chapter6: { ...content.chapter6, startDate: e.target.value } })
                      }
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Currently set to 18 July 2025 (Counts upward in real-time)
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                      Bottom Romantic Note
                    </label>
                    <input
                      type="text"
                      value={content.chapter6.bottomNote || 'Every second, my favourite chapter continues. ♡'}
                      onChange={(e) =>
                        setContent({ ...content, chapter6: { ...content.chapter6, bottomNote: e.target.value } })
                      }
                      placeholder="Every second, my favourite chapter continues. ♡"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(10,11,20,0.7)',
                        border: '1px solid rgba(243,207,122,0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                {/* Admin Live Preview Box */}
                <div
                  style={{
                    marginTop: '10px',
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(18, 14, 26, 0.85)',
                    border: '1px dashed rgba(243, 207, 122, 0.4)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--color-gold)', letterSpacing: '0.1em' }}>
                    Live Experience Configuration
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--color-blush)' }}>
                    &ldquo;{content.chapter6.bottomNote || 'Every second, my favourite chapter continues. ♡'}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: FINAL REVEAL */}
          {activeTab === 'reveal' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '16px' }}>
                Chapter 7: Final Reveal &amp; Montage
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Montage Headline Quote
                  </label>
                  <input
                    type="text"
                    value={content.chapter7.montageQuote}
                    onChange={(e) =>
                      setContent({ ...content, chapter7: { ...content.chapter7, montageQuote: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Celebration Tag
                  </label>
                  <input
                    type="text"
                    value={content.chapter7.celebrationTag}
                    onChange={(e) =>
                      setContent({ ...content, chapter7: { ...content.chapter7, celebrationTag: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                    Final Emotional Climax Message
                  </label>
                  <textarea
                    rows={4}
                    value={content.chapter7.finalMessage}
                    onChange={(e) =>
                      setContent({ ...content, chapter7: { ...content.chapter7, finalMessage: e.target.value } })
                    }
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      lineHeight: 1.6,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: THEME & SECTION VISIBILITY */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Section Visibility */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '16px' }}>
                  Section Visibility Toggles
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { key: 'surprise', label: 'Chapter 1: The Surprise Opening Envelope' },
                    { key: 'universe', label: 'Chapter 2: 3D Universe Cosmos' },
                    { key: 'museum', label: 'Chapter 3: The Museum of Us (Photos)' },
                    { key: 'letters', label: 'Chapter 4: Love Letter & Voice Recording' },
                    { key: 'reasons', label: 'Chapter 5: Reasons Why I Love You' },
                    { key: 'future', label: 'Chapter 6: Our Horizon & Future Dreams' },
                    { key: 'finalReveal', label: 'Chapter 7: The Final Reveal & Montage' },
                  ].map((sec) => (
                    <label
                      key={sec.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '0.88rem', color: 'var(--color-champagne)' }}>{sec.label}</span>
                      <input
                        type="checkbox"
                        checked={(content.sectionsVisibility as any)[sec.key]}
                        onChange={(e) => {
                          setContent({
                            ...content,
                            sectionsVisibility: {
                              ...content.sectionsVisibility,
                              [sec.key]: e.target.checked,
                            },
                          });
                        }}
                        style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Master Password Update */}
              <div className="glass-card" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '16px' }}>
                  Update Master Admin Password
                </h2>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="password"
                    placeholder="Enter new master password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                  <button type="submit" className="btn-outline" style={{ padding: '10px 16px' }}>
                    <Lock size={14} />
                    <span>Change</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Save Bar for Mobile */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 12, 25, 0.95)',
          borderTop: '1px solid rgba(243, 207, 122, 0.25)',
          padding: '12px 20px max(12px, env(safe-area-inset-bottom)) 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 40,
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {isSaving ? 'Publishing updates...' : 'Save when ready'}
        </span>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary"
          style={{ padding: '10px 24px' }}
        >
          <Save size={16} />
          <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #1d1829 0%, #2f1225 100%)',
            border: '1px solid var(--color-gold)',
            color: 'var(--color-champagne)',
            padding: '12px 22px',
            borderRadius: '9999px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(243,207,122,0.3)',
            zIndex: 100,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={16} color="var(--color-gold)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Live Mobile Viewport Preview Modal */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(5, 5, 10, 0.9)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '390px',
              height: '820px',
              maxHeight: '92vh',
              background: '#000000',
              borderRadius: '44px',
              border: '10px solid #282834',
              boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(226,88,127,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Phone Speaker Notch */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '120px',
                height: '24px',
                background: '#1a1a24',
                borderRadius: '16px',
                zIndex: 20,
              }}
            />

            {/* Close Preview Button */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="btn-icon"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 30,
                width: '32px',
                height: '32px',
              }}
            >
              <X size={16} />
            </button>

            {/* Live iframe */}
            <iframe
              src="/"
              title="Mobile Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                paddingTop: '20px',
              }}
            />
          </div>
        </div>
      )}

      {/* Live Single Memory Photo Reveal Preview */}
      <MemoryPhotoReveal
        memory={previewingMemory}
        memories={content.chapter3.memories}
        isOpen={Boolean(previewingMemory)}
        onClose={() => setPreviewingMemory(null)}
        onSelectMemory={(m) => setPreviewingMemory(m)}
      />

      {/* Cinematic Video Player Preview Modal */}
      {previewingVideoMemory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 125,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setPreviewingVideoMemory(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '820px',
              background: '#120d1c',
              borderRadius: '20px',
              border: '1px solid rgba(243, 207, 122, 0.35)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(226,88,127,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: '#ff92b5',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Video Preview
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.2rem',
                    color: 'var(--color-champagne)',
                    margin: 0,
                  }}
                >
                  {previewingVideoMemory.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingVideoMemory(null)}
                className="btn-icon"
                style={{ width: '36px', height: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                width: '100%',
                maxHeight: '65vh',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                controls
                playsInline
                autoPlay
                poster={previewingVideoMemory.posterUrl || previewingVideoMemory.imageUrl}
                src={previewingVideoMemory.videoUrl || previewingVideoMemory.imageUrl}
                style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {(previewingVideoMemory.caption || previewingVideoMemory.fullStory) && (
              <div style={{ padding: '8px 4px' }}>
                {previewingVideoMemory.caption && (
                  <p style={{ fontStyle: 'italic', color: 'var(--color-blush)', margin: '0 0 6px 0', fontSize: '0.88rem' }}>
                    &ldquo;{previewingVideoMemory.caption}&rdquo;
                  </p>
                )}
                {previewingVideoMemory.fullStory && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>
                    {previewingVideoMemory.fullStory}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {memoryToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 130,
            background: 'rgba(5, 4, 10, 0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setMemoryToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px',
              background: '#160f22',
              borderRadius: '20px',
              border: '1px solid rgba(255, 107, 139, 0.45)',
              padding: '24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 0 30px rgba(255,107,139,0.2)',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(255, 107, 139, 0.15)',
                border: '1px solid rgba(255, 107, 139, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={28} color="#ff6b8b" />
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#ffffff', margin: '0 0 6px 0' }}>
                Delete this memory?
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: 'var(--color-gold)' }}>&ldquo;{memoryToDelete.title}&rdquo;</strong>? This will permanently remove it from Chapter 2 and the memories timeline.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setMemoryToDelete(null)}
                className="btn-outline"
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '0.84rem',
                  background: 'linear-gradient(135deg, #e63946 0%, #b5179e 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(230, 57, 70, 0.4)',
                }}
              >
                Yes, Delete Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Memory Modal */}
      {editingMemory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(5, 4, 10, 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            overflowY: 'auto',
          }}
          onClick={() => {
            setEditingMemory(null);
            setIsCreatingMemory(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              background: '#130d1e',
              borderRadius: '24px',
              border: '1.5px solid rgba(243, 207, 122, 0.35)',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              overflowY: 'auto',
              boxShadow: '0 25px 80px rgba(0,0,0,0.95), 0 0 50px rgba(226,88,127,0.2)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(243, 207, 122, 0.15)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--color-rose-glow)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {isCreatingMemory ? 'New Memory Creator' : 'Memory Editor'}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.35rem',
                    color: 'var(--color-champagne)',
                    margin: '2px 0 0 0',
                  }}
                >
                  {isCreatingMemory ? '✨ Add New Memory to Gallery' : `✏️ Edit: ${editingMemory.title || 'Untitled'}`}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingMemory(null);
                  setIsCreatingMemory(false);
                }}
                className="btn-icon"
                style={{ width: '34px', height: '34px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                  Memory Title <span style={{ color: '#ff6b8b' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editingMemory.title}
                  onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                  placeholder="e.g. Stargazing on the Rooftop"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(10,11,20,0.7)',
                    border: '1px solid rgba(243,207,122,0.25)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* Media Type Switcher */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '6px' }}>
                  Media Format
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingMemory({ ...editingMemory, mediaType: 'photo' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background:
                        editingMemory.mediaType !== 'video'
                          ? 'linear-gradient(135deg, rgba(243,207,122,0.25) 0%, rgba(226,88,127,0.25) 100%)'
                          : 'rgba(18, 14, 28, 0.6)',
                      border:
                        editingMemory.mediaType !== 'video'
                          ? '1.5px solid var(--color-gold)'
                          : '1px solid rgba(243,207,122,0.2)',
                      color: editingMemory.mediaType !== 'video' ? 'var(--color-gold)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ImageIcon size={16} />
                    <span>Photograph 📷</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingMemory({ ...editingMemory, mediaType: 'video' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background:
                        editingMemory.mediaType === 'video'
                          ? 'linear-gradient(135deg, rgba(226,88,127,0.3) 0%, rgba(243,207,122,0.2) 100%)'
                          : 'rgba(18, 14, 28, 0.6)',
                      border:
                        editingMemory.mediaType === 'video'
                          ? '1.5px solid var(--color-rose-glow)'
                          : '1px solid rgba(243,207,122,0.2)',
                      color: editingMemory.mediaType === 'video' ? '#ff92b5' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Film size={16} />
                    <span>Cinematic Video 🎬</span>
                  </button>
                </div>
              </div>

              {/* Media File & URL Section */}
              <div
                style={{
                  background: 'rgba(18, 14, 28, 0.65)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(243, 207, 122, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {editingMemory.mediaType !== 'video' ? (
                  /* Photograph Controls */
                  <>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Thumbnail Preview */}
                      <div
                        style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#151322',
                          border: '1.5px solid rgba(243, 207, 122, 0.35)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!isVideoUrl(editingMemory.imageUrl) && editingMemory.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={editingMemory.imageUrl}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <ImageIcon size={24} color="var(--color-gold)" style={{ opacity: 0.5 }} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--color-champagne)' }}>
                          Photograph URL or Upload from Device
                        </label>
                        <input
                          type="text"
                          value={editingMemory.imageUrl}
                          onChange={(e) => setEditingMemory({ ...editingMemory, imageUrl: e.target.value })}
                          placeholder="https://... or /uploads/..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(10,11,20,0.7)',
                            border: '1px solid rgba(243,207,122,0.25)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                          }}
                        />

                        <label
                          className="btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            width: 'fit-content',
                            borderColor: 'var(--color-gold)',
                            color: 'var(--color-gold)',
                          }}
                        >
                          <Upload size={14} />
                          <span>Upload Photograph (JPEG / PNG / HEIC)</span>
                          <input
                            type="file"
                            accept="image/*,.heic,.heif,.HEIC,.HEIF"
                            style={{ display: 'none' }}
                            onChange={(e) =>
                              handleFileUpload(e, null, (url) => {
                                setEditingMemory({ ...editingMemory, imageUrl: url });
                              })
                            }
                          />
                        </label>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      💡 Apple HEIC/HEIF photos are automatically converted on the server to web-ready JPEG.
                    </span>
                  </>
                ) : (
                  /* Video Controls */
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                          Video URL (MP4 / WebM / MOV up to 100MB)
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            value={editingMemory.videoUrl || editingMemory.imageUrl || ''}
                            onChange={(e) =>
                              setEditingMemory({
                                ...editingMemory,
                                videoUrl: e.target.value,
                                imageUrl: editingMemory.imageUrl || e.target.value,
                              })
                            }
                            placeholder="/uploads/memory-video.mp4 or https://..."
                            style={{
                              flex: 1,
                              minWidth: '220px',
                              padding: '8px 12px',
                              background: 'rgba(10,11,20,0.7)',
                              border: '1px solid rgba(243,207,122,0.25)',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '0.82rem',
                            }}
                          />
                          <label
                            className="btn-primary"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              width: 'fit-content',
                            }}
                          >
                            <Film size={14} />
                            <span>Upload Video File</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleFileUpload(e, null, (url) => {
                                  setEditingMemory({
                                    ...editingMemory,
                                    videoUrl: url,
                                    imageUrl: editingMemory.imageUrl || url,
                                  });
                                })
                              }
                            />
                          </label>
                        </div>
                      </div>

                      {/* Live Video Preview & Frame Grabber */}
                      {getPlayableVideoUrl(editingMemory) && (
                        <div
                          style={{
                            background: '#0d0d16',
                            border: '1px solid rgba(243,207,122,0.25)',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-champagne)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Film size={14} color="var(--color-gold)" /> Video Preview &amp; Poster Capture
                            </span>
                            <button
                              type="button"
                              onClick={handleCaptureVideoFrame}
                              className="btn-outline"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 12px',
                                fontSize: '0.75rem',
                                borderColor: 'var(--color-gold)',
                                color: 'var(--color-gold)',
                              }}
                              title="Pause at desired moment and capture as poster"
                            >
                              <Camera size={13} />
                              <span>Capture Frame as Poster</span>
                            </button>
                          </div>
                          <video
                            id="edit-video-preview"
                            src={getPlayableVideoUrl(editingMemory) || undefined}
                            controls
                            preload="metadata"
                            crossOrigin="anonymous"
                            style={{
                              width: '100%',
                              maxHeight: '220px',
                              borderRadius: '6px',
                              background: '#000',
                              objectFit: 'contain',
                            }}
                          />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            💡 Play or pause at your favorite frame, then click &ldquo;Capture Frame as Poster&rdquo; to set the thumbnail!
                          </span>
                        </div>
                      )}

                      {/* Poster Image for Video */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                          Video Poster / Thumbnail Image
                        </label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {getValidPosterUrl(editingMemory) ? (
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                border: '1px solid var(--color-gold)',
                                flexShrink: 0,
                                position: 'relative',
                              }}
                              title="Current Poster Thumbnail"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getValidPosterUrl(editingMemory)!}
                                alt="Poster Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '6px',
                                background: '#1c1528',
                                border: '1px dashed rgba(243,207,122,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                              title="No poster set yet"
                            >
                              <ImageIcon size={18} color="var(--color-gold)" style={{ opacity: 0.5 }} />
                            </div>
                          )}

                          <input
                            type="text"
                            value={editingMemory.posterUrl || ''}
                            onChange={(e) =>
                              setEditingMemory({
                                ...editingMemory,
                                posterUrl: e.target.value,
                                thumbnailUrl: e.target.value,
                                imageUrl: e.target.value || editingMemory.imageUrl,
                              })
                            }
                            placeholder="/uploads/poster.jpg or https://..."
                            style={{
                              flex: 1,
                              minWidth: '200px',
                              padding: '8px 12px',
                              background: 'rgba(10,11,20,0.7)',
                              border: '1px solid rgba(243,207,122,0.25)',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '0.82rem',
                            }}
                          />
                          <label
                            className="btn-outline"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              width: 'fit-content',
                            }}
                          >
                            <Upload size={14} />
                            <span>Upload Poster</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) =>
                                handleFileUpload(e, null, (url) => {
                                  setEditingMemory({
                                    ...editingMemory,
                                    posterUrl: url,
                                    thumbnailUrl: url,
                                    imageUrl: url,
                                  });
                                })
                              }
                            />
                          </label>
                        </div>
                      </div>

                      {/* Video Duration */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-champagne)', marginBottom: '4px' }}>
                          Video Duration (e.g. 0:45 or 1:20 - shown on video badge)
                        </label>
                        <input
                          type="text"
                          value={editingMemory.videoDuration || ''}
                          onChange={(e) => setEditingMemory({ ...editingMemory, videoDuration: e.target.value })}
                          placeholder="e.g. 0:45"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(10,11,20,0.7)',
                            border: '1px solid rgba(243,207,122,0.25)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                          }}
                        />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      🎬 Videos are served via HTTP Range streaming so visitors can scrub smoothly without downloading the whole file upfront.
                    </span>
                  </>
                )}
              </div>

              {/* Display Size, Aspect Ratio & Collection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                    Gallery Group / Collection
                  </label>
                  <select
                    value={editingMemory.collection || 'Our Little Adventures'}
                    onChange={(e) => setEditingMemory({ ...editingMemory, collection: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#151124',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="Our Little Adventures">Our Little Adventures</option>
                    <option value="The Moments I Replay">The Moments I Replay</option>
                    <option value="Just You Being You">Just You Being You</option>
                    {content.chapter2?.collections
                      ?.filter(
                        (c) =>
                          !['Our Little Adventures', 'The Moments I Replay', 'Just You Being You'].includes(c)
                      )
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                    Collage Tile Aspect Ratio
                  </label>
                  <select
                    value={editingMemory.aspect || 'portrait'}
                    onChange={(e) =>
                      setEditingMemory({
                        ...editingMemory,
                        aspect: e.target.value as 'portrait' | 'square' | 'landscape' | 'tall' | 'wide',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#151124',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="portrait">Portrait (3:4)</option>
                    <option value="square">Square (1:1)</option>
                    <option value="landscape">Landscape (4:3)</option>
                    <option value="tall">Tall Story (9:16)</option>
                    <option value="wide">Wide Cinematic (16:9)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                    Gallery Display Sizing
                  </label>
                  <select
                    value={editingMemory.displaySize || 'medium'}
                    onChange={(e) =>
                      setEditingMemory({
                        ...editingMemory,
                        displaySize: e.target.value as 'small' | 'medium' | 'large' | 'full',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#151124',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                    }}
                  >
                    <option value="small">Small (Compact Card)</option>
                    <option value="medium">Medium (Standard Tile)</option>
                    <option value="large">Large (Editorial Focus)</option>
                    <option value="full">Full-Width (Showcase)</option>
                  </select>
                </div>
              </div>

              {/* Date & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                    Date (e.g. 18 July 2025)
                  </label>
                  <input
                    type="text"
                    value={editingMemory.date || ''}
                    onChange={(e) => setEditingMemory({ ...editingMemory, date: e.target.value })}
                    placeholder="e.g. 18 July 2025"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                    Location (e.g. Under the Night Sky)
                  </label>
                  <input
                    type="text"
                    value={editingMemory.location || ''}
                    onChange={(e) => setEditingMemory({ ...editingMemory, location: e.target.value })}
                    placeholder="e.g. Under the Night Sky"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10,11,20,0.7)',
                      border: '1px solid rgba(243,207,122,0.25)',
                      borderRadius: '8px',
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Short Caption */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                  Short Caption (Handwritten Polaroid / Hover Note)
                </label>
                <input
                  type="text"
                  value={editingMemory.caption}
                  onChange={(e) => setEditingMemory({ ...editingMemory, caption: e.target.value })}
                  placeholder="e.g. The night everything felt quiet and infinite with you..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(10,11,20,0.7)',
                    border: '1px solid rgba(243,207,122,0.25)',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                />
              </div>

              {/* Full Backstory */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-champagne)', marginBottom: '5px' }}>
                  Full Backstory (Shown inside photo reveal &amp; lightbox)
                </label>
                <textarea
                  rows={3}
                  value={editingMemory.fullStory || ''}
                  onChange={(e) => setEditingMemory({ ...editingMemory, fullStory: e.target.value })}
                  placeholder="Tell the full heartfelt story behind this unforgettable second..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(10,11,20,0.7)',
                    border: '1px solid rgba(243,207,122,0.25)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Toggles: Featured, Published, Star Index */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  background: 'rgba(18, 14, 28, 0.65)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(243, 207, 122, 0.18)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingMemory.featured || false}
                    onChange={(e) => setEditingMemory({ ...editingMemory, featured: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-champagne)' }}>
                    Mark as Grand Finale Featured ★
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingMemory.published !== false}
                    onChange={(e) => setEditingMemory({ ...editingMemory, published: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#7fe3a6' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: '#7fe3a6' }}>
                    Published on Live Website
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingMemory.showInStorySection || false}
                    onChange={(e) => {
                      const willCheck = e.target.checked;
                      if (willCheck && content) {
                        const countOthers = content.chapter3.memories.filter(
                          (m) => m.showInStorySection && m.id !== editingMemory.id
                        ).length;
                        if (countOthers >= 4) {
                          showToast('Only 4 memories can be in the Story Section at once. Please uncheck another memory first.');
                          return;
                        }
                      }
                      setEditingMemory({ ...editingMemory, showInStorySection: willCheck });
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#ff92b5' }}
                  />
                  <span style={{ fontSize: '0.82rem', color: '#ff92b5', fontWeight: 600 }}>
                    Show in Story Section (Curated 4 Memories below Collage)
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(243, 207, 122, 0.15)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setEditingMemory(null);
                  setIsCreatingMemory(false);
                }}
                className="btn-outline"
                style={{ padding: '10px 18px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMemoryModal}
                className="btn-primary"
                style={{ padding: '10px 24px', fontSize: '0.85rem' }}
              >
                <Check size={16} />
                <span>{isCreatingMemory ? 'Add Memory to Gallery' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
