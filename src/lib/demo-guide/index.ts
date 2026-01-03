/**
 * Demo Guide System
 *
 * A non-intrusive explore mode for learning about app features.
 *
 * Usage:
 * 1. Add <ExploreToggle /> to your header
 * 2. Add <DemoPopup /> to your layout (renders the popup globally)
 * 3. Wrap components with <DemoCard demoId="..."> to make them explorable
 * 4. Add content entries in src/lib/demo-guide/content/index.ts
 *
 * @example
 * ```tsx
 * // In your layout
 * import { DemoPopup } from '@/lib/demo-guide';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <DemoPopup />
 *     </>
 *   );
 * }
 *
 * // In your header
 * import { ExploreToggle } from '@/lib/demo-guide';
 *
 * export function Header() {
 *   return (
 *     <header>
 *       <ExploreToggle />
 *     </header>
 *   );
 * }
 *
 * // Wrapping a component
 * import { DemoCard } from '@/lib/demo-guide';
 *
 * export function Dashboard() {
 *   return (
 *     <DemoCard demoId="dashboard-portfolio-health">
 *       <PortfolioHealthCard />
 *     </DemoCard>
 *   );
 * }
 * ```
 */

// Components
export { DemoCard, DemoPopup, ExploreToggle, ExplorePanel } from './components';

// Store
export { useDemoGuideStore } from './store';

// Content
export {
  demoContentMap,
  getDemoContent,
  getDemoContentByCategory,
  getDemoContentCount,
  moduleContent,
  getModuleContent,
  getAllModuleIds,
  getSectionCount,
} from './content';

// Types
export type {
  DemoContent,
  DemoSection,
  ModuleContent,
  DemoGuideState,
  DemoGuideActions,
  DemoGuideStore,
} from './types';
