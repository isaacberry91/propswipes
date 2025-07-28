document.addEventListener('DOMContentLoaded', function() {
    const openAppButton = document.getElementById('openApp');
    
    openAppButton.addEventListener('click', function() {
        // Open the PropSwipes web app
        browser.tabs.create({
            url: 'https://propswipes.lovable.app' // Your PropSwipes app URL
        });
        
        // Close the popup
        window.close();
    });
});