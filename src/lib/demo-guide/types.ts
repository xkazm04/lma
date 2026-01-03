/**
 * Demo Guide System Types
 *
 * This module provides type definitions for the explore mode demo guidance system.
 */

export interface DemoSection {
  /** Unique identifier for the section */
  id: string;
  /** Display title for the section */
  title: string;
  /** Short description shown in section list */
  shortDescription: string;
  /** Full description shown when section is selected */
  description: string;
  /** Optional path to audio file for narration */
  audioSrc?: string;
  /** Icon name from lucide-react */
  icon?: string;
}

export interface ModuleContent {
  /** Module identifier matching the route (e.g., 'dashboard', 'documents') */
  moduleId: string;
  /** Display name for the module */
  moduleName: string;
  /** Module introduction text */
  introduction: string;
  /** Key features or highlights (bullet points) */
  highlights?: string[];
  /** Explorable sections within this module */
  sections: DemoSection[];
}

// Legacy DemoContent type for backward compatibility
export interface DemoContent {
  /** Unique identifier for the demo content */
  id: string;
  /** Title displayed in the popup */
  title: string;
  /** Description text explaining the feature and its benefits */
  description: string;
  /** Optional path to audio file for narration */
  audioSrc?: string;
  /** Optional category for grouping in analytics */
  category?: string;
}

export interface DemoGuideState {
  /** Whether explore mode is currently active */
  isExploreMode: boolean;
  /** Currently active module content */
  activeModule: ModuleContent | null;
  /** Currently selected section within the module */
  activeSection: DemoSection | null;
  /** Currently active demo content (shown in popup) - legacy */
  activeDemo: DemoContent | null;
  /** Set of demo IDs the user has viewed */
  viewedDemos: Set<string>;
}

export interface DemoGuideActions {
  /** Toggle explore mode on/off */
  toggleExploreMode: () => void;
  /** Enable explore mode */
  enableExploreMode: () => void;
  /** Disable explore mode */
  disableExploreMode: () => void;
  /** Set the active module */
  setActiveModule: (module: ModuleContent | null) => void;
  /** Set the active section */
  setActiveSection: (section: DemoSection | null) => void;
  /** Show a specific demo in the popup (legacy) */
  showDemo: (demo: DemoContent) => void;
  /** Hide the current demo popup */
  hideDemo: () => void;
  /** Mark a demo as viewed */
  markAsViewed: (demoId: string) => void;
  /** Check if a demo has been viewed */
  hasViewed: (demoId: string) => boolean;
}

export type DemoGuideStore = DemoGuideState & DemoGuideActions;
