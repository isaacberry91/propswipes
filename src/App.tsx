import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { useEffect } from "react";
import { iapService } from "./services/iapService";
import { notificationService } from "./services/notificationService";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import ListProperty from "./pages/ListProperty";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import ChatManagement from "./pages/ChatManagement";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import TestSubscription from "./pages/TestSubscription";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import PropertyDetails from "./pages/PropertyDetails";
import Privacy from "./pages/Privacy";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  // Initialize IAP service on app startup with improved error handling
  useEffect(() => {
    let isCancelled = false;
    
    const initializeIAP = async () => {
      try {
        console.log('PropSwipes Main App: Starting IAP initialization...');
        
        // Wait a bit for app to fully load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isCancelled) return;
        
        const success = await iapService.initialize();
        
        if (!isCancelled) {
          if (success) {
            console.log('PropSwipes Main App: IAP service ready for use');
          } else {
            console.log('PropSwipes Main App: IAP service failed to initialize');
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.log('PropSwipes Main App: IAP initialization error (non-fatal):', error);
        }
      }
    };

    const initializePushNotifications = async () => {
      try {
        console.log('PropSwipes Main App: Starting push notifications initialization...');
        await notificationService.initialize();
        console.log('PropSwipes Main App: Push notifications ready');
      } catch (error) {
        console.log('PropSwipes Main App: Push notifications initialization error (non-fatal):', error);
      }
    };
    
    initializeIAP();
    initializePushNotifications();
    
    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-20">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-dashboard" element={<Admin />} />
              <Route path="/discover" element={
                <ProtectedRoute>
                  <Discover />
                </ProtectedRoute>
              } />
              <Route path="/list" element={
                <ProtectedRoute>
                  <ListProperty />
                </ProtectedRoute>
              } />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              } />
              <Route path="/chat/:matchId" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/chat-management" element={
                <ProtectedRoute>
                  <ChatManagement />
                </ProtectedRoute>
              } />
              <Route path="/chat-management/:matchId" element={
                <ProtectedRoute>
                  <ChatManagement />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
               <Route path="/subscription" element={
                 <ProtectedRoute>
                   <Subscription />
                 </ProtectedRoute>
               } />
               <Route path="/test-subscription" element={
                 <ProtectedRoute>
                   <TestSubscription />
                 </ProtectedRoute>
                } />
                 <Route path="/privacy" element={<Privacy />} />
                <Route path="/property/:propertyId" element={<PropertyDetails />} />
               <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Navigation />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
