#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

echo "Configuring iOS project for manual signing..."

# Create a temporary pbxproj with manual signing configuration
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

# Configure manual signing for App target only and add required settings
echo "Before modification:"
grep -n "CODE_SIGN_IDENTITY\|DEVELOPMENT_TEAM\|CODE_SIGN_STYLE" App.xcodeproj/project.pbxproj | head -10

# Replace ALL occurrences of iOS Distribution with Apple Distribution
sed -i '' 's/iOS Distribution/Apple Distribution/g' App.xcodeproj/project.pbxproj
sed -i '' 's/iPhone Distribution/Apple Distribution/g' App.xcodeproj/project.pbxproj

# Set code signing style to manual everywhere
sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g' App.xcodeproj/project.pbxproj

# Set development team everywhere
sed -i '' 's/DEVELOPMENT_TEAM = "";/DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";/g' App.xcodeproj/project.pbxproj
sed -i '' 's/DEVELOPMENT_TEAM = ".*";/DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";/g' App.xcodeproj/project.pbxproj
sed -i '' 's/DEVELOPMENT_TEAM = .*;/DEVELOPMENT_TEAM = "'"$DEVELOPMENT_TEAM"'";/g' App.xcodeproj/project.pbxproj

# Set code sign identity everywhere
sed -i '' 's/CODE_SIGN_IDENTITY = ".*";/CODE_SIGN_IDENTITY = "Apple Distribution";/g' App.xcodeproj/project.pbxproj
sed -i '' 's/"CODE_SIGN_IDENTITY\[sdk=iphoneos\*\]" = ".*";/"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";/g' App.xcodeproj/project.pbxproj

# Set provisioning profile everywhere
sed -i '' 's/PROVISIONING_PROFILE_SPECIFIER = ".*";/PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";/g' App.xcodeproj/project.pbxproj

# Add provisioning profile to configurations that don't have it
sed -i '' '/CODE_SIGN_STYLE = Manual;/a\
				PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";
' App.xcodeproj/project.pbxproj

# Remove any duplicate PROVISIONING_PROFILE_SPECIFIER lines that might have been created
awk '!seen[$0]++' App.xcodeproj/project.pbxproj > App.xcodeproj/project.pbxproj.tmp && mv App.xcodeproj/project.pbxproj.tmp App.xcodeproj/project.pbxproj

echo "After modification:"
grep -n "CODE_SIGN_IDENTITY\|DEVELOPMENT_TEAM\|CODE_SIGN_STYLE" App.xcodeproj/project.pbxproj | head -10

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"