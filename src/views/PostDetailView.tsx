import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Post } from '../types';
import AdSpace from '../components/AdSpace';
import EmbedHandler from '../components/EmbedHandler';
import { Calendar, ChevronLeft, Award, Clock, Twitter, Send, Copy, Check, Share2, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function PostDetailView() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [globalPenName, setGlobalPenName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reactions Local States
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myReaction, setMyReaction] = useState<'liked' | 'disliked' | null>(null);

  useEffect(() => {
    if (post) {
      setLikes(post.likes || 0);
      setDislikes(post.dislikes || 0);
      const saved = localStorage.getItem(`react_${post.id}`) as 'liked' | 'disliked' | null;
      setMyReaction(saved);
    }
  }, [post]);

  const handleReaction = async (type: 'liked' | 'disliked') => {
    if (!post) return;
    const postRef = doc(db, 'posts', post.id);
    let newLikes = likes;
    let newDislikes = dislikes;
    let nextReaction: 'liked' | 'disliked' | null = null;

    let likesDiff = 0;
    let dislikesDiff = 0;

    if (myReaction === type) {
      // Undo
      if (type === 'liked') {
        newLikes = Math.max(0, likes - 1);
        likesDiff = -1;
      } else {
        newDislikes = Math.max(0, dislikes - 1);
        dislikesDiff = -1;
      }
      localStorage.removeItem(`react_${post.id}`);
      nextReaction = null;
    } else {
      // Apply
      if (type === 'liked') {
        newLikes = likes + 1;
        likesDiff = 1;
        if (myReaction === 'disliked') {
          newDislikes = Math.max(0, dislikes - 1);
          dislikesDiff = -1;
        }
      } else {
        newDislikes = dislikes + 1;
        dislikesDiff = 1;
        if (myReaction === 'liked') {
          newLikes = Math.max(0, likes - 1);
          likesDiff = -1;
        }
      }
      localStorage.setItem(`react_${post.id}`, type);
      nextReaction = type;
    }

    setLikes(newLikes);
    setDislikes(newDislikes);
    setMyReaction(nextReaction);

    try {
      const updates: Record<string, any> = {};
      if (likesDiff !== 0) updates.likes = increment(likesDiff);
      if (dislikesDiff !== 0) updates.dislikes = increment(dislikesDiff);
      if (Object.keys(updates).length > 0) {
        await updateDoc(postRef, updates);
      }
    } catch (err) {
      console.error('Failed to write reaction to cloud', err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      // Load global pen name setting
      try {
        const docSettings = await getDoc(doc(db, 'settings', 'editorProfile'));
        if (docSettings.exists()) {
          setGlobalPenName(docSettings.data().penName || '');
        }
      } catch (settingsErr) {
        console.warn('Failed to load global profile settings', settingsErr);
      }

      const docPath = `posts/${id}`;
      try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPost({
            id: docSnap.id,
            ...docSnap.data()
          } as Post);
        } else {
          setError('Article not found. The article could have been removed by an administrator or has an incorrect web link.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch article details. There might be a temporary server disconnection.');
        try {
          handleFirestoreError(err, OperationType.GET, docPath);
        } catch (wrappedErr) {
          // Keep state running for client-side rendering
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    if (post) {
      // Trigger a Google Analytics view event dynamically for this particular article!
      if (typeof window !== 'undefined') {
        const anyWindow = window as any;
        if (anyWindow.gtag) {
          try {
            // Standard GA page view event customized with page path and title
            anyWindow.gtag('config', 'G-7XETKW0Q7M', {
              page_title: post.title,
              page_path: `/post/${post.id}`,
              page_location: window.location.href
            });
            // Detailed engagement event
            anyWindow.gtag('event', 'news_item_view', {
              article_id: post.id,
              article_title: post.title,
              article_author: globalPenName || post.authorName || 'Chronicle Staff Report',
              engagement_time_msec: Date.now()
            });
            console.log(`[Google Analytics] Dynamic view tracked for item: ${post.title}`);
          } catch (gaError) {
            console.warn('[Google Analytics] Failed to execute gtag event tracking', gaError);
          }
        }
      }
    }
  }, [post, globalPenName]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center" id="post-detail-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-mono font-medium">Downloading full publication content...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center" id="post-detail-error">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8" id="error-box">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Failed to Load Article</h3>
          <p className="text-sm text-slate-600 mb-6">{error || 'Unknown error occurred.'}</p>
          <Link 
            to="/" 
            className="inline-flex items-center space-x-1 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Public Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  // Format publication date
  let publishDate = 'Recent Post';
  if (post.createdAt) {
    const d = typeof post.createdAt.toDate === 'function' ? post.createdAt.toDate() : new Date(post.createdAt);
    publishDate = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id={`article-${post.id}`}>
      
      {/* Editorial Breadcrumbs & Back Trigger */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/" 
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
          id="back-to-feed-link"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span>Back to Feed</span>
        </Link>
        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold font-mono px-2.5 py-1 rounded-sm uppercase tracking-wider">
          Independent Edition
        </span>
      </div>

      {/* ⚠️ AD PLACEMENT: Leaderboard top cover */}
      <AdSpace type="leaderboard" />

      {/* Main Grid: Left for article detail, Right for sticky sidebar banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-8">
        
        {/* Left main area: takes 3/4 layout */}
        <div className="lg:col-span-3">
          
          {/* Article Header */}
          <header className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-950 tracking-tight leading-tight mb-4">
              {post.title}
            </h1>

            {/* Author Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-sans mt-6">
              <div className="flex items-center space-x-2.5">
                <img 
                  src="https://i.imgur.com/gFgShoZ.jpeg" 
                  alt="Current News Live Avatar" 
                  className="h-9 w-9 rounded-full object-cover border border-slate-200/80 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="font-semibold text-slate-900 block leading-tight">
                    {globalPenName || post.authorName || 'Chronicle Staff Report'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1 uppercase">
                    <Award className="h-3 w-3 text-amber-500" /> Ground Journalism
                  </span>
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{publishDate}</span>
              </span>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>3 min read</span>
              </span>
            </div>

            {/* Share action bar */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              {/* Readers Reaction Buttons */}
              <div className="flex items-center gap-2" id="article-reactions-group">
                <button
                  onClick={() => handleReaction('liked')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                    myReaction === 'liked'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-3xs'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Like this dispatch"
                >
                  <ThumbsUp className={`h-4 w-4 ${myReaction === 'liked' ? 'fill-emerald-600 animate-pulse' : ''}`} />
                  <span>{likes} Likes</span>
                </button>

                <button
                  onClick={() => handleReaction('disliked')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                    myReaction === 'disliked'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-3xs'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                  title="Dislike this dispatch"
                >
                  <ThumbsDown className={`h-4 w-4 ${myReaction === 'disliked' ? 'fill-rose-600' : ''}`} />
                  <span>{dislikes} Dislikes</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Twitter Share */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 dark:text-sky-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Share on Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  <span>Twitter</span>
                </a>

                {/* WhatsApp Share */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  title="Copy Link to Clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500 animate-bounce" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Clean Rendered HTML Article Body */}
          <div 
            className="article-rich-text prose max-w-none break-word break-words overflow-hidden shadow-xs bg-white rounded-2xl border border-slate-100 p-6 sm:p-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
            id="article-content"
          />

          {/* AUTO-EMBED SECTION: Injects custom YouTube and FaceBook players natively */}
          <EmbedHandler youtubeUrl={post.youtubeUrl} facebookUrl={post.facebookUrl} customLinks={post.customLinks} />

          {/* ⚠️ AD PLACEMENT: Footer bottom ad zone */}
          <AdSpace type="footer" />

        </div>

        {/* Right Area: Sticky sidebar takes 1/4 layout */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* ⚠️ AD PLACEMENT: Sidebar ad zone */}
            <AdSpace type="sidebar" />

            {/* Additional informational widgets */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
              <h4 className="font-display font-extrabold text-sm text-slate-950 uppercase tracking-widest border-b border-slate-100 pb-3 mb-3">
                Editorial Disclaimer
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                The views, positions, and contents disclosed inside this publication correspond directly to raw press reportings and are filed on our secure servers under autonomous, zero-bias journalism guidelines.
              </p>
            </div>

          </div>
        </div>

      </div>

    </article>
  );
}
