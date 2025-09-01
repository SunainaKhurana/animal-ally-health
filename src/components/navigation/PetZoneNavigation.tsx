
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Heart, Activity, MessageCircle, MoreHorizontal } from 'lucide-react';

const PetZoneNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'care', label: 'Care', icon: Heart, path: '/care' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
    { id: 'assistant', label: 'AI Assistant', icon: MessageCircle, path: '/assistant' },
    { id: 'more', label: 'More', icon: MoreHorizontal, path: '/more' },
  ];

  const currentTab = tabs.find(tab => tab.path === location.pathname)?.id || 'home';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PetZoneNavigation;
