#!/bin/bash

# Configure iOS project for CI builds
cd ios/App

echo "Configuring iOS project for manual signing..."

# Create a backup and work on a copy
cp App.xcodeproj/project.pbxproj App.xcodeproj/project.pbxproj.backup

echo "Configuring iOS project with development team: $DEVELOPMENT_TEAM"

# Validate that DEVELOPMENT_TEAM is set
if [ -z "$DEVELOPMENT_TEAM" ]; then
    echo "ERROR: DEVELOPMENT_TEAM environment variable is not set"
    exit 1
fi

# Create a comprehensive Python script to modify the project file
cat > modify_project.py << 'EOF'
import sys
import re

with open('App.xcodeproj/project.pbxproj', 'r') as f:
    content = f.read()

team_id = sys.argv[1] if len(sys.argv) > 1 else ""

if not team_id:
    print("ERROR: No team ID provided")
    sys.exit(1)

print(f"Setting development team to: {team_id}")

# More aggressive replacement of development team
content = re.sub(r'DEVELOPMENT_TEAM = "[^"]*";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'DEVELOPMENT_TEAM = "";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'DEVELOPMENT_TEAM = ;', f'DEVELOPMENT_TEAM = "{team_id}";', content)

# Set signing settings
content = re.sub(r'CODE_SIGN_STYLE = Automatic;', 'CODE_SIGN_STYLE = Manual;', content)
content = re.sub(r'CODE_SIGN_IDENTITY = "[^"]*";', 'CODE_SIGN_IDENTITY = "Apple Distribution";', content)
content = re.sub(r'"CODE_SIGN_IDENTITY\[sdk=iphoneos\*\]" = "[^"]*";', '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";', content)

# Set provisioning profile
content = re.sub(r'PROVISIONING_PROFILE_SPECIFIER = "[^"]*";', 'PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";', content)

# Replace any old distribution certificate references
content = re.sub(r'iOS Distribution', 'Apple Distribution', content)
content = re.sub(r'iPhone Distribution', 'Apple Distribution', content)

# Ensure build configurations have all required settings
# Find build configurations and add missing settings
build_config_pattern = r'(buildSettings = \{[^}]*?)(};)'

def ensure_signing_settings(match):
    build_settings = match.group(1)
    end_brace = match.group(2)
    
    # Only modify configurations that have CODE_SIGN_STYLE
    if 'CODE_SIGN_STYLE' in build_settings:
        # Ensure development team is set
        if f'DEVELOPMENT_TEAM = "{team_id}";' not in build_settings:
            if 'DEVELOPMENT_TEAM' not in build_settings:
                build_settings += f'\n\t\t\t\tDEVELOPMENT_TEAM = "{team_id}";'
        
        # Ensure provisioning profile is set for manual signing
        if 'CODE_SIGN_STYLE = Manual;' in build_settings:
            if 'PROVISIONING_PROFILE_SPECIFIER' not in build_settings:
                build_settings += '\n\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";'
    
    return build_settings + end_brace

content = re.sub(build_config_pattern, ensure_signing_settings, content, flags=re.DOTALL)

with open('App.xcodeproj/project.pbxproj', 'w') as f:
    f.write(content)

print("Configuration complete")

# Show what we set
with open('App.xcodeproj/project.pbxproj', 'r') as f:
    content = f.read()
    team_count = content.count(f'DEVELOPMENT_TEAM = "{team_id}";')
    profile_count = content.count('PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";')
    print(f"Development team set in {team_count} locations")
    print(f"Provisioning profile set in {profile_count} locations")
EOF

# Run the Python script
python3 modify_project.py "$DEVELOPMENT_TEAM"

# Clean up
rm modify_project.py

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"