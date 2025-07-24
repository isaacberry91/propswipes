import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Heart, Plus, MessageCircle } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/discover", icon: Home, label: "Discover" },
    { path: "/matches", icon: Heart, label: "Matches" },
    { path: "/list", icon: Plus, label: "List" },
  ];

  // Don't show navigation on chat pages
  if (location.pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;