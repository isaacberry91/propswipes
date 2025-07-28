document.addEventListener('DOMContentLoaded', function() {
    const openAppButton = document.getElementById('openApp');
    
    openAppButton.addEventListener('click', function() {
        // Open the SwipesChats web app
        browser.tabs.create({
            url: 'https://your-app-url.com' // Replace with your actual app URL
        });
        
        // Close the popup
        window.close();
    });
});