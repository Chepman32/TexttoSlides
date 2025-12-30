# SerenitySpark - App Store Connect Upload Guide

## Prerequisites

1. **Install fastlane** (if not already installed):

   ```bash
   sudo gem install fastlane -NV
   ```

   Or using Homebrew:

   ```bash
   brew install fastlane
   ```

2. **Verify API Key**: The API key file `AuthKey_TVX56KGPFH.p8` is already in place.

3. **Bundle Identifier**: `com.antonchepur.SerenitySpark`

## Upload Metadata to App Store Connect

To upload all metadata (descriptions, keywords, screenshots, etc.) to App Store Connect:

```bash
cd fastlane
bundle exec fastlane ios upload_metadata
```

Or without bundle:

```bash
fastlane ios upload_metadata
```

This will:

- Upload app name, subtitle, and promotional text
- Upload descriptions for all 30 supported languages
- Upload keywords for App Store search
- Set privacy and support URLs
- Skip binary upload (metadata only)

## Important Notes

### Translations

Currently, all language folders contain English text as placeholders. Before submitting to the App Store, you should:

1. Translate the content in each language folder
2. Ensure translations fit within character limits:
   - Name: 30 characters max
   - Subtitle: 30 characters max
   - Promotional text: 170 characters max
   - Keywords: 100 characters max
   - Description: 4,000 characters max

### Screenshots

The `screenshots` folder is empty. You'll need to:

1. Take screenshots for each device size required by Apple
2. Organize them in the appropriate language folders
3. Run `fastlane ios screenshots` to upload them

### Privacy Policy

All languages point to: https://www.freeprivacypolicy.com/live/901c4663-a672-4fda-a180-394a1609360b

### Support URL

All languages point to: https://t.me/Chepman32

## Troubleshooting

If you encounter authentication issues:

1. Verify the API key file exists: `fastlane/AuthKey_TVX56KGPFH.p8`
2. Check that the key_id and issuer_id in Fastfile are correct
3. Ensure your Apple ID has proper permissions in App Store Connect

If metadata validation fails:

1. Check character limits for each field
2. Ensure all required fields are present
3. Review App Store Connect guidelines

## Next Steps After Metadata Upload

1. **Build and Archive** your app in Xcode
2. **Upload the binary** to App Store Connect via Xcode or Transporter
3. **Add screenshots** if not already done
4. **Fill in additional info** in App Store Connect (age rating, categories, etc.)
5. **Submit for review**

## Supported Languages

The app metadata is configured for 30 languages:

- Arabic (ar)
- Czech (cs)
- Danish (da)
- German (de-DE)
- Greek (el)
- English (en-US)
- Spanish Mexico (es-MX)
- Finnish (fi)
- French (fr-FR)
- Hebrew (he)
- Hindi (hi)
- Hungarian (hu)
- Indonesian (id)
- Italian (it)
- Japanese (ja)
- Korean (ko)
- Malay (ms)
- Dutch (nl-NL)
- Norwegian (no-NO)
- Polish (pl)
- Portuguese Brazil (pt-BR)
- Romanian (ro)
- Russian (ru)
- Swedish (sv)
- Thai (th)
- Turkish (tr)
- Ukrainian (uk)
- Vietnamese (vi)
- Chinese Simplified (zh-Hans)
