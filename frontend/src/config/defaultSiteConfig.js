import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, API_BASE } from '../services/api';
import { addNodeToTree, updateNodeInTree, removeNodeFromTree, moveNodeInTree, generateId } from '../utils/treeModifier';

// ─── DEFAULT SITE CONFIGURATION ──────────────────────────────────────────────
export const DEFAULT_CONFIG = {
  siteName: 'TripGalileo',
  siteTagline: 'Your Ultimate Travel Partner',
  logo: '',
  favicon: '',
  publishedAt: null,
  isDraft: true,

  theme: {
    primaryColor: '#FF6333',
    secondaryColor: '#0D1B2E',
    accentColor: '#FFB347',
    backgroundColor: '#ffffff',
    textColor: '#0D1B2E',
    fontFamily: 'Outfit',
    headingFont: 'Outfit',
    bodyFont: 'Outfit',
    baseFontSize: 16,
    headingSizes: { h1: 56, h2: 40, h3: 32, h4: 24, h5: 20, h6: 16 },
    lineHeight: 1.6,
    letterSpacing: 0,
    borderRadius: 12,
    buttonRadius: 8,
    cardRadius: 12,
    shadow: 'medium',
    spacing: 'normal',
    darkMode: false,
    customCSS: ''
  },

  menus: {
    header: [
      { id: 'selfdrive', label: 'Self Drive', href: '/self-drive', children: [] },
      { id: 'packages', label: 'Trip Packages', href: '/packages', children: [] },
      { id: 'hotels', label: 'Hotels', href: '/hotels', children: [] },
      { id: 'flights', label: 'Flights', href: '/flights', children: [] },
      { id: 'craftmytrip', label: 'Craft My Trip', href: '/craft', children: [] }
    ],
    footer: [
      { id: 'about', label: 'About Us', href: '/about' },
      { id: 'contact', label: 'Contact', href: '/contact' },
      { id: 'privacy', label: 'Privacy Policy', href: '/privacy' },
      { id: 'terms', label: 'Terms of Service', href: '/terms' }
    ],
    headerStyle: {
      background: '#ffffff',
      textColor: '#0D1B2E',
      sticky: true,
      transparent: false,
      showCTA: true,
      ctaText: 'Book Now',
      ctaAction: 'scroll-to-search'
    }
  },

  pages: {
    home: {
      id: 'home',
      title: 'Home',
      slug: '/',
      status: 'published',
      isHome: true,
      seo: {
        title: 'TripGalileo - Your Ultimate Travel Partner',
        description: 'Book hotels, vehicles, packages and flights with TripGalileo.',
        slug: '/',
        ogImage: '',
        ogTitle: '',
        ogDescription: '',
        twitterCard: 'summary_large_image',
        schema: 'TravelAgency',
        robots: 'index,follow',
        sitemap: true
      },
      sections: [
        {
          id: 'hero-default',
          type: 'hero',
          visible: true,
          locked: false,
          label: 'Hero Banner',
          props: {
            heading: 'WOW GOA',
            subheading: 'Discover Goa on your own terms. Rent premium cars, motorbikes, and luxury hotels.',
            buttonText: 'Explore Now',
            buttonAction: 'scroll-to-search',
            buttonStyle: 'primary',
            backgroundType: 'gradient',
            backgroundColor: '#0D1B2E',
            gradientFrom: '#0D1B2E',
            gradientTo: '#1a3a5c',
            overlayOpacity: 0.5,
            textAlign: 'center',
            minHeight: 600,
            showOverlay: true,
            parallax: false
          },
          style: {}
        },
        {
          id: 'search-default',
          type: 'bookingWidget',
          visible: true,
          locked: false,
          label: 'Booking Search Widget',
          props: { defaultTab: 'selfdrive', showTabs: true },
          style: {}
        },
        {
          id: 'packages-default',
          type: 'dynamicPackages',
          visible: true,
          locked: false,
          label: 'Popular Packages',
          props: { heading: 'Popular Trip Packages', subheading: 'Curated experiences for the perfect getaway', limit: 6, layout: 'grid' },
          style: {}
        },
        {
          id: 'hotels-default',
          type: 'dynamicHotels',
          visible: true,
          locked: false,
          label: 'Featured Hotels',
          props: { heading: 'Premium Luxury Stays', subheading: 'Handpicked hotels and resorts in prime locations', limit: 6, layout: 'grid' },
          style: {}
        },
        {
          id: 'vehicles-default',
          type: 'dynamicVehicles',
          visible: true,
          locked: false,
          label: 'Self Drive Fleet',
          props: { heading: 'Self Drive Fleet', subheading: 'Top condition cars and bikes for your journey', limit: 8, layout: 'grid' },
          style: {}
        },
        {
          id: 'features-default',
          type: 'features',
          visible: true,
          locked: false,
          label: 'Features / Why Choose Us',
          props: { heading: 'Why Choose Us?', subheading: 'We deliver excellence across all our services', layout: 'grid' },
          style: {}
        }
      ]
    }
  },

  globalSections: {
    header: { enabled: true, sectionId: null },
    footer: { enabled: true, sectionId: null }
  },

  popups: [],
  forms: [],

  assetLibrary: {
    images: [],
    videos: [],
    documents: []
  },

  savedTemplates: [],
  globalTokens: {
    colors: {},
    typography: {},
    spacing: {},
    shadows: {}
  },

  versionHistory: [],
  draftConfig: null,

  settings: {
    googleAnalytics: '',
    facebookPixel: '',
    customHeadCode: '',
    customBodyCode: '',
    maintenance: false,
    maintenanceMessage: 'We are updating our website. Please check back soon.'
  }
};

// ─── CONTEXT ─────────────────────────────────────────────────────────────────
const SiteConfigContext = createContext();

const MAX_UNDO_STACK = 50;
const MAX_VERSION_HISTORY = 20;

export function SiteConfigProvider({ children }) {
  const [siteConfig, setSiteConfig] = useState(DEFAULT_CONFIG);
  const [liveConfig, setLiveConfig] = useState(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await apiFetch(`${API_BASE}?resource=site_config`).then(res => res.json());
        if (data && data.draft_config) {
          setSiteConfig(deepMerge(DEFAULT_CONFIG, JSON.parse(data.draft_config)));
        }
        if (data && data.live_config) {
          setLiveConfig(deepMerge(DEFAULT_CONFIG, JSON.parse(data.live_config)));
        }
      } catch (e) {
        console.warn('Failed to load site config from backend, using default.', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadConfig();
  }, []);

  // Undo/Redo stacks
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const suppressHistory = useRef(false);

  // Active states for builder
  const [activePage, setActivePage] = useState('home');
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [builderMode, setBuilderMode] = useState('builder'); // builder|theme|navigation|seo|pages|popups|forms|assets
  const [devicePreview, setDevicePreview] = useState('desktop');
  const [isDragging, setIsDragging] = useState(false);
  
  // New builder states
  const [clipboard, setClipboard] = useState(null); // stores copied section
  const [zoom, setZoom] = useState(1); // 0.25 to 4
  const [autoSaveAt, setAutoSaveAt] = useState(null);

  const saveToDb = useCallback(async (draft, live) => {
    if (!isLoaded) return;
    try {
      await apiFetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify({
          action: 'save_site_config',
          draft_config: draft,
          live_config: live,
          domain: window.location.hostname
        })
      });
    } catch (err) {
      console.error('Failed to save config to DB', err);
    }
  }, [isLoaded]);

  // Save to DB (debounced) and localStorage on every change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('tripGalileoSiteConfig_v2', JSON.stringify(siteConfig));
    const timeout = setTimeout(() => {
      saveToDb(siteConfig, liveConfig);
    }, 1500);
    return () => clearTimeout(timeout);
  }, [siteConfig, liveConfig, isLoaded, saveToDb]);

  // Apply theme CSS variables globally
  useEffect(() => {
    const root = document.documentElement;
    const t = siteConfig.theme;
    if (t.primaryColor) {
      root.style.setProperty('--primary-color', t.primaryColor);
      root.style.setProperty('--accent', t.primaryColor);
      root.style.setProperty('--wb-primary', t.primaryColor);
    }
    if (t.secondaryColor) root.style.setProperty('--wb-secondary', t.secondaryColor);
    if (t.accentColor) root.style.setProperty('--wb-accent', t.accentColor);
    if (t.backgroundColor) root.style.setProperty('--wb-bg', t.backgroundColor);
    if (t.textColor) root.style.setProperty('--wb-text', t.textColor);
    if (t.fontFamily) {
      root.style.setProperty('--font-family-base', `'${t.fontFamily}', sans-serif`);
      document.body.style.fontFamily = `'${t.fontFamily}', sans-serif`;
    }
    if (t.borderRadius !== undefined) root.style.setProperty('--wb-radius', `${t.borderRadius}px`);
    if (t.darkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [siteConfig.theme]);

  // ─── HELPER: push to undo stack ──────────────────────────────────────────
  const pushHistory = useCallback((prevConfig) => {
    if (suppressHistory.current) return;
    undoStack.current = [...undoStack.current.slice(-MAX_UNDO_STACK + 1), JSON.stringify(prevConfig)];
    redoStack.current = [];
  }, []);

  const updateConfig = useCallback((updater) => {
    setSiteConfig(prev => {
      pushHistory(prev);
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  }, [pushHistory]);

  // ─── UNDO / REDO ─────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    setSiteConfig(prev => {
      redoStack.current = [...redoStack.current, JSON.stringify(prev)];
      const last = undoStack.current[undoStack.current.length - 1];
      undoStack.current = undoStack.current.slice(0, -1);
      suppressHistory.current = true;
      setTimeout(() => { suppressHistory.current = false; }, 0);
      return JSON.parse(last);
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    setSiteConfig(prev => {
      undoStack.current = [...undoStack.current, JSON.stringify(prev)];
      const last = redoStack.current[redoStack.current.length - 1];
      redoStack.current = redoStack.current.slice(0, -1);
      suppressHistory.current = true;
      setTimeout(() => { suppressHistory.current = false; }, 0);
      return JSON.parse(last);
    });
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  // ─── VERSION HISTORY ─────────────────────────────────────────────────────
  const saveVersion = useCallback((label = '') => {
    updateConfig(prev => {
      const snapshot = {
        id: Date.now(),
        label: label || `Version ${new Date().toLocaleString()}`,
        timestamp: new Date().toISOString(),
        config: JSON.stringify(prev)
      };
      const history = [snapshot, ...(prev.versionHistory || [])].slice(0, MAX_VERSION_HISTORY);
      return { ...prev, versionHistory: history };
    });
  }, [updateConfig]);

  const restoreVersion = useCallback((versionId) => {
    setSiteConfig(prev => {
      const version = prev.versionHistory.find(v => v.id === versionId);
      if (!version) return prev;
      pushHistory(prev);
      const restored = JSON.parse(version.config);
      return { ...restored, versionHistory: prev.versionHistory };
    });
  }, [pushHistory]);

  // ─── PUBLISH / DRAFT ─────────────────────────────────────────────────────
  const publishSite = useCallback(() => {
    updateConfig(prev => {
      const updated = {
        ...prev,
        isDraft: false,
        publishedAt: new Date().toISOString()
      };
      
      // Save to live config
      localStorage.setItem('tripGalileoSiteConfig_live_v2', JSON.stringify(updated));
      setLiveConfig(updated);
      saveToDb(updated, updated);
      
      return updated;
    });
    saveVersion('Published');
    alert('Site successfully published! Live frontend updated.');
  }, [updateConfig, saveVersion, saveToDb]);

  const saveDraft = useCallback(() => {
    updateConfig(prev => ({ ...prev, isDraft: true }));
    saveToDb(siteConfig, liveConfig);
  }, [updateConfig, saveToDb, siteConfig, liveConfig]);

  const revertDraft = useCallback(() => {
    const liveStr = localStorage.getItem('tripGalileoSiteConfig_live_v2');
    if (liveStr) {
      const restored = JSON.parse(liveStr);
      localStorage.setItem('tripGalileoSiteConfig_v2', liveStr);
      setSiteConfig(deepMerge(DEFAULT_CONFIG, restored));
      saveToDb(restored, restored);
      alert('Draft reverted to the currently published version.');
    } else {
      alert('No published version found to revert to.');
    }
  }, [saveToDb]);

  // ─── THEME ───────────────────────────────────────────────────────────────
  const updateTheme = useCallback((updates) => {
    updateConfig(prev => ({ ...prev, theme: { ...prev.theme, ...updates } }));
  }, [updateConfig]);

  // ─── MENUS ───────────────────────────────────────────────────────────────
  const updateMenu = useCallback((menuKey, newItems) => {
    updateConfig(prev => ({ ...prev, menus: { ...prev.menus, [menuKey]: newItems } }));
  }, [updateConfig]);

  const updateHeaderStyle = useCallback((updates) => {
    updateConfig(prev => ({
      ...prev,
      menus: { ...prev.menus, headerStyle: { ...prev.menus.headerStyle, ...updates } }
    }));
  }, [updateConfig]);

  // ─── PAGES ───────────────────────────────────────────────────────────────
  const addPage = useCallback((pageData) => {
    const id = pageData.slug?.replace(/\//g, '') || `page-${Date.now()}`;
    updateConfig(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [id]: {
          id,
          title: pageData.title || 'New Page',
          slug: pageData.slug || `/${id}`,
          status: 'draft',
          isHome: false,
          seo: { title: pageData.title, description: '', slug: pageData.slug || `/${id}`, robots: 'index,follow', sitemap: true },
          sections: []
        }
      }
    }));
    return id;
  }, [updateConfig]);

  const deletePage = useCallback((pageId) => {
    if (pageId === 'home') return; // protect home
    updateConfig(prev => {
      const { [pageId]: removed, ...rest } = prev.pages;
      return { ...prev, pages: rest };
    });
  }, [updateConfig]);

  const duplicatePage = useCallback((pageId) => {
    updateConfig(prev => {
      const original = prev.pages[pageId];
      if (!original) return prev;
      const newId = `${pageId}-copy-${Date.now()}`;
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [newId]: {
            ...JSON.parse(JSON.stringify(original)),
            id: newId,
            title: `${original.title} (Copy)`,
            slug: `${original.slug}-copy`,
            status: 'draft',
            isHome: false
          }
        }
      };
    });
  }, [updateConfig]);

  const renamePage = useCallback((pageId, newTitle, newSlug) => {
    updateConfig(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: { ...prev.pages[pageId], title: newTitle, slug: newSlug || prev.pages[pageId].slug }
      }
    }));
  }, [updateConfig]);

  const setPageStatus = useCallback((pageId, status) => {
    updateConfig(prev => ({
      ...prev,
      pages: { ...prev.pages, [pageId]: { ...prev.pages[pageId], status } }
    }));
  }, [updateConfig]);

  const updatePageSEO = useCallback((pageId, seoUpdates) => {
    updateConfig(prev => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: {
          ...prev.pages[pageId],
          seo: { ...prev.pages[pageId].seo, ...seoUpdates }
        }
      }
    }));
  }, [updateConfig]);

  const applyTemplate = useCallback((templateConfig) => {
    updateConfig(prev => ({
      ...prev,
      ...templateConfig,
      versionHistory: prev.versionHistory,
      assetLibrary: prev.assetLibrary
    }));
  }, [updateConfig]);

