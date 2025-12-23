#!/bin/bash

# Script to generate iOS app icon sets from 1024x1024 source images

# Define the sizes needed for iOS app icons
sizes=(
    "20x20@2x:40"
    "20x20@3x:60"
    "29x29@2x:58"
    "29x29@3x:87"
    "40x40@2x:80"
    "40x40@3x:120"
    "60x60@2x:120"
    "60x60@3x:180"
    "1024:1024"
)

# Define the icon variants
icons=(
    "blue:AppIconBlue"
    "coral:AppIconCoral"
    "dark:AppIconDark"
    "fuchsia:AppIconFuchsia"
    "solar:AppIconSolar"
    "teal:AppIconTeal"
)

# Source directory
SRC_DIR="src/assets/icons/appIcon"
# iOS assets directory
IOS_DIR="ios/Snapduo/Images.xcassets"

echo "Generating iOS app icon sets..."

for icon_def in "${icons[@]}"; do
    IFS=':' read -r color_name ios_name <<< "$icon_def"

    source_file="$SRC_DIR/icon_${color_name}_1024.png"
    output_dir="$IOS_DIR/${ios_name}.appiconset"

    if [[ ! -f "$source_file" ]]; then
        echo "Warning: Source file $source_file not found, skipping..."
        continue
    fi

    echo "Processing $color_name -> $ios_name"

    # Create the output directory
    mkdir -p "$output_dir"

    # Generate each size
    for size_def in "${sizes[@]}"; do
        IFS=':' read -r name size <<< "$size_def"

        if [[ "$name" == "1024" ]]; then
            output_file="$output_dir/AppIcon-1024.png"
        else
            output_file="$output_dir/AppIcon-${name}.png"
        fi

        echo "  Generating ${size}x${size} -> $(basename "$output_file")"
        convert "$source_file" -resize "${size}x${size}" "$output_file"
    done

    # Create Contents.json
    cat > "$output_dir/Contents.json" << EOF
{
  "images" : [
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20",
      "filename" : "AppIcon-20x20@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20",
      "filename" : "AppIcon-20x20@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29",
      "filename" : "AppIcon-29x29@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29",
      "filename" : "AppIcon-29x29@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40",
      "filename" : "AppIcon-40x40@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40",
      "filename" : "AppIcon-40x40@3x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60",
      "filename" : "AppIcon-60x60@2x.png"
    },
    {
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60",
      "filename" : "AppIcon-60x60@3x.png"
    },
    {
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024",
      "filename" : "AppIcon-1024.png"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOF

done

echo "Icon generation completed!"