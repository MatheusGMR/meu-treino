import { LayoutGrid, TrendingUp, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface BottomNavigationProps {
  activeTab?: 'plano' | 'progresso' | 'mais';
}

export const BottomNavigation = ({ activeTab }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): 'plano' | 'progresso' | 'mais' => {
    if (activeTab) return activeTab;
    
    if (location.pathname.includes('/progress')) return 'progresso';
    if (location.pathname.includes('/profile')) return 'mais';
    return 'plano';
  };

  const currentTab = getActiveTab();

  const tabs = [
    { id: 'plano' as const, label: 'Plano', icon: LayoutGrid, path: '/client/dashboard' },
    { id: 'progresso' as const, label: 'Progresso', icon: TrendingUp, path: '/client/progress' },
    { id: 'mais' as const, label: 'Mais', icon: Menu, path: '/client/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around py-3 pb-safe z-50 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center gap-1 px-6 py-2 transition-all duration-300"
          >
            <Icon 
              className={`w-6 h-6 transition-colors ${
                isActive ? 'text-primary stroke-[2.5]' : 'text-muted-foreground'
              }`}
              fill={isActive ? 'currentColor' : 'none'}
            />
            <span 
              className={`text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
