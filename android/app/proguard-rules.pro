# DocuFlex R8 / ProGuard Configuration
# Strips sensitive debug logs in release builds

-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# Preserve Compose runtime annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses

# Do not obfuscate parcelables
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}
