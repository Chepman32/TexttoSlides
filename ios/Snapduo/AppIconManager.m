#import "AppIconManager.h"
#import <React/RCTLog.h>

@implementation AppIconManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(changeIcon:(NSString *)iconName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 10.3, *)) {
        if ([[UIApplication sharedApplication] supportsAlternateIcons]) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [[UIApplication sharedApplication] setAlternateIconName:iconName completionHandler:^(NSError * _Nullable error) {
                    if (error) {
                        reject(@"icon_change_error", @"Failed to change app icon", error);
                    } else {
                        resolve(@"App icon changed successfully");
                    }
                }];
            });
        } else {
            reject(@"not_supported", @"Alternate icons not supported on this device", nil);
        }
    } else {
        reject(@"ios_version", @"iOS 10.3 or later required", nil);
    }
}

RCT_EXPORT_METHOD(getCurrentIcon:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    if (@available(iOS 10.3, *)) {
        NSString *currentIcon = [[UIApplication sharedApplication] alternateIconName];
        resolve(currentIcon ?: @"default");
    } else {
        reject(@"ios_version", @"iOS 10.3 or later required", nil);
    }
}

@end