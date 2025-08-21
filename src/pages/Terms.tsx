import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Terms of Use</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground mb-8">
            <strong>Effective Date:</strong> January 21, 2025<br />
            <strong>Last Updated:</strong> January 21, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to PropSwipes ("we," "our," or "us"). These Terms of Use ("Terms") govern your use of the PropSwipes mobile application and website (collectively, the "Service"), which connects property buyers and sellers through a swipe-based matching system.
            </p>
            <p className="mb-4">
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Eligibility</h2>
            <p className="mb-4">
              You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You are at least 18 years of age</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You will comply with all applicable laws and regulations</li>
              <li>All information you provide is accurate and truthful</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Account Registration</h2>
            <p className="mb-4">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. User Conduct</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Post false, misleading, or fraudulent property listings</li>
              <li>Upload inappropriate, offensive, or copyrighted images</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Send spam or unsolicited messages</li>
              <li>Share personal contact information in violation of our guidelines</li>
              <li>Upload malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Create fake accounts or impersonate others</li>
              <li>Scrape or collect user data without permission</li>
              <li>Use automated tools or bots to interact with the Service</li>
              <li>Circumvent any security features or access controls</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Property Listings</h2>
            <p className="mb-4">
              When creating property listings, you represent that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You have the legal right to list the property</li>
              <li>All information provided is accurate and current</li>
              <li>Photos and descriptions accurately represent the property</li>
              <li>You will honor any agreements made through the Service</li>
            </ul>
            <p className="mb-4">
              We reserve the right to remove any listing that violates these Terms or is deemed inappropriate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Matching and Communication</h2>
            <p className="mb-4">
              Our Service facilitates connections between buyers and sellers. We do not:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Guarantee any matches or transactions</li>
              <li>Verify the identity or qualifications of users</li>
              <li>Act as a real estate agent or broker</li>
              <li>Participate in negotiations or transactions</li>
            </ul>
            <p className="mb-4">
              All communications and transactions are between users. We recommend conducting proper due diligence before any property transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Subscription and Payments</h2>
            <p className="mb-4">
              Premium features require a subscription through the App Store or Google Play. Payment terms include:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
              <li>Fees are charged to your App Store or Google Play account</li>
              <li>Fees are non-refundable except as required by law or App Store/Google Play policies</li>
              <li>We may change subscription fees with 30 days notice</li>
              <li>You may cancel anytime through your App Store or Google Play account settings</li>
              <li>Subscription tiers include Buyer Pro, Seller Basic, Seller Professional, and Seller Enterprise</li>
              <li>Each tier provides different features and limits as described in the app</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Location Services</h2>
            <p className="mb-4">
              Our Service uses location data to provide relevant property matches and search results. By using location features, you consent to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Collection of your device's location information</li>
              <li>Use of location data to show nearby properties</li>
              <li>Storage of location preferences in your profile</li>
              <li>Sharing of general location area (city/region) with potential matches</li>
            </ul>
            <p className="mb-4">
              You can disable location services in your device settings, but this may limit app functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Content and Media</h2>
            <p className="mb-4">
              When uploading photos, videos, or other content, you represent that:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You own or have permission to use all uploaded content</li>
              <li>Content does not infringe on any third-party rights</li>
              <li>Photos accurately represent the property or profile</li>
              <li>Content is not obscene, offensive, or inappropriate</li>
              <li>You will not upload copyrighted material without permission</li>
            </ul>
            <p className="mb-4">
              We reserve the right to remove any content that violates these Terms or is deemed inappropriate.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Push Notifications</h2>
            <p className="mb-4">
              We may send push notifications for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>New matches and messages</li>
              <li>Property updates and alerts</li>
              <li>Subscription and payment reminders</li>
              <li>Important Service announcements</li>
            </ul>
            <p className="mb-4">
              You can disable notifications in your device settings or app preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Privacy</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which governs how we collect, use, and protect your information. By using the Service, you consent to our data practices as described in the Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Intellectual Property</h2>
            <p className="mb-4">
              The Service, including its design, features, and underlying technology, is owned by PropSwipes and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our written permission.
            </p>
            <p className="mb-4">
              You retain ownership of content you upload but grant us a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute it as necessary to provide the Service, including in marketing materials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Disclaimers</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4">
              We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION.
            </p>
            <p className="mb-4">
              Our total liability for any claims shall not exceed the amount you paid for the Service in the 12 months preceding the claim, or $100, whichever is greater.
            </p>
            <p className="mb-4">
              We are not responsible for the actions, content, or accuracy of information provided by other users, including property listings, photos, or communications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">16. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account immediately, without prior notice, for any reason, including violation of these Terms. You may also delete your account at any time through the app settings.
            </p>
            <p className="mb-4">
              Upon termination, your right to use the Service ceases immediately, and we may delete your account data in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">17. Governing Law and Jurisdiction</h2>
            <p className="mb-4">
              These Terms are governed by and construed in accordance with the laws of the State of New York, without regard to conflict of law principles. Any legal action arising from these Terms shall be brought in the courts of Nassau County, New York.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">18. Dispute Resolution</h2>
            <p className="mb-4">
              Before initiating any legal proceedings, you agree to first attempt to resolve disputes through good faith negotiations by contacting us at support@propswipes.com.
            </p>
            <p className="mb-4">
              If direct negotiations fail, any disputes shall be resolved through binding arbitration in Nassau County, New York, in accordance with the rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">19. Changes to Terms</h2>
            <p className="mb-4">
              We may update these Terms from time to time. We will notify users of material changes by posting the new Terms on the Service and updating the "Last Updated" date.
            </p>
            <p className="mb-4">
              Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">20. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p><strong>PropSwipes</strong></p>
              <p>Email: support@propswipes.com</p>
              <p>Address: 5 Willow Road, Woodmere, NY 11598</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;