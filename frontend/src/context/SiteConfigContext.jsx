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

export function SiteConfigProvider({ children }) {
  return (
    <SiteConfigContext.Provider value={{
      siteConfig: DEFAULT_CONFIG,
      liveConfig: DEFAULT_CONFIG
    }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}