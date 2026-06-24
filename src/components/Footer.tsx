import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Mail, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthState } from '../hooks/useAuthState';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Compact switch toggle component matching the user's uploaded reference screenshot
interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out select-none focus:outline-hidden disabled:opacity-60 shrink-0 ${
        checked ? 'bg-purple-600' : 'bg-slate-400'
      }`}
    >
      {/* Sliding handle */}
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out absolute top-1 ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
      {/* Label Text inside the pill switch */}
      <span className={`absolute top-1 text-[8px] font-bold tracking-wider select-none leading-none flex items-center h-4 uppercase pointer-events-none ${
        checked ? 'left-1.5 text-white' : 'right-1.5 text-slate-100'
      }`}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuthState();
  
  // Newsletter alert state
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subDocId, setSubDocId] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);

  // Personalized Ads consent state
  const [adsConsent, setAdsConsent] = useState<'granted' | 'denied' | 'pending'>('pending');

  // Sync ads consent from localstorage
  useEffect(() => {
    const checkConsent = () => {
      const val = localStorage.getItem('google_ads_personalized_consent');
      setAdsConsent((val as 'granted' | 'denied') || 'pending');
    };
    checkConsent();
    window.addEventListener('storage', checkConsent);
    const interval = setInterval(checkConsent, 1000);
    return () => {
      window.removeEventListener('storage', checkConsent);
      clearInterval(interval);
    };
  }, []);

  // Sync newsletter state from Firestore subscribers database
  useEffect(() => {
    if (!user || !user.email) {
      setIsSubscribed(false);
      setSubDocId(null);
      return;
    }

    const checkSubscription = async () => {
      try {
        const q = query(
          collection(db, 'subscribers'),
          where('email', '==', user.email.toLowerCase())
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setIsSubscribed(true);
          setSubDocId(querySnapshot.docs[0].id);
        } else {
          setIsSubscribed(false);
          setSubDocId(null);
        }
      } catch (err) {
        console.error('Error checking newsletter subscription', err);
      }
    };

    checkSubscription();
  }, [user]);

  // Handle setting Ads consent
  const handleSetAdsConsent = (value: 'granted' | 'denied') => {
    localStorage.setItem('google_ads_personalized_consent', value);
    setAdsConsent(value);
    
    if (window.hasOwnProperty('adsbygoogle')) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).requestNonPersonalizedAds = value === 'granted' ? 0 : 1;
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const toggleAdsConsent = () => {
    const nextValue = adsConsent === 'granted' ? 'denied' : 'granted';
    handleSetAdsConsent(nextValue);
  };

  // Handle Newsletter alerts subscription / unsubscription actions
  const handleNewsletterAction = async (target: 'subscribe' | 'unsubscribe') => {
    if (!user) {
      const confirmSignIn = window.confirm(
        "To subscribe or unsubscribe from newsletter alerts, you must be logged in. Would you like to sign in with your Google account now?"
      );
      if (confirmSignIn) {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithPopup(auth, provider);
        } catch (err) {
          console.error("Popup sign in failed", err);
        }
      }
      return;
    }

    setIsSubscribing(true);
    try {
      if (target === 'unsubscribe') {
        if (subDocId) {
          await deleteDoc(doc(db, 'subscribers', subDocId));
        } else {
          const q = query(
            collection(db, 'subscribers'), 
            where('email', '==', user.email.toLowerCase())
          );
          const snap = await getDocs(q);
          for (const docItem of snap.docs) {
            await deleteDoc(doc(db, 'subscribers', docItem.id));
          }
        }
        setIsSubscribed(false);
        setSubDocId(null);
      } else {
        // Prevent duplicate collections
        const q = query(
          collection(db, 'subscribers'), 
          where('email', '==', user.email.toLowerCase())
        );
        const snap = await getDocs(q);
        
        let newDocId = null;
        if (snap.empty) {
          const newDocRef = await addDoc(collection(db, 'subscribers'), {
            email: user.email.toLowerCase(),
            createdAt: serverTimestamp()
          });
          newDocId = newDocRef.id;
        } else {
          newDocId = snap.docs[0].id;
        }
        
        setIsSubscribed(true);
        setSubDocId(newDocId);

        // Notify backend mail sender
        try {
          await fetch('/api/mail/send-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              title: "Welcome to Current News Alerts!",
              link: window.location.origin
            })
          });
        } catch (err) {
          console.warn('Backend mail API call offline:', err);
        }
      }
    } catch (err) {
      console.error('Newsletter operation failed:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleToggleNewsletter = () => {
    if (isSubscribed) {
      handleNewsletterAction('unsubscribe');
    } else {
      handleNewsletterAction('subscribe');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-200 border-t border-slate-800 text-[10px] sm:text-xs" id="main-footer">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-5">
        {/* Enforced grid-cols-4 layout on all screen sizes, in one horizontal line */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-4 lg:gap-8">
          
          {/* Brand & Mission Column */}
          <div className="flex flex-col space-y-1.5 border-r border-slate-800/85 pr-1.5 sm:pr-4 lg:pr-8">
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 text-white">
              <img 
                src="https://i.imgur.com/gq2X5nE.jpeg" 
                alt="Current News Logo" 
                className="h-4.5 w-4.5 sm:h-6 sm:w-6 rounded-md object-cover border border-slate-700 shrink-0"
                referrerPolicy="no-referrer"
              />
              <span className="font-display font-bold text-[9px] sm:text-[11px] md:text-xs tracking-tight uppercase truncate">Current News</span>
            </Link>
            <p className="text-[8px] sm:text-[10px] text-slate-300 leading-tight">
              Serving public interest with transparent, accurate journalism.
            </p>
          </div>

          {/* Redesigned Newsletter Alerts Column */}
          <div className="flex flex-col space-y-1.5 border-r border-slate-800/85 pr-1.5 sm:pr-4 lg:pr-8" id="footer-subscriber-column">
            <h4 className="font-display font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider text-white flex items-center gap-1">
              <Mail className="h-3 w-3 text-indigo-400 shrink-0" />
              <span className="truncate">Alerts</span>
            </h4>
            
            <div className="space-y-1.5" id="newsletter-alerts-controls">
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-200 text-[8px] sm:text-[10px]">News Alerts:</span>
                <ToggleSwitch 
                  checked={isSubscribed} 
                  onChange={handleToggleNewsletter} 
                  disabled={isSubscribing} 
                />
              </div>
              
              <div className="text-[8px] sm:text-[9px] text-slate-350 font-mono leading-tight">
                {isSubscribing ? (
                  <span className="flex items-center gap-0.5 text-slate-350">
                    <Loader2 className="h-2 w-2 animate-spin" /> Updating
                  </span>
                ) : isSubscribed ? (
                  <span className="text-emerald-400 font-bold uppercase">Active</span>
                ) : (
                  <span className="text-rose-400 font-bold uppercase">Disabled</span>
                )}
              </div>
            </div>
          </div>

          {/* Redesigned Data & Ads Policy Column */}
          <div className="flex flex-col space-y-1.5 border-r border-slate-800/85 pr-1.5 sm:pr-4 lg:pr-8">
            <h4 className="font-display font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider text-white">
              <span className="truncate">Ads Policy</span>
            </h4>
            
            <div className="space-y-1.5" id="personalized-ads-controls">
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-200 text-[8px] sm:text-[10px]">Personalized:</span>
                <ToggleSwitch 
                  checked={adsConsent === 'granted'} 
                  onChange={toggleAdsConsent} 
                />
              </div>

              <div className="text-[8px] sm:text-[9px] text-slate-350 font-mono leading-tight">
                {adsConsent === 'granted' ? (
                  <span className="text-emerald-400 font-bold uppercase">Allowed</span>
                ) : (
                  <span className="text-rose-400 font-bold uppercase">Denied</span>
                )}
              </div>
            </div>
          </div>

          {/* Useful Reader Information & Nav */}
          <div className="flex flex-col space-y-1.5">
            <h4 className="font-display font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider text-white">Resources</h4>
            <div className="flex flex-col space-y-1 text-[8px] sm:text-[10px]">
              <Link to="/" className="text-slate-200 hover:text-white transition-colors">Feed</Link>
              <Link to="/admin" className="text-slate-200 hover:text-white transition-colors">Portal</Link>
              <Link to="/privacy" className="text-slate-200 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-slate-200 hover:text-white transition-colors">Terms</Link>
            </div>
          </div>

        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[8px] sm:text-[10px] text-slate-400">
          <p>© {currentYear} Current News.</p>
          <span className="mt-0.5 sm:mt-0 font-mono text-[7px] sm:text-[9px] text-slate-400">Autonomous Press Alliance</span>
        </div>
      </div>
    </footer>
  );
}
