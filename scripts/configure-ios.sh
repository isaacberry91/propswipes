#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

echo "Configuring iOS project for manual signing..."

# Create a backup and work on a copy
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

echo "Configuring iOS project with development team: $DEVELOPMENT_TEAM"

# Create a simple Python script to safely modify the project file
cat > modify_project.py << 'EOF'
import sys
import re

with open('App.xcodeproj/project.pbxproj', 'r') as f:
    content = f.read()

# Development team ID from environment
team_id = sys.argv[1] if len(sys.argv) > 1 else ""

# Replace signing settings more carefully
content = re.sub(r'CODE_SIGN_STYLE = Automatic;', 'CODE_SIGN_STYLE = Manual;', content)
content = re.sub(r'DEVELOPMENT_TEAM = "[^"]*";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'DEVELOPMENT_TEAM = "";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'CODE_SIGN_IDENTITY = "[^"]*";', 'CODE_SIGN_IDENTITY = "Apple Distribution";', content)
content = re.sub(r'"CODE_SIGN_IDENTITY\[sdk=iphoneos\*\]" = "[^"]*";', '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";', content)
content = re.sub(r'PROVISIONING_PROFILE_SPECIFIER = "[^"]*";', 'PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";', content)

# Also replace any iOS Distribution or iPhone Distribution references
content = re.sub(r'iOS Distribution', 'Apple Distribution', content)
content = re.sub(r'iPhone Distribution', 'Apple Distribution', content)

with open('App.xcodeproj/project.pbxproj', 'w') as f:
    f.write(content)
EOF

# Run the Python script with the development team
python3 modify_project.py "$DEVELOPMENT_TEAM"

# Clean up
rm modify_project.py

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"