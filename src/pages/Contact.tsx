import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="container max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about PropSwipes? We're here to help you find your perfect property match.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Get in touch</CardTitle>
              <CardDescription>
                Here are the different ways you can reach us.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Phone</h3>
                  <p className="text-muted-foreground">+1(888) 249-1599</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Monday - Friday, 9 AM - 6 PM EST
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-muted-foreground">support@propswipes.com</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Address</h3>
                  <p className="text-muted-foreground">
                    5 Willow Road<br />
                    Woodmere, NY 11598<br />
                    United States
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">How does PropSwipes work?</h4>
                <p className="text-sm text-muted-foreground">
                  PropSwipes works like a dating app but for properties. Swipe right on properties you love, left on ones you don't, and match with your perfect home.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Is PropSwipes free to use?</h4>
                <p className="text-sm text-muted-foreground">
                  We offer both free and premium subscription tiers. Free users can browse properties with some limitations, while premium users get unlimited swipes and enhanced features.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">How do I list my property?</h4>
                <p className="text-sm text-muted-foreground">
                  Simply create an account and navigate to the "List Property" section. Upload photos, add details, and your property will be available for users to discover.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;