// Content script for SwipesChats Safari Extension

// This script runs on all web pages
console.log('SwipesChats extension loaded');

// You can add functionality here to interact with web pages
// For example, detect if the user is on a dating site and show a notification

// Example: Detect if user is on a specific domain
if (window.location.hostname.includes('tinder.com') || 
    window.location.hostname.includes('bumble.com') || 
    window.location.hostname.includes('hinge.co')) {
    
    // Could show a subtle notification about SwipesChats
    console.log('Dating site detected - SwipesChats available');
}