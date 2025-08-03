import UIKit
import SafariServices
import WebKit

class ViewController: UIViewController {

    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.title = "PropSwipes Extension"
        
        // Create webView programmatically
        webView = WKWebView(frame: view.bounds)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)
        
        // Load PropSwipes web app
        if let url = URL(string: "https://propswipes.lovable.app") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    @IBAction func openSafariExtensionPreferences(_ sender: AnyObject?) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "app.propswipes.safari.extension.Extension") { error in
            if let _ = error {
                // Insert code to inform the user that something went wrong.
            }
        }
    }
}