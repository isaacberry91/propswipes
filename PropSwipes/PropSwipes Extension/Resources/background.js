// Background script for PropSwipes Safari Extension

// Listen for extension installation
browser.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        console.log('PropSwipes extension installed');
    }
});

// Handle messages from content scripts
browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'openApp') {
        browser.tabs.create({
            url: 'https://propswipes.lovable.app' // Your PropSwipes app URL
        });
    }
    
    return true;
});