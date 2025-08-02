#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

# Update App target to use manual signing with specific settings
echo "Configuring iOS project for manual signing..."

# Create a temporary pbxproj with manual signing configuration
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

# Configure manual signing for App target only
perl -i -pe 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g if /App.*Release/ .. /^[[:space:]]*};/' App.xcodeproj/project.pbxproj
perl -i -pe 's/ProvisioningStyle = Automatic;/ProvisioningStyle = Manual;/g if /App.*Release/ .. /^[[:space:]]*};/' App.xcodeproj/project.pbxproj

# Add provisioning profile settings for App target
perl -i -pe 's/(DEVELOPMENT_TEAM = [^;]*;)/$1\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store";/g if /App.*Release/ .. /^[[:space:]]*};/' App.xcodeproj/project.pbxproj
perl -i -pe 's/(DEVELOPMENT_TEAM = [^;]*;)/$1\n\t\t\t\t"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Distribution";/g if /App.*Release/ .. /^[[:space:]]*};/' App.xcodeproj/project.pbxproj

echo "iOS project configured for manual signing"