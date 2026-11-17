import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Check,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Link2,
  Loader2,
  Navigation,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { OperationType, db, handleFirestoreError } from '../lib/firebase';
import type { BlogPost, CmsLandingConfig, NavMenuItem } from '../types/domain';

interface AdminCmsTabProps {
  cms: Omit<CmsLandingConfig, 'updatedAt'>;
  navMenuItems: NavMenuItem[];
  blogPosts: BlogPost[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

async function processUploadedAsset(
  file: File,
  maxWidth: number,
  maxHeight: number,
  maxChars: number
): Promise<string> {
  if (file.type === 'image/svg+xml') {
    const svgText = await file.text();
    const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    if (encoded.length > maxChars) {
      throw new Error('SVG file is too large. Please upload a compact SVG under 60KB.');
    }
    return encoded;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        if (dataUrl.length > maxChars) {
          const compressed = canvas.toDataURL('image/webp', 0.8);
          if (compressed.length > maxChars) {
            reject(new Error('Image exceeds storage limit even after resizing. Try a smaller image.'));
            return;
          }
          resolve(compressed);
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function AdminCmsTab({ cms, navMenuItems, blogPosts }: AdminCmsTabProps) {
  const [form, setForm] = useState(cms);
  const [savingLanding, setSavingLanding] = useState(false);
  const [landingSavedToast, setLandingSavedToast] = useState(false);
  const [assetError, setAssetError] = useState('');

  // Header Navbar Menu Editor State
  const [showNavModal, setShowNavModal] = useState(false);
  const [editingNavItem, setEditingNavItem] = useState<NavMenuItem | null>(null);
  const [navLabel, setNavLabel] = useState('');
  const [navSlug, setNavSlug] = useState('');
  const [navOrder, setNavOrder] = useState(6);
  const [navVisible, setNavVisible] = useState(true);
  const [navPageTitle, setNavPageTitle] = useState('');
  const [navPageSubtitle, setNavPageSubtitle] = useState('');
  const [navPageBody, setNavPageBody] = useState('');
  const [navCtaLabel, setNavCtaLabel] = useState('');
  const [savingNav, setSavingNav] = useState(false);

  // Blog editor state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('Banking & Compliance');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postReadTime, setPostReadTime] = useState(4);
  const [postAuthor, setPostAuthor] = useState('Tariq Al Mansoori');
  const [postStatus, setPostStatus] = useState<'draft' | 'published'>('published');
  const [savingPost, setSavingPost] = useState(false);

  useEffect(() => {
    setForm(cms);
  }, [cms]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetError('');
    try {
      const dataUrl = await processUploadedAsset(file, 360, 120, 145000);
      setForm((prev) => ({ ...prev, logoDataUrl: dataUrl }));
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : 'Unable to upload logo.');
    }
  }

  async function handleFooterLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetError('');
    try {
      const dataUrl = await processUploadedAsset(file, 360, 120, 145000);
      setForm((prev) => ({ ...prev, footerLogoDataUrl: dataUrl }));
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : 'Unable to upload footer logo.');
    }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetError('');
    try {
      const dataUrl = await processUploadedAsset(file, 64, 64, 75000);
      setForm((prev) => ({ ...prev, faviconDataUrl: dataUrl }));
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : 'Unable to upload favicon.');
    }
  }

  async function handleSaveLanding(e: React.FormEvent) {
    e.preventDefault();
    setSavingLanding(true);
    setLandingSavedToast(false);
    setAssetError('');
    try {
      await setDoc(doc(db, 'cmsLanding', 'main'), {
        heroHeadline: form.heroHeadline.trim().slice(0, 160),
        heroSubheadline: form.heroSubheadline.trim().slice(0, 320),
        whatsappNumber: form.whatsappNumber.trim().slice(0, 32),
        phoneDisplay: 'WhatsApp Desk',
        googleRatingScore: form.googleRatingScore.trim().slice(0, 16),
        googleReviewCount: form.googleReviewCount.trim().slice(0, 32),
        zeroVisaPriceAed: Number(form.zeroVisaPriceAed),
        oneVisaPriceAed: Number(form.oneVisaPriceAed),
        mainlandPriceAed: Number(form.mainlandPriceAed),
        promoNotice: (form.promoNotice || '').trim().slice(0, 180),
        siteName: (form.siteName || 'venturezoneuae.com').trim().slice(0, 100),
        logoDataUrl: (form.logoDataUrl || '').slice(0, 150000),
        footerLogoDataUrl: (form.footerLogoDataUrl || '').slice(0, 150000),
        faviconDataUrl: (form.faviconDataUrl || '').slice(0, 80000),
        socialLinkedin: (form.socialLinkedin || '').trim().slice(0, 300),
        socialInstagram: (form.socialInstagram || '').trim().slice(0, 300),
        socialX: (form.socialX || '').trim().slice(0, 300),
        socialYoutube: (form.socialYoutube || '').trim().slice(0, 300),
        socialFacebook: (form.socialFacebook || '').trim().slice(0, 300),
        updatedAt: serverTimestamp(),
      });
      setLandingSavedToast(true);
      setTimeout(() => setLandingSavedToast(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cmsLanding/main');
    } finally {
      setSavingLanding(false);
    }
  }

  // Header Navbar Menu CRUD
  function openNewNavItem() {
    setEditingNavItem(null);
    setNavLabel('');
    setNavSlug('');
    setNavOrder(navMenuItems.length + 1);
    setNavVisible(true);
    setNavPageTitle('');
    setNavPageSubtitle('');
    setNavPageBody('');
    setNavCtaLabel('Calculate My Setup Cost');
    setShowNavModal(true);
  }

  function openEditNavItem(item: NavMenuItem) {
    setEditingNavItem(item);
    setNavLabel(item.label);
    setNavSlug(item.slug);
    setNavOrder(item.order);
    setNavVisible(item.visible);
    setNavPageTitle(item.pageTitle);
    setNavPageSubtitle(item.pageSubtitle || '');
    setNavPageBody(item.pageBody || '');
    setNavCtaLabel(item.ctaLabel || '');
    setShowNavModal(true);
  }

  async function handleSaveNavItem(e: React.FormEvent) {
    e.preventDefault();
    setSavingNav(true);
    const cleanLabel = navLabel.trim().slice(0, 40);
    const cleanSlug =
      editingNavItem?.isBuiltIn
        ? editingNavItem.slug
        : slugify(navSlug || cleanLabel) || `page-${Date.now()}`;
    const docId = editingNavItem ? editingNavItem.id : `nav_${cleanSlug}_${Date.now()}`;

    try {
      if (editingNavItem) {
        await updateDoc(doc(db, 'navMenuItems', editingNavItem.id), {
          label: cleanLabel,
          slug: cleanSlug,
          order: Number(navOrder),
          visible: navVisible,
          pageTitle: navPageTitle.trim().slice(0, 160),
          pageSubtitle: navPageSubtitle.trim().slice(0, 400),
          pageBody: navPageBody.trim().slice(0, 12000),
          ctaLabel: navCtaLabel.trim().slice(0, 60),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'navMenuItems', docId), {
          id: docId,
          label: cleanLabel,
          slug: cleanSlug,
          order: Number(navOrder),
          visible: navVisible,
          isBuiltIn: false,
          pageTitle: navPageTitle.trim().slice(0, 160),
          pageSubtitle: navPageSubtitle.trim().slice(0, 400),
          pageBody: navPageBody.trim().slice(0, 12000),
          ctaLabel: navCtaLabel.trim().slice(0, 60),
          updatedAt: serverTimestamp(),
        });
      }
      setShowNavModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `navMenuItems/${docId}`);
    } finally {
      setSavingNav(false);
    }
  }

  async function handleToggleNavVisibility(item: NavMenuItem) {
    try {
      await updateDoc(doc(db, 'navMenuItems', item.id), {
        visible: !item.visible,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `navMenuItems/${item.id}`);
    }
  }

  async function handleDeleteNavItem(item: NavMenuItem) {
    if (item.isBuiltIn) return;
    try {
      await deleteDoc(doc(db, 'navMenuItems', item.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `navMenuItems/${item.id}`);
    }
  }

  // Blog CRUD
  function openNewPost() {
    setEditingPostId(null);
    setPostTitle('');
    setPostCategory('Banking & Compliance');
    setPostExcerpt('');
    setPostContent('');
    setPostReadTime(4);
    setPostAuthor('Tariq Al Mansoori');
    setPostStatus('published');
    setShowPostForm(true);
  }

  function openEditPost(post: BlogPost) {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostCategory(post.category);
    setPostExcerpt(post.excerpt);
    setPostContent(post.content);
    setPostReadTime(post.readTimeMinutes);
    setPostAuthor(post.authorName);
    setPostStatus(post.status);
    setShowPostForm(true);
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    setSavingPost(true);
    const slug = slugify(postTitle) || `guide-${Date.now()}`;

    try {
      if (editingPostId) {
        await updateDoc(doc(db, 'blogPosts', editingPostId), {
          title: postTitle.trim().slice(0, 180),
          slug,
          category: postCategory.trim().slice(0, 60),
          excerpt: postExcerpt.trim().slice(0, 400),
          content: postContent.trim().slice(0, 15000),
          readTimeMinutes: Number(postReadTime),
          authorName: postAuthor.trim().slice(0, 80),
          status: postStatus,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'blogPosts'), {
          title: postTitle.trim().slice(0, 180),
          slug,
          category: postCategory.trim().slice(0, 60),
          excerpt: postExcerpt.trim().slice(0, 400),
          content: postContent.trim().slice(0, 15000),
          readTimeMinutes: Number(postReadTime),
          authorName: postAuthor.trim().slice(0, 80),
          status: postStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setShowPostForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'blogPosts');
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDeletePost(postId: string) {
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `blogPosts/${postId}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Branding, Socials, and Landing Copy */}
      <form
        onSubmit={handleSaveLanding}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#111827]">
              Brand Logo, Favicon, Social Media &amp; Landing Page CMS
            </h3>
            <p className="text-xs text-slate-500">
              Upload your company logo &amp; favicon, configure footer social links, and update live
              pricing &amp; copy.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {landingSavedToast && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#008A72]">
                <Check className="h-4 w-4" />
                <span>Saved &amp; Live</span>
              </span>
            )}
            <button
              type="submit"
              disabled={savingLanding}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#ff0031] px-5 text-xs font-bold text-white hover:bg-[#D90029] disabled:opacity-60"
            >
              {savingLanding && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{savingLanding ? 'Publishing...' : 'Publish All Site Settings'}</span>
            </button>
          </div>
        </div>

        {assetError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700">
            {assetError}
          </div>
        )}

        {/* Website / Brand Name + Private Admin URL Notice */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-[#FAFAFB] p-4 md:grid-cols-12">
          <div className="md:col-span-7">
            <label className="mb-1 block text-xs font-bold text-[#111827]">
              Website / Brand Name (Synced to Header, Footer &amp; All Legal Pages)
            </label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={form.siteName || 'venturezoneuae.com'}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              placeholder="e.g. venturezoneuae.com"
              className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#111827]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Updating this automatically updates your website name across Privacy Policy, Terms of
              Service, Refund Policy, and Legal Disclaimer pages.
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 md:col-span-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Private Admin Portal URL
            </span>
            <span className="mt-1 font-mono text-xs font-semibold text-[#ff0031]">
              {window.location.origin}/#admin
            </span>
            <span className="mt-0.5 text-[11px] text-slate-500">
              Hidden from the public footer. Bookmark this URL for direct admin login.
            </span>
          </div>
        </div>

        {/* Branding Upload Section: Header Logo + Footer Logo + Favicon */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Header Logo Upload */}
          <div className="rounded-xl border border-slate-200 bg-[#FAFAFB] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827]">Header Logo (Light)</span>
              {form.logoDataUrl && form.logoDataUrl !== '/assets/aistudio/Venture-Zone-Logo_0a72a1ee.png' && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, logoDataUrl: '/assets/aistudio/Venture-Zone-Logo_0a72a1ee.png' })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#ff0031]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Light navbar logo (PNG, SVG, JPG, or WebP).
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white px-2">
                <img
                  src={form.logoDataUrl || '/assets/aistudio/Venture-Zone-Logo_0a72a1ee.png'}
                  alt="Header logo preview"
                  className="h-24 w-auto max-w-full object-contain contrast-[1.06] saturate-[1.15]"
                />
              </div>
              <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72]">
                <ImagePlus className="h-4 w-4 text-[#00b294]" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Footer Logo Upload (Dark Background) */}
          <div className="rounded-xl border border-slate-200 bg-[#FAFAFB] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827]">Footer Logo (Dark)</span>
              {form.footerLogoDataUrl &&
                form.footerLogoDataUrl !== '/assets/aistudio/Venture-Zone-Logos-white_949ee09f.png' && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        footerLogoDataUrl: '/assets/aistudio/Venture-Zone-Logos-white_949ee09f.png',
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#ff0031]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              White/light transparent logo for dark footer.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-[#0B0F17] px-2.5">
                <img
                  src={
                    form.footerLogoDataUrl ||
                    '/assets/aistudio/Venture-Zone-Logos-white_949ee09f.png'
                  }
                  alt="Footer logo preview"
                  className="h-9 w-auto max-w-full object-contain"
                />
              </div>
              <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72]">
                <ImagePlus className="h-4 w-4 text-[#00b294]" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFooterLogoUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="rounded-xl border border-slate-200 bg-[#FAFAFB] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#111827]">Browser Favicon</span>
              {form.faviconDataUrl && form.faviconDataUrl !== '/assets/aistudio/Logo-icon_e4a5711a.png' && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, faviconDataUrl: '/assets/aistudio/Logo-icon_e4a5711a.png' })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#ff0031]"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Square icon (64×64px) for browser tab.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img
                  src={form.faviconDataUrl || '/assets/aistudio/Logo-icon_e4a5711a.png'}
                  alt="Favicon preview"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#111827] hover:border-[#00b294] hover:text-[#008A72]">
                <ImagePlus className="h-4 w-4 text-[#00b294]" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                  onChange={handleFaviconUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Social Media Links (Displayed in Footer) */}
        <div className="rounded-xl border border-slate-200 bg-[#FAFAFB] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[#ff0031]" />
            <h4 className="text-xs font-bold text-[#111827]">
              Footer Social Media Links (Leave blank to hide platform)
            </h4>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={form.socialLinkedin || ''}
                onChange={(e) => setForm({ ...form, socialLinkedin: e.target.value })}
                placeholder="https://linkedin.com/company/..."
                className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Instagram URL
              </label>
              <input
                type="url"
                value={form.socialInstagram || ''}
                onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                placeholder="https://instagram.com/..."
                className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                X (Twitter) URL
              </label>
              <input
                type="url"
                value={form.socialX || ''}
                onChange={(e) => setForm({ ...form, socialX: e.target.value })}
                placeholder="https://x.com/..."
                className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                YouTube URL
              </label>
              <input
                type="url"
                value={form.socialYoutube || ''}
                onChange={(e) => setForm({ ...form, socialYoutube: e.target.value })}
                placeholder="https://youtube.com/@..."
                className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                Facebook URL
              </label>
              <input
                type="url"
                value={form.socialFacebook || ''}
                onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                placeholder="https://facebook.com/..."
                className="min-h-[38px] w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Hero Copy, Contact & Package Base Prices */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Hero H1 Headline
              </label>
              <input
                type="text"
                required
                minLength={5}
                maxLength={160}
                value={form.heroHeadline}
                onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Hero Subheadline
              </label>
              <textarea
                rows={2}
                required
                minLength={5}
                maxLength={320}
                value={form.heroSubheadline}
                onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Conversion Promo Notice
              </label>
              <input
                type="text"
                maxLength={180}
                value={form.promoNotice || ''}
                onChange={(e) => setForm({ ...form, promoNotice: e.target.value })}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                WhatsApp Advisory Number (Digits Only, Kept Active Without Phone Line)
              </label>
              <input
                type="text"
                required
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Zero-Visa (AED)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={form.zeroVisaPriceAed}
                  onChange={(e) =>
                    setForm({ ...form, zeroVisaPriceAed: Number(e.target.value) })
                  }
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  1-Visa (AED)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={form.oneVisaPriceAed}
                  onChange={(e) =>
                    setForm({ ...form, oneVisaPriceAed: Number(e.target.value) })
                  }
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Mainland (AED)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={form.mainlandPriceAed}
                  onChange={(e) =>
                    setForm({ ...form, mainlandPriceAed: Number(e.target.value) })
                  }
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Row 2: Header Navbar Menu Items & Blog Guides */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Header Navbar Menu & Page Content Manager */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 xl:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#ff0031]" />
                <h3 className="font-display text-base font-bold text-[#111827]">
                  Header Navbar Menu &amp; Page Contents
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Add new header links or update labels, visibility, and page contents for Home, Free
                Zones, Mainland, Banking, and Guides.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewNavItem}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-[#111827] px-3.5 text-xs font-bold text-white hover:bg-[#ff0031]"
            >
              <Plus className="h-4 w-4" />
              <span>Add Menu Item</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {navMenuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-[#FAFAFB] p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-slate-400">#{item.order}</span>
                    <span className="font-display font-bold text-[#111827]">{item.label}</span>
                    <span className="font-mono text-[11px] text-slate-500">/{item.slug}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-600">{item.pageTitle}</div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Toggle visibility for ${item.label}`}
                    onClick={() => handleToggleNavVisibility(item)}
                    className={`flex h-8 w-8 items-center justify-center rounded border bg-white ${
                      item.visible
                        ? 'border-slate-200 text-[#008A72]'
                        : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    {item.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit ${item.label} menu and content`}
                    onClick={() => openEditNavItem(item)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-700 hover:text-[#111827]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  {!item.isBuiltIn && (
                    <button
                      type="button"
                      aria-label={`Delete ${item.label}`}
                      onClick={() => handleDeleteNavItem(item)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:text-[#ff0031]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blog / Founder Guides Manager */}
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 xl:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#111827]">
                Founder Guides &amp; Blog CMS ({blogPosts.length})
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Published guides display directly in the landing page &amp; Guides library.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewPost}
              className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg bg-[#00b294] px-3.5 text-xs font-bold text-white hover:bg-[#00967C]"
            >
              <Plus className="h-4 w-4" />
              <span>New Guide</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {blogPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-[#FAFAFB] p-3.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{post.category}</span>
                    <span>·</span>
                    <span
                      className={`font-semibold ${
                        post.status === 'published' ? 'text-[#008A72]' : 'text-[#D97706]'
                      }`}
                    >
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{post.readTimeMinutes} min</span>
                  </div>
                  <h4 className="mt-1 truncate font-display text-sm font-bold text-[#111827]">
                    {post.title}
                  </h4>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">{post.excerpt}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Edit ${post.title}`}
                    onClick={() => openEditPost(post)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:text-[#111827]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${post.title}`}
                    onClick={() => handleDeletePost(post.id)}
                    className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:text-[#ff0031]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Header Navbar Menu Item Editor Modal */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
          <form
            onSubmit={handleSaveNavItem}
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h4 className="font-display text-lg font-bold text-[#111827]">
              {editingNavItem
                ? `Edit Menu Item: ${editingNavItem.label}`
                : 'Add New Header Navbar Menu Item'}
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Navbar Label
                </label>
                <input
                  type="text"
                  required
                  minLength={1}
                  maxLength={40}
                  value={navLabel}
                  onChange={(e) => setNavLabel(e.target.value)}
                  placeholder="e.g. UAE Tax"
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  URL Slug
                </label>
                <input
                  type="text"
                  disabled={Boolean(editingNavItem?.isBuiltIn)}
                  value={navSlug || slugify(navLabel)}
                  onChange={(e) => setNavSlug(slugify(e.target.value))}
                  placeholder="uae-tax"
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-xs disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Sort Order
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={navOrder}
                  onChange={(e) => setNavOrder(Number(e.target.value))}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Page Heading (H1)
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={160}
                value={navPageTitle}
                onChange={(e) => setNavPageTitle(e.target.value)}
                placeholder="Page hero heading displayed on this section"
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Page Intro / Subtitle
              </label>
              <textarea
                rows={2}
                maxLength={400}
                value={navPageSubtitle}
                onChange={(e) => setNavPageSubtitle(e.target.value)}
                placeholder="Concise introduction shown under the page heading..."
                className="w-full rounded-lg border border-slate-300 p-3 text-xs"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Page Body Content
              </label>
              <textarea
                rows={5}
                maxLength={12000}
                value={navPageBody}
                onChange={(e) => setNavPageBody(e.target.value)}
                placeholder="Detailed section overview, bullet points, or regulatory details..."
                className="w-full rounded-lg border border-slate-300 p-3 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Primary CTA Label
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={navCtaLabel}
                  onChange={(e) => setNavCtaLabel(e.target.value)}
                  placeholder="Calculate My Setup Cost"
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#111827]">
                  <input
                    type="checkbox"
                    checked={navVisible}
                    onChange={(e) => setNavVisible(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#ff0031]"
                  />
                  <span>Show item in header navbar</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNavModal(false)}
                className="min-h-[40px] rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingNav}
                className="min-h-[40px] rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029]"
              >
                {savingNav ? 'Saving...' : 'Save Menu & Content'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blog Editor Modal */}
      {showPostForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
          <form
            onSubmit={handleSavePost}
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h4 className="font-display text-lg font-bold text-[#111827]">
              {editingPostId ? 'Edit Regulatory Guide' : 'Publish New Regulatory Guide'}
            </h4>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Title</label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={180}
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Category</label>
                <input
                  type="text"
                  required
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Author</label>
                <input
                  type="text"
                  required
                  value={postAuthor}
                  onChange={(e) => setPostAuthor(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
                <select
                  value={postStatus}
                  onChange={(e) => setPostStatus(e.target.value as 'draft' | 'published')}
                  className="min-h-[42px] w-full rounded-lg border border-slate-300 bg-white px-3 text-xs"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Excerpt (10–400 chars)
              </label>
              <textarea
                rows={2}
                required
                minLength={10}
                maxLength={400}
                value={postExcerpt}
                onChange={(e) => setPostExcerpt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Briefing Content
              </label>
              <textarea
                rows={6}
                required
                minLength={20}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 text-xs leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">Read Time (min):</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={postReadTime}
                  onChange={(e) => setPostReadTime(Number(e.target.value))}
                  className="h-9 w-16 rounded border border-slate-300 px-2 font-mono text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="min-h-[40px] rounded-lg border border-slate-300 px-4 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="min-h-[40px] rounded-lg bg-[#ff0031] px-4 text-xs font-bold text-white hover:bg-[#D90029]"
                >
                  {savingPost ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
