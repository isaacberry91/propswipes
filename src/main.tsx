import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { notificationService } from "./services/notificationService"

// Initialize notification service
notificationService.initialize();

createRoot(document.getElementById("root")!).render(<App />);
