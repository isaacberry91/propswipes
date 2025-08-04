#!/bin/bash

# Configure iOS project for CI builds
echo "=== SCRIPT STARTING ==="
echo "Script current directory: $(pwd)"
echo "Contents: $(ls -la)"

# Navigate to the iOS App directory
if [ -d "ios/App" ]; then
    echo "Found ios/App directory, navigating..."
    cd ios/App || {
        echo "ERROR: Could not change to ios/App directory"
        exit 1
    }
else
    echo "ERROR: ios/App directory not found"
    echo "Available directories: $(ls -la)"
    exit 1
fi

echo "Now in directory: $(pwd)"
echo "Project file exists: $(ls -la App.xcodeproj/project.pbxproj)"

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

# FIRST: Replace ALL occurrences of old certificate names everywhere
print("Replacing certificate references...")
content = content.replace('iOS Distribution', 'Apple Distribution')
content = content.replace('iPhone Distribution', 'Apple Distribution') 
content = content.replace('"iOS Distribution"', '"Apple Distribution"')
content = content.replace('"iPhone Distribution"', '"Apple Distribution"')
content = content.replace('iPhone Developer', 'Apple Distribution')
content = content.replace('"iPhone Developer"', '"Apple Distribution"')
# Also handle any variations with spaces or quotes
content = re.sub(r'"[^"]*iOS Distribution[^"]*"', '"Apple Distribution"', content)
content = re.sub(r'"[^"]*iPhone Distribution[^"]*"', '"Apple Distribution"', content)
content = re.sub(r'"[^"]*iPhone Developer[^"]*"', '"Apple Distribution"', content)

# SECOND: Set all signing-related settings
print("Setting signing configuration...")
content = re.sub(r'CODE_SIGN_STYLE = Automatic;', 'CODE_SIGN_STYLE = Manual;', content)

# Development team - be very aggressive
content = re.sub(r'DEVELOPMENT_TEAM = "[^"]*";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'DEVELOPMENT_TEAM = "";', f'DEVELOPMENT_TEAM = "{team_id}";', content)
content = re.sub(r'DEVELOPMENT_TEAM = ;', f'DEVELOPMENT_TEAM = "{team_id}";', content)

# Code signing identity - replace ALL variations
content = re.sub(r'CODE_SIGN_IDENTITY = "[^"]*";', 'CODE_SIGN_IDENTITY = "Apple Distribution";', content)
content = re.sub(r'"CODE_SIGN_IDENTITY\[sdk=iphoneos\*\]" = "[^"]*";', '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";', content)

# Provisioning profile
content = re.sub(r'PROVISIONING_PROFILE_SPECIFIER = "[^"]*";', 'PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";', content)

# THIRD: Ensure every build configuration has the required settings
print("Ensuring complete build configuration...")
build_config_pattern = r'(buildSettings = \{[^}]*?)(};)'

def ensure_complete_signing(match):
    build_settings = match.group(1)
    end_brace = match.group(2)
    
    # Only modify configurations that seem to be for app targets (including extensions)
    if 'CODE_SIGN_STYLE' in build_settings or 'PRODUCT_BUNDLE_IDENTIFIER' in build_settings:
        required_settings = [
            f'DEVELOPMENT_TEAM = "{team_id}";',
            'CODE_SIGN_STYLE = Manual;',
            'CODE_SIGN_IDENTITY = "Apple Distribution";',
            '"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "Apple Distribution";',
            'PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";'
        ]
        
        for setting in required_settings:
            key = setting.split(' = ')[0].strip('"')
            if key not in build_settings:
                build_settings += f'\n\t\t\t\t{setting}'
    
    return build_settings + end_brace

content = re.sub(build_config_pattern, ensure_complete_signing, content, flags=re.DOTALL)

# Save the file
with open('App.xcodeproj/project.pbxproj', 'w') as f:
    f.write(content)

print("Configuration complete")

# Verification
with open('App.xcodeproj/project.pbxproj', 'r') as f:
    final_content = f.read()
    
    # Count occurrences
    ios_dist_count = final_content.count('iOS Distribution')
    apple_dist_count = final_content.count('Apple Distribution')
    team_count = final_content.count(f'DEVELOPMENT_TEAM = "{team_id}";')
    profile_count = final_content.count('PROVISIONING_PROFILE_SPECIFIER = "PropSwipes App Store Profile";')
    
    print(f"Verification results:")
    print(f"  - Remaining 'iOS Distribution' references: {ios_dist_count}")
    print(f"  - 'Apple Distribution' references: {apple_dist_count}")
    print(f"  - Development team set in {team_count} locations")
    print(f"  - Provisioning profile set in {profile_count} locations")
    
    if ios_dist_count > 0:
        print("WARNING: Some 'iOS Distribution' references remain!")
        # Show context for remaining references
        lines = final_content.split('\n')
        for i, line in enumerate(lines):
            if 'iOS Distribution' in line:
                print(f"  Line {i+1}: {line.strip()}")
EOF

# Run the Python script
python3 modify_project.py "$DEVELOPMENT_TEAM"

# Clean up
rm modify_project.py

echo "iOS project configured for manual signing with development team: $DEVELOPMENT_TEAM"