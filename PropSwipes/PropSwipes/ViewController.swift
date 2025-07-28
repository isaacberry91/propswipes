import Cocoa
import SafariServices

class ViewController: NSViewController {

    @IBOutlet var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "PropSwipes Extension"
        
        // Load your web app
        if let url = URL(string: "https://propswipes.lovable.app") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "app.lovable.swipes-chats-extension.Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.
            }
        }
    }
}