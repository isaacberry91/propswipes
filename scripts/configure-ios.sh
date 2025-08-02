#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

echo "Configuring iOS project for manual signing..."

# Create a temporary pbxproj with manual signing configuration
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

# Configure manual signing for App target only and add required settings
sed -i '' '/CODE_SIGN_STYLE = Automatic;/c\
				CODE_SIGN_STYLE = Manual;\
				DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";\
				PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store";\
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Distribution";
' App.xcodeproj/project.pbxproj

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"