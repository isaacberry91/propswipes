import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, MessageCircle, Clock, Shield, HelpCircle } from "lucide-react";

const Contact = () => {
  const faqs = [
    {
      question: "How does PropSwipes work?",
      answer: "PropSwipes is a professional property discovery platform designed to help you find real estate efficiently. Browse verified property listings, save your favorites, and connect with licensed real estate professionals."
    },
    {
      question: "Is PropSwipes free to use?",
      answer: "Yes, PropSwipes offers a free tier for basic property browsing. We also provide premium subscriptions with enhanced search capabilities and priority customer support for serious property seekers."
    },
    {
      question: "How do I list my property?",
      answer: "Licensed real estate professionals and verified property owners can list properties through our secure platform. Contact our team to learn about our listing requirements and verification process."
    },
    {
      question: "Is my personal information secure?",
      answer: "Absolutely. We use enterprise-grade security measures including encryption, secure data storage, and strict privacy controls. Your personal information is protected and never shared without your explicit consent."
    },
    {
      question: "How can I contact customer support?",
      answer: "Our professional support team is available via phone, email, and secure messaging. We maintain business hours Monday through Friday and respond to all inquiries promptly."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Professional Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Customer Support
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Professional real estate platform support. Our dedicated team is committed to providing exceptional service for all your property search and listing needs.
          </p>
        </div>

        {/* Contact Methods Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Phone Support</h3>
              <p className="text-lg font-medium text-primary mb-3">+1 (888) 249-1599</p>
              <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                <Clock className="h-4 w-4 mr-2" />
                Business Hours
              </div>
              <p className="text-sm text-muted-foreground">Monday - Friday, 9:00 AM - 6:00 PM EST</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Email Support</h3>
              <p className="text-lg font-medium text-primary mb-3">support@propswipes.com</p>
              <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                <MessageCircle className="h-4 w-4 mr-2" />
                Professional Response
              </div>
              <p className="text-sm text-muted-foreground">Typically within 2-4 business hours</p>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Business Address</h3>
              <div className="text-muted-foreground space-y-1">
                <p>5 Willow Road</p>
                <p>Woodmere, NY 11598</p>
                <p>United States</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional FAQ Section */}
        <Card className="border border-border bg-card">
          <CardHeader className="text-center pb-8">
            <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold mb-4 text-foreground">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              Common questions about our professional real estate platform and services
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-6 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-border rounded-lg p-6 bg-background/50">
                  <h3 className="text-lg font-semibold mb-3 text-foreground flex items-start">
                    <Shield className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed ml-7">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;