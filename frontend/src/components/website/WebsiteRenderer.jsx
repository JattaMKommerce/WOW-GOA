import React, { useMemo } from 'react';
import HeroSection from './sections/HeroSection';
import BookingWidgetSection from './sections/BookingWidgetSection';
import FeaturedHotelsSection, {
  FeaturedVehiclesSection,
  PackagesSection,
  SectionHeader,
  EmptyState
} from './sections/DynamicDataSections';
import {
  FeaturesSection,
  TestimonialsSection,
  CTASection,
  FAQSection,
  ContactFormSection,
  TeamSection,
  CounterSection,
  GallerySection,
  VideoSection,
  HeadingSection,
  DividerSection,
  SpacerSection
} from './sections/ContentSections';
import {
  ContainerNode,
  GridNode,
  FlexNode,
  TextNode,
  ButtonNode,
  ImageNode
} from './sections/BasicComponents';

import { generateNodeStyles } from '../../utils/StyleEngine';

// ─── SECTION REGISTRY ─────────────────────────────────────────────────────────
// Maps section type strings → React components
const SECTION_REGISTRY = {
  hero: HeroSection,
  bookingWidget: BookingWidgetSection,
  dynamicHotels: FeaturedHotelsSection,
  dynamicVehicles: FeaturedVehiclesSection,
  dynamicPackages: PackagesSection,
  features: FeaturesSection,
  testimonials: TestimonialsSection,
  cta: CTASection,
  faq: FAQSection,
  contactForm: ContactFormSection,
  team: TeamSection,
  counter: CounterSection,
  gallery: GallerySection,
  video: VideoSection,
  heading: HeadingSection,
  divider: DividerSection,
  spacer: SpacerSection,
  container: ContainerNode,
  grid: GridNode,
  flex: FlexNode,
  text: TextNode,
  button: ButtonNode,
  image: ImageNode
};

// ─── WEBSITE RENDERER ─────────────────────────────────────────────────────────
// Renders a full page from section config
// Used by: (1) Builder canvas (live preview), (2) Customer-facing frontend
export default function WebsiteRenderer({
  sections = [],
  liveData = {},
  onAction,
  isPreview = false,
  selectedSectionId = null,
  onSelectSection = null,
  onDrop = null,
  onDragOver = null,
  isDraggingOver = false,
  onContextMenu = null
}) {
  if (!sections || sections.length === 0) {
    return (
      <div style={{
        minHeight: '400px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '16px',
        color: '#94a3b8', textAlign: 'center', padding: '60px'
      }}>
        <div style={{ fontSize: '64px' }}>🏗️</div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#cbd5e1' }}>
          Your page is empty
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '360px', lineHeight: 1.6 }}>
          Drag components from the left panel to start building, or choose a professional template to get started instantly.
        </p>
      </div>
    );
  }

  const dynamicStyles = useMemo(() => generateNodeStyles(sections), [sections]);

  // Recursive node renderer
  const renderNode = (node, depth = 0) => {
    if (!node.visible) return null;

    const Component = SECTION_REGISTRY[node.type];
    const isSelected = isPreview && selectedSectionId === node.id;

    if (!Component) {
      return (
        <div key={node.id} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', margin: '8px', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
          Unknown node type: <code>{node.type}</code>
        </div>
      );
    }

    // Determine basic generic styles applied to all nodes from node.style
    // We only apply non-conflicting styles inline if needed, but mostly we rely on the class.
    const computedStyle = {
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: '-1px',
      cursor: isPreview ? 'pointer' : undefined,
      transition: 'outline 0.1s'
    };

    return (
      <div
        key={node.id}
        className={`node-${node.id}`}
        data-section-id={node.id}
        onClick={isPreview && onSelectSection ? (e) => { e.stopPropagation(); onSelectSection(node.id); } : undefined}
        style={computedStyle}
        onContextMenu={isPreview && onContextMenu ? (e) => onContextMenu(e, node.id) : undefined}
      >
        {/* Hover indicator in preview */}
        {isPreview && !isSelected && (
          <div className="builder-hover-indicator" style={{
            position: 'absolute', inset: 0, zIndex: 10,
            border: '1px dashed transparent',
            transition: 'border-color 0.2s',
            pointerEvents: 'none'
          }} />
        )}

        {/* Pass down children if they exist for nested rendering */}
        <Component
          section={node}
          liveData={liveData}
          onAction={isPreview ? () => {} : onAction}
        >
          {node.children && node.children.length > 0 && (
            <div className="node-children" style={{ display: 'flex', flexDirection: 'column', minHeight: '50px' }}>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </Component>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '100%' }}>
      <style>{dynamicStyles}</style>
      {sections.map((section) => renderNode(section, 0))}

      {/* Drop target at bottom (builder mode only) */}
      {isPreview && onDrop && (
        <div
          onDragOver={e => { e.preventDefault(); onDragOver && onDragOver(sections.length); }}
          onDrop={e => onDrop(e, sections.length)}
          style={{
            minHeight: '80px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '12px', margin: '8px',
            border: `2px dashed ${isDraggingOver ? '#3b82f6' : '#cbd5e1'}`,
            background: isDraggingOver ? 'rgba(59,130,246,0.05)' : 'transparent',
            color: '#94a3b8', fontSize: '13px', fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          {isDraggingOver ? '📥 Drop here' : '+ Drop section here'}
        </div>
      )}
    </div>
  );
}

// ─── SECTION BUILDER OVERLAY ─────────────────────────────────────────────────
function SectionBuilderOverlay({ section }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      zIndex: 100, pointerEvents: 'none'
    }}>
      {/* Section label badge */}
      <div style={{
        position: 'absolute', top: '-1px', left: '50%',
        transform: 'translateX(-50%)',
        background: '#3b82f6', color: '#fff',
        padding: '2px 12px', borderRadius: '0 0 8px 8px',
        fontSize: '11px', fontWeight: 700,
        whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(59,130,246,0.4)'
      }}>
        {section.label || section.type}
      </div>
    </div>
  );
}

// ─── COMPONENT METADATA REGISTRY ─────────────────────────────────────────────
// Metadata for the component library (displayed in the builder sidebar)
export const COMPONENT_LIBRARY = [
  {
    category: 'Structural',
    icon: '📦',
    components: [
      { type: 'container', label: 'Container', icon: '🔲', description: 'Basic box container (div)', defaultProps: {} },
      { type: 'grid', label: 'Grid', icon: '▦', description: 'CSS Grid Layout', defaultProps: { columns: '1fr 1fr', gap: '24px' } },
      { type: 'flex', label: 'Flex Layout', icon: '▤', description: 'Flexbox Layout', defaultProps: { direction: 'row', align: 'center', justify: 'space-between' } }
    ]
  },
  {
    category: 'Basic Elements',
    icon: '✨',
    components: [
      { type: 'text', label: 'Text', icon: 'T', description: 'Heading or Paragraph', defaultProps: { content: 'Enter text here', tag: 'p' } },
      { type: 'button', label: 'Button', icon: 'B', description: 'Clickable button', defaultProps: { text: 'Click Me', action: '' } },
      { type: 'image', label: 'Image', icon: '🖼️', description: 'Static Image', defaultProps: { src: '', alt: '' } }
    ]
  },
  {
    category: 'Layout',
    icon: '📐',
    components: [
      { type: 'hero', label: 'Hero Banner', icon: '🖼️', description: 'Full-width hero with heading, CTA, background', defaultProps: { heading: 'Your Journey Begins Here', subheading: 'Experience the world like never before', buttonText: 'Explore Now', buttonAction: 'scroll', backgroundType: 'gradient', gradientFrom: '#0D1B2E', gradientTo: '#1a3a5c', minHeight: 600, showOverlay: true, overlayOpacity: 0.4, textAlign: 'center' } },
      { type: 'cta', label: 'CTA Banner', icon: '📢', description: 'Call-to-action section with buttons', defaultProps: { heading: 'Ready to Start Your Journey?', subheading: 'Book your perfect trip today', primaryBtnText: 'Book Now', primaryBtnAction: 'scroll-to-search', secondaryBtnText: 'Contact Us', secondaryBtnAction: 'contact' } },
      { type: 'counter', label: 'Stats / Counter', icon: '📊', description: 'Number stats with animated counters', defaultProps: { stats: [{ value: '10,000+', label: 'Happy Customers' }, { value: '500+', label: 'Hotels' }, { value: '200+', label: 'Vehicles' }, { value: '150+', label: 'Packages' }] } },
      { type: 'divider', label: 'Divider', icon: '—', description: 'Horizontal line divider', defaultProps: { paddingV: 24, thickness: 1, color: '#e2e8f0' } },
      { type: 'spacer', label: 'Spacer', icon: '↕️', description: 'Empty spacing element', defaultProps: { height: 60 } }
    ]
  },
  {
    category: 'Booking Widgets',
    icon: '🔎',
    components: [
      { type: 'bookingWidget', label: 'Search Widget', icon: '🔍', description: 'Hotel, vehicle, package & flight search', defaultProps: { defaultTab: 'hotels', showTabs: true } }
    ]
  },
  {
    category: 'Dynamic Data',
    icon: '📡',
    components: [
      { type: 'dynamicHotels', label: 'Featured Hotels', icon: '🏨', description: 'Live hotel listings from booking system', defaultProps: { heading: 'Featured Hotels', subheading: 'Handpicked luxury stays', limit: 6, layout: 'grid' } },
      { type: 'dynamicVehicles', label: 'Vehicle Fleet', icon: '🚗', description: 'Live car & bike listings', defaultProps: { heading: 'Our Fleet', subheading: 'Premium vehicles for every journey', limit: 8, layout: 'grid' } },
      { type: 'dynamicPackages', label: 'Packages', icon: '🧳', description: 'Live trip packages', defaultProps: { heading: 'Popular Packages', subheading: 'Curated travel experiences', limit: 6, layout: 'grid' } },
      { type: 'testimonials', label: 'Testimonials', icon: '⭐', description: 'Customer reviews carousel', defaultProps: { heading: 'What Our Customers Say', subheading: '' } }
    ]
  },
  {
    category: 'Content',
    icon: '📝',
    components: [
      { type: 'features', label: 'Features Grid', icon: '✅', description: 'Why choose us / features cards', defaultProps: { heading: 'Why Choose Us?', subheading: 'We deliver excellence', columns: 3, cardStyle: 'shadow' } },
      { type: 'heading', label: 'Heading & Text', icon: 'Aa', description: 'Rich text, heading, paragraph', defaultProps: { heading: 'About Us', subheading: 'Tell your story here', textAlign: 'left' } },
      { type: 'faq', label: 'FAQ Accordion', icon: '❓', description: 'Expandable FAQ list', defaultProps: { heading: 'Frequently Asked Questions', faqs: [] } },
      { type: 'team', label: 'Team Members', icon: '👥', description: 'Team cards with photos and roles', defaultProps: { heading: 'Meet Our Team', team: [] } },
      { type: 'gallery', label: 'Photo Gallery', icon: '🖼️', description: 'Image grid with lightbox', defaultProps: { heading: 'Gallery', images: [] } },
      { type: 'video', label: 'Video', icon: '🎬', description: 'YouTube or direct video embed', defaultProps: { heading: '', videoType: 'youtube', videoId: '' } },
      { type: 'contactForm', label: 'Contact Form', icon: '📬', description: 'Enquiry and contact form', defaultProps: { heading: 'Get In Touch', subheading: 'We\'d love to hear from you', submitText: 'Send Message' } }
    ]
  }
];

// ─── DEFAULT TEMPLATE CONFIGS ─────────────────────────────────────────────────
export const TEMPLATES = [
  {
    id: 'luxury-agency',
    name: 'Luxury Travel Agency',
    description: 'Premium agency with hero, search, hotels, packages & testimonials',
    thumbnail: '✈️',
    color: '#0D1B2E',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Luxury Travel Agency', description: 'Book luxury hotels, exclusive packages & premium vehicles.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Luxury Travel Redefined', subheading: 'Experience the world\'s finest hotels, exclusive packages, and premium vehicles — all in one place.', buttonText: 'Explore Now', buttonAction: 'scroll-to-search', secondaryButtonText: 'View Packages', secondaryButtonAction: 'packages', backgroundType: 'gradient', gradientFrom: '#0D1B2E', gradientTo: '#1a3a5c', minHeight: 700, showOverlay: false, textAlign: 'center', badge: '🌟 Premium Travel Experience', showStats: true, stats: [{ value: '10K+', label: 'Happy Travelers' }, { value: '500+', label: 'Luxury Hotels' }, { value: '200+', label: 'Destinations' }] }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Booking Search', props: { defaultTab: 'hotels', showTabs: true, padding: '40px 24px', sectionBg: '#f8fafc' }, style: {} },
          { id: 'hotels-1', type: 'dynamicHotels', visible: true, locked: false, label: 'Featured Hotels', props: { heading: 'Premium Luxury Stays', subheading: 'Handpicked hotels and resorts in prime locations', limit: 6, layout: 'grid', padding: '80px 24px' }, style: {} },
          { id: 'packages-1', type: 'dynamicPackages', visible: true, locked: false, label: 'Packages', props: { heading: 'Exclusive Trip Packages', subheading: 'Curated experiences for the perfect getaway', limit: 6, padding: '80px 24px', sectionBg: '#f8fafc' }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'Why Travel With Us?', subheading: 'We\'re committed to making your journey unforgettable', columns: 3, cardStyle: 'gradient' }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Testimonials', props: { heading: 'What Our Clients Say', sectionBg: '#0D1B2E' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Your Perfect Journey Awaits', subheading: 'Book now and get exclusive deals on luxury travel experiences.', primaryBtnText: 'Plan My Trip', secondaryBtnText: 'Talk to an Expert' }, style: {} },
          { id: 'contact-1', type: 'contactForm', visible: true, locked: false, label: 'Contact', props: { heading: 'Get In Touch', subheading: 'Our travel experts are here to create your perfect journey' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'hotel-booking',
    name: 'Hotel Booking Platform',
    description: 'Hotel-focused layout with search, listings, amenities, reviews',
    thumbnail: '🏨',
    color: '#1a56db',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Hotel Booking', description: 'Find and book your perfect hotel stay.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Find Your Perfect Stay', subheading: 'Search thousands of hotels, resorts & boutique properties. Best prices guaranteed.', buttonText: 'Search Hotels', buttonAction: 'scroll-to-search', backgroundType: 'gradient', gradientFrom: '#1a3a5c', gradientTo: '#0D1B2E', minHeight: 600, showOverlay: false, textAlign: 'center', badge: '🏨 Best Hotel Deals' }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Search', props: { defaultTab: 'hotels', showTabs: false, padding: '40px 24px' }, style: {} },
          { id: 'counter-1', type: 'counter', visible: true, locked: false, label: 'Stats', props: { stats: [{ value: '500+', label: 'Hotels Listed' }, { value: '50K+', label: 'Bookings Made' }, { value: '4.8★', label: 'Average Rating' }, { value: '24/7', label: 'Support' }] }, style: {} },
          { id: 'hotels-1', type: 'dynamicHotels', visible: true, locked: false, label: 'Hotels', props: { heading: 'Popular Hotels', subheading: 'Top-rated stays with verified reviews', limit: 9, layout: 'grid' }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'Why Book With Us?', columns: 3, cardStyle: 'shadow' }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Reviews', props: { heading: 'Guest Reviews' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Ready to Check In?', subheading: 'Find and book your perfect stay today.', primaryBtnText: 'Browse Hotels', secondaryBtnText: 'Contact Us' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'car-rental',
    name: 'Car & Vehicle Rental',
    description: 'Vehicle-first layout for car and bike rental businesses',
    thumbnail: '🚗',
    color: '#059669',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Car & Bike Rental', description: 'Rent premium cars and bikes.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Drive Your Adventure', subheading: 'Rent premium, fully sanitized cars and bikes. Self-drive freedom at your fingertips.', buttonText: 'Book a Vehicle', buttonAction: 'scroll-to-search', backgroundType: 'gradient', gradientFrom: '#064e3b', gradientTo: '#065f46', minHeight: 600, showOverlay: false, textAlign: 'center', badge: '🚗 Premium Self Drive' }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Search', props: { defaultTab: 'selfdrive', showTabs: false }, style: {} },
          { id: 'vehicles-1', type: 'dynamicVehicles', visible: true, locked: false, label: 'Fleet', props: { heading: 'Our Premium Fleet', subheading: 'Choose from our extensive range of top-condition vehicles', limit: 12, layout: 'grid' }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'Why Choose Our Fleet?', columns: 3 }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Reviews', props: { heading: 'Customer Experiences' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Hit the Road Today', subheading: 'Book your vehicle and start your adventure.', primaryBtnText: 'Book Now', secondaryBtnText: 'View All Vehicles' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'holiday-packages',
    name: 'Holiday Packages',
    description: 'Package-focused with curated itineraries, FAQs, and enquiry form',
    thumbnail: '🧳',
    color: '#7c3aed',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Holiday Packages', description: 'Discover curated holiday packages for every budget.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Unforgettable Holiday Packages', subheading: 'Handcrafted travel experiences for families, couples, and solo explorers.', buttonText: 'Explore Packages', buttonAction: 'scroll-to-packages', backgroundType: 'gradient', gradientFrom: '#4c1d95', gradientTo: '#6d28d9', minHeight: 650, showOverlay: false, textAlign: 'center' }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Search', props: { defaultTab: 'packages', showTabs: true }, style: {} },
          { id: 'packages-1', type: 'dynamicPackages', visible: true, locked: false, label: 'Packages', props: { heading: 'Popular Holiday Packages', subheading: 'Curated for every type of traveler', limit: 9 }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'What\'s Included', subheading: 'Every package comes with these guarantees', columns: 3 }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Testimonials', props: { heading: 'Happy Travelers' }, style: {} },
          { id: 'faq-1', type: 'faq', visible: true, locked: false, label: 'FAQ', props: { heading: 'Common Questions', subheading: 'Everything you need to know before booking' }, style: {} },
          { id: 'contact-1', type: 'contactForm', visible: true, locked: false, label: 'Enquiry', props: { heading: 'Enquire About a Package', subheading: 'Fill in your details and we\'ll get back within 2 hours', submitText: 'Send Enquiry' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'adventure-tours',
    name: 'Adventure Tours',
    description: 'Bold design for adventure, trekking, and outdoor tour operators',
    thumbnail: '🏔️',
    color: '#d97706',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Adventure Tours', description: 'Thrilling adventure tours and outdoor experiences.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Your Adventure Starts Here', subheading: 'Epic treks, adrenaline tours, and outdoor adventures curated for the bold explorer.', buttonText: 'Explore Tours', buttonAction: 'scroll', backgroundType: 'gradient', gradientFrom: '#92400e', gradientTo: '#d97706', minHeight: 700, showOverlay: false, textAlign: 'center', badge: '🏔️ Adventure Awaits' }, style: {} },
          { id: 'packages-1', type: 'dynamicPackages', visible: true, locked: false, label: 'Tours', props: { heading: 'Epic Adventure Tours', subheading: 'Choose your next challenge', limit: 6 }, style: {} },
          { id: 'counter-1', type: 'counter', visible: true, locked: false, label: 'Stats', props: { stats: [{ value: '5K+', label: 'Adventurers' }, { value: '100+', label: 'Tours' }, { value: '15+', label: 'Destinations' }, { value: '99%', label: 'Safety Record' }] }, style: {} },
          { id: 'gallery-1', type: 'gallery', visible: true, locked: false, label: 'Gallery', props: { heading: 'Adventure in Pictures' }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Reviews', props: { heading: 'From Our Adventurers' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Ready for Your Next Adventure?', primaryBtnText: 'Book a Tour', secondaryBtnText: 'Talk to a Guide' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'resort',
    name: 'Resort',
    description: 'Immersive resort website with gallery, amenities, and rooms',
    thumbnail: '🌴',
    color: '#0891b2',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Luxury Resort', description: 'Experience paradise at our luxury resort.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Paradise Found', subheading: 'Where every moment is a memory. Luxury rooms, pristine pools, and world-class hospitality.', buttonText: 'Book Your Stay', buttonAction: 'scroll-to-search', backgroundType: 'gradient', gradientFrom: '#0c4a6e', gradientTo: '#0369a1', minHeight: 700, showOverlay: false, textAlign: 'center' }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Booking', props: { defaultTab: 'hotels', showTabs: false }, style: {} },
          { id: 'hotels-1', type: 'dynamicHotels', visible: true, locked: false, label: 'Rooms', props: { heading: 'Our Rooms & Suites', subheading: 'Every room is a sanctuary of comfort', limit: 6 }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Amenities', props: { heading: 'Resort Amenities', subheading: 'Everything you need for the perfect stay', features: [{ icon: '🏊', title: 'Infinity Pool', desc: 'Stunning infinity pool overlooking the ocean.' }, { icon: '🧖', title: 'Luxury Spa', desc: 'Full-service spa with expert therapists.' }, { icon: '🍽️', title: 'Fine Dining', desc: 'Award-winning restaurants and bars.' }, { icon: '🎾', title: 'Sports & Activities', desc: 'Tennis, water sports, and fitness center.' }, { icon: '👨‍💼', title: 'Concierge', desc: '24/7 personal concierge service.' }, { icon: '🚗', title: 'Airport Transfer', desc: 'Complimentary airport transfers.' }] }, style: {} },
          { id: 'gallery-1', type: 'gallery', visible: true, locked: false, label: 'Gallery', props: { heading: 'Experience the Resort' }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Guest Reviews', props: { heading: 'What Our Guests Say' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'visa-services',
    name: 'Visa Services',
    description: 'Visa and travel document services with checklist and enquiry form',
    thumbnail: '🛂',
    color: '#dc2626',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Visa Services', description: 'Fast, hassle-free visa processing services.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Visa Processing Made Easy', subheading: 'Expert visa assistance for 100+ countries. Quick processing, high approval rates.', buttonText: 'Apply Now', backgroundType: 'gradient', gradientFrom: '#7f1d1d', gradientTo: '#dc2626', minHeight: 550, showOverlay: false, textAlign: 'center', badge: '🛂 Trusted Visa Services' }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Services', props: { heading: 'Our Visa Services', subheading: 'We handle everything from documentation to approval', features: [{ icon: '🇺🇸', title: 'US Visa', desc: 'Tourist, business, and student visas.' }, { icon: '🇪🇺', title: 'Schengen Visa', desc: '26 European countries with one visa.' }, { icon: '🇦🇺', title: 'Australia Visa', desc: 'Tourist and work visas for Australia.' }, { icon: '🇨🇦', title: 'Canada Visa', desc: 'PR, tourist, and student visas.' }, { icon: '📋', title: 'Document Check', desc: 'Complete document checklist and review.' }, { icon: '⚡', title: 'Express Processing', desc: 'Fast-track processing for urgent cases.' }] }, style: {} },
          { id: 'counter-1', type: 'counter', visible: true, locked: false, label: 'Stats', props: { stats: [{ value: '100+', label: 'Countries Covered' }, { value: '50K+', label: 'Visas Processed' }, { value: '98%', label: 'Approval Rate' }, { value: '48H', label: 'Processing Time' }] }, style: {} },
          { id: 'faq-1', type: 'faq', visible: true, locked: false, label: 'FAQ', props: { heading: 'Visa FAQ', subheading: 'Answers to your most common visa questions' }, style: {} },
          { id: 'contact-1', type: 'contactForm', visible: true, locked: false, label: 'Enquiry', props: { heading: 'Visa Enquiry Form', subheading: 'Fill in your details and our visa experts will contact you within 2 hours', submitText: 'Send Enquiry' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'corporate-travel',
    name: 'Corporate Travel',
    description: 'Professional B2B travel management for corporate clients',
    thumbnail: '💼',
    color: '#1e3a5f',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Corporate Travel Management', description: 'End-to-end corporate travel management solutions.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Corporate Travel, Simplified', subheading: 'End-to-end travel management for modern businesses. Hotels, flights, vehicles — all managed centrally.', buttonText: 'Get a Quote', backgroundType: 'gradient', gradientFrom: '#1e3a5f', gradientTo: '#0D1B2E', minHeight: 600, showOverlay: false, textAlign: 'center', badge: '💼 Corporate Travel Solutions' }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Services', props: { heading: 'Our Corporate Services', subheading: 'Comprehensive travel solutions for businesses of all sizes', features: [{ icon: '🏨', title: 'Hotel Management', desc: 'Negotiated rates at 500+ business hotels.' }, { icon: '✈️', title: 'Flight Booking', desc: 'Corporate fares with flexible change policies.' }, { icon: '🚗', title: 'Ground Transport', desc: 'Chauffeur services and vehicle rentals.' }, { icon: '📊', title: 'Expense Reports', desc: 'Automated travel expense tracking.' }, { icon: '🛡️', title: 'Travel Insurance', desc: 'Comprehensive business travel coverage.' }, { icon: '📞', title: 'Dedicated Manager', desc: '24/7 dedicated corporate travel manager.' }] }, style: {} },
          { id: 'counter-1', type: 'counter', visible: true, locked: false, label: 'Stats', props: { stats: [{ value: '500+', label: 'Corporate Clients' }, { value: '₹50Cr+', label: 'Travel Managed' }, { value: '30%', label: 'Cost Savings' }, { value: '24/7', label: 'Support' }] }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Testimonials', props: { heading: 'Trusted by Leading Companies' }, style: {} },
          { id: 'contact-1', type: 'contactForm', visible: true, locked: false, label: 'Corporate Enquiry', props: { heading: 'Corporate Travel Enquiry', subheading: 'Tell us about your travel needs and we\'ll create a custom plan', submitText: 'Request Corporate Demo' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'airport-transfer',
    name: 'Airport Transfer',
    description: 'Transfer service with location search, vehicle types, and booking',
    thumbnail: '🚖',
    color: '#0f172a',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Airport Transfer Service', description: 'Reliable and comfortable airport transfer services.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Airport Transfers, On Time Every Time', subheading: 'Comfortable, reliable, and affordable airport pickup and drop service. Book in minutes.', buttonText: 'Book Transfer', backgroundType: 'gradient', gradientFrom: '#0f172a', gradientTo: '#1e293b', minHeight: 600, showOverlay: false, textAlign: 'center', badge: '🚖 Airport Transfer' }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Search', props: { defaultTab: 'selfdrive', showTabs: false }, style: {} },
          { id: 'vehicles-1', type: 'dynamicVehicles', visible: true, locked: false, label: 'Vehicles', props: { heading: 'Transfer Vehicles', subheading: 'Choose the right vehicle for your group', limit: 6 }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'Why Choose Us?', features: [{ icon: '⏰', title: 'Always On Time', desc: 'We track your flight and adjust pickup time automatically.' }, { icon: '✅', title: 'Verified Drivers', desc: 'All drivers background-checked and professionally trained.' }, { icon: '📱', title: 'Live Tracking', desc: 'Track your driver in real-time on your phone.' }, { icon: '💳', title: 'Easy Payment', desc: 'Pay online or cash — your choice.' }, { icon: '🧳', title: 'Meet & Greet', desc: 'Driver meets you at arrivals with a name board.' }, { icon: '📞', title: '24/7 Support', desc: 'Customer support available round the clock.' }] }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Never Miss a Flight Again', subheading: 'Book your airport transfer today and travel with confidence.', primaryBtnText: 'Book Now', secondaryBtnText: 'Contact Us' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'dmc',
    name: 'DMC (Destination Management)',
    description: 'Destination management company with destinations, team, and enquiry',
    thumbnail: '🌍',
    color: '#065f46',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'DMC Travel Services', description: 'Destination management company for inbound and outbound tourism.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Your Local Travel Expert', subheading: 'Full-service destination management for MICE, leisure, and corporate groups across India and beyond.', buttonText: 'Get in Touch', backgroundType: 'gradient', gradientFrom: '#064e3b', gradientTo: '#065f46', minHeight: 650, showOverlay: false, textAlign: 'center', badge: '🌍 Destination Management' }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Services', props: { heading: 'DMC Services', subheading: 'End-to-end destination management for groups and events', features: [{ icon: '🎪', title: 'MICE Events', desc: 'Corporate meetings, incentives, conferences, and exhibitions.' }, { icon: '🧳', title: 'Leisure Groups', desc: 'FIT and GIT packages for leisure travelers.' }, { icon: '🚌', title: 'Ground Transport', desc: 'Bus fleets, coaches, and luxury vehicles.' }, { icon: '🏨', title: 'Hotel Contracting', desc: 'Negotiated rates with top properties.' }, { icon: '🎭', title: 'Entertainment', desc: 'Curated local experiences and cultural shows.' }, { icon: '📋', title: 'Visa Assistance', desc: 'Visa and travel document support.' }] }, style: {} },
          { id: 'packages-1', type: 'dynamicPackages', visible: true, locked: false, label: 'Destinations', props: { heading: 'Popular Destinations', subheading: 'We operate across India\'s most sought-after destinations', limit: 6 }, style: {} },
          { id: 'team-1', type: 'team', visible: true, locked: false, label: 'Team', props: { heading: 'Our Expert Team', subheading: 'Experienced destination specialists at your service' }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Reviews', props: { heading: 'Client Testimonials' }, style: {} },
          { id: 'contact-1', type: 'contactForm', visible: true, locked: false, label: 'Group Enquiry', props: { heading: 'Group & DMC Enquiry', subheading: 'Tell us about your group and requirements', submitText: 'Send Enquiry' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'cruise',
    name: 'Cruise Packages',
    description: 'Cruise booking platform with routes, ships, and packages',
    thumbnail: '🚢',
    color: '#0369a1',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Cruise Packages', description: 'Book the best cruise packages and sea voyages.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Set Sail on Your Dream Cruise', subheading: 'Discover breathtaking ocean voyages, luxurious ships, and exotic destinations worldwide.', buttonText: 'Explore Cruises', backgroundType: 'gradient', gradientFrom: '#0c4a6e', gradientTo: '#0369a1', minHeight: 700, showOverlay: false, textAlign: 'center', badge: '🚢 Luxury Cruises' }, style: {} },
          { id: 'packages-1', type: 'dynamicPackages', visible: true, locked: false, label: 'Cruises', props: { heading: 'Popular Cruise Packages', subheading: 'Set sail on these amazing voyages', limit: 6 }, style: {} },
          { id: 'counter-1', type: 'counter', visible: true, locked: false, label: 'Stats', props: { stats: [{ value: '50+', label: 'Cruise Routes' }, { value: '25K+', label: 'Happy Passengers' }, { value: '15+', label: 'Ships' }, { value: '30+', label: 'Destinations' }] }, style: {} },
          { id: 'gallery-1', type: 'gallery', visible: true, locked: false, label: 'Gallery', props: { heading: 'Life Onboard' }, style: {} },
          { id: 'faq-1', type: 'faq', visible: true, locked: false, label: 'FAQ', props: { heading: 'Cruise FAQs' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Your Ocean Adventure Awaits', primaryBtnText: 'Book a Cruise', secondaryBtnText: 'View All Routes' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'bike-rental',
    name: 'Bike Rental',
    description: 'Two-wheeler rental platform with bikes, routes, and daily rates',
    thumbnail: '🏍️',
    color: '#dc2626',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Bike Rental', description: 'Premium bike rental for exploring at your own pace.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Ride Free, Ride Your Way', subheading: 'Premium bikes at daily, weekly, and monthly rates. Explore every corner at your own pace.', buttonText: 'Book a Bike', backgroundType: 'gradient', gradientFrom: '#7f1d1d', gradientTo: '#dc2626', minHeight: 600, showOverlay: false, textAlign: 'center', badge: '🏍️ Premium Bike Rental' }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'Search', props: { defaultTab: 'selfdrive', showTabs: false }, style: {} },
          { id: 'vehicles-1', type: 'dynamicVehicles', visible: true, locked: false, label: 'Bikes', props: { heading: 'Our Bike Fleet', subheading: 'From scooters to sports bikes — we have it all', limit: 12 }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'Why Rent From Us?', columns: 3 }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Reviews', props: { heading: 'Rider Reviews' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Ready to Ride?', primaryBtnText: 'Book a Bike', secondaryBtnText: 'Call Us' }, style: {} }
        ]
      }
    }
  },
  {
    id: 'marketplace',
    name: 'Multi-Service Travel Marketplace',
    description: 'All-in-one marketplace: hotels, vehicles, packages, flights, and more',
    thumbnail: '🌐',
    color: '#FF6333',
    pages: {
      home: {
        id: 'home', title: 'Home', slug: '/', status: 'published', isHome: true,
        seo: { title: 'Travel Marketplace', description: 'Your one-stop travel marketplace for hotels, vehicles, packages, and flights.', slug: '/', robots: 'index,follow', sitemap: true },
        sections: [
          { id: 'hero-1', type: 'hero', visible: true, locked: false, label: 'Hero', props: { heading: 'Your Complete Travel Marketplace', subheading: 'Book hotels, rent vehicles, discover packages, and search flights — all in one place.', buttonText: 'Start Exploring', backgroundType: 'gradient', gradientFrom: '#0D1B2E', gradientTo: '#1a3a5c', minHeight: 700, showOverlay: false, textAlign: 'center', badge: '🌐 All-in-One Travel Platform', showStats: true, stats: [{ value: '500+', label: 'Hotels' }, { value: '200+', label: 'Vehicles' }, { value: '150+', label: 'Packages' }, { value: '10K+', label: 'Customers' }] }, style: {} },
          { id: 'search-1', type: 'bookingWidget', visible: true, locked: false, label: 'All Search', props: { defaultTab: 'hotels', showTabs: true }, style: {} },
          { id: 'hotels-1', type: 'dynamicHotels', visible: true, locked: false, label: 'Hotels', props: { heading: 'Featured Hotels', subheading: 'Top rated stays', limit: 6 }, style: {} },
          { id: 'vehicles-1', type: 'dynamicVehicles', visible: true, locked: false, label: 'Vehicles', props: { heading: 'Self Drive Vehicles', subheading: 'Premium fleet for hire', limit: 8, sectionBg: '#f8fafc' }, style: {} },
          { id: 'packages-1', type: 'dynamicPackages', visible: true, locked: false, label: 'Packages', props: { heading: 'Travel Packages', subheading: 'Curated experiences', limit: 6 }, style: {} },
          { id: 'features-1', type: 'features', visible: true, locked: false, label: 'Features', props: { heading: 'Why TripGalileo?', columns: 3, sectionBg: '#f8fafc' }, style: {} },
          { id: 'testimonials-1', type: 'testimonials', visible: true, locked: false, label: 'Reviews', props: { heading: 'Loved by Travelers' }, style: {} },
          { id: 'cta-1', type: 'cta', visible: true, locked: false, label: 'CTA', props: { heading: 'Plan Your Perfect Trip Today', primaryBtnText: 'Book Now', secondaryBtnText: 'Contact Us' }, style: {} }
        ]
      }
    }
  }
];
