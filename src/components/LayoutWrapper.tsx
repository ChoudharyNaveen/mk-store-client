import Layout from './Layout';

interface LayoutWrapperProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

/**
 * LayoutWrapper component
 * Wraps Layout component to be used as a route element
 */
export function LayoutWrapper({ isSidebarOpen, onToggleSidebar }: LayoutWrapperProps) {
  return <Layout isSidebarOpen={isSidebarOpen} onToggleSidebar={onToggleSidebar} />;
}

