#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

echo "Configuring iOS project for manual signing..."

# Create a temporary pbxproj with manual signing configuration
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

# Configure manual signing for App target only and add required settings
# Find and replace ALL instances of CODE_SIGN_IDENTITY
sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g' App.xcodeproj/project.pbxproj

# Set development team more aggressively - find ALL DEVELOPMENT_TEAM lines and replace them
sed -i '' 's/DEVELOPMENT_TEAM = "";/DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";/g' App.xcodeproj/project.pbxproj
sed -i '' 's/DEVELOPMENT_TEAM = ".*";/DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";/g' App.xcodeproj/project.pbxproj
sed -i '' 's/DEVELOPMENT_TEAM = .*;/DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";/g' App.xcodeproj/project.pbxproj

# Add provisioning profile and code sign identity to ALL configurations
sed -i '' '/CODE_SIGN_STYLE = Manual;/a\
				PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";\
				"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";\
				CODE_SIGN_IDENTITY = "Apple Distribution";\
				DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";
' App.xcodeproj/project.pbxproj

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"