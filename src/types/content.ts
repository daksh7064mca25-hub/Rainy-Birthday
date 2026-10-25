export interface MemoryItem {
  id: string;
  title: string;
  mediaType?: 'photo' | 'video';
  imageUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  date?: string;
  location?: string;
  caption: string;
  fullStory?: string;
  collection?: string;
  displaySize?: 'small' | 'medium' | 'large' | 'full';
  featured?: boolean;
  aspect?: 'portrait' | 'landscape' | 'square' | 'tall' | 'wide';
  rotation?: number;
  starPosition?: number;
  order?: number;
  videoDuration?: string;
  published?: boolean;
  showInStorySection?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoveReason {
  id: string;
  number: string;
  title: string;
  description: string;
}

export interface FutureMilestone {
  id: string;
  title: string;
  year: string;
  description: string;
  icon: string;
  status: string;
}

export interface SiteContent {
  general: {
    recipientName: string;
    recipientNickname: string;
    partnerName: string;
    occasion: string;
    dateString: string;
    musicTitle: string;
    adminPasswordHash: string;
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    burgundyColor: string;
    animationIntensity: 'subtle' | 'cinematic' | 'energetic';
  };
  sectionsVisibility: {
    surprise: boolean;
    universe: boolean;
    museum: boolean;
    letters: boolean;
    reasons: boolean;
    future: boolean;
    finalReveal: boolean;
  };
  chapter1: {
    badge: string;
    headline: string;
    subtitle: string;
    ctaText: string;
    envelopeLabel: string;
  };
  chapter2: {
    title: string;
    heading?: string;
    subtitle: string;
    finalQuote?: string;
    collections?: string[];
    instructionText?: string;
  };
  chapter3: {
    title: string;
    subtitle: string;
    memories: MemoryItem[];
  };
  chapter4: {
    title: string;
    subtitle: string;
    letter: {
      salutation: string;
      paragraphs: string[];
      closing: string;
      signature: string;
    };
    voiceNote: {
      title: string;
      duration: string;
      date: string;
      audioUrl: string;
      caption: string;
    };
  };
  chapter5: {
    title: string;
    subtitle: string;
    reasons: LoveReason[];
  };
  chapter6: {
    title: string;
    subtitle: string;
    startDate?: string;
    bottomNote?: string;
    milestones?: FutureMilestone[];
  };
  chapter7: {
    title: string;
    subtitle: string;
    montageQuote: string;
    finalMessage: string;
    celebrationTag: string;
  };
}
