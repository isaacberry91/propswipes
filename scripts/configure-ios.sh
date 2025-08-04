#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

echo "Configuring iOS project for manual signing..."

# Create a backup and work on a copy
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

echo "Configuring iOS project with development team: $DEVELOPMENT_TEAM"

# Create a comprehensive Python script to modify the project file
cat > modify_project.py << 'EOF'
import sys
import re

with open('App.xcodeproj/project.pbxproj', 'r') as f:
    content = f.read()

team_id = sys.argv[1] if len(sys.argv) > 1 else ""

print(f"Setting development team to: {team_id}")

# Replace signing settings
content = re.sub(r'CODE_SIGN_STYLE = Automatic;', 'CODE_SIGN_STYLE = Manual;', content)
content = re.sub(r'DEVELOPMENT_TEAM = "[^"]*";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'DEVELOPMENT_TEAM = "";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'CODE_SIGN_IDENTITY = "[^"]*";', 'CODE_SIGN_IDENTITY = "Apple Distribution";', content)
content = re.sub(r'"CODE_SIGN_IDENTITY\[sdk=iphoneos\*\]" = "[^"]*";', '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";', content)

# Replace or add provisioning profile
content = re.sub(r'PROVISIONING_PROFILE_SPECIFIER = "[^"]*";', 'PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";', content)

# Also replace any iOS Distribution references
content = re.sub(r'iOS Distribution', 'Apple Distribution', content)
content = re.sub(r'iPhone Distribution', 'Apple Distribution', content)

# Find build configuration sections and ensure they have provisioning profile
# Look for buildSettings sections that have CODE_SIGN_STYLE = Manual but no PROVISIONING_PROFILE_SPECIFIER
build_settings_pattern = r'(buildSettings = \{[^}]*CODE_SIGN_STYLE = Manual;[^}]*?)(\};)'
def add_provisioning_if_missing(match):
    build_settings = match.group(1)
    end_brace = match.group(2)
    
    if 'PROVISIONING_PROFILE_SPECIFIER' not in build_settings:
        # Add the provisioning profile specifier
        build_settings += '\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";'
    
    return build_settings + end_brace

content = re.sub(build_settings_pattern, add_provisioning_if_missing, content, flags=re.DOTALL)

with open('App.xcodeproj/project.pbxproj', 'w') as f:
    f.write(content)

print("Configuration complete")
EOF

# Run the Python script
python3 modify_project.py "$DEVELOPMENT_TEAM"

# Verify the changes
echo "Verifying configuration..."
grep -A 5 -B 5 "PROVISIONING_PROFILE_SPECIFIER" App.xcodeproj/project.pbxproj | head -20

# Clean up
rm modify_project.py

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"