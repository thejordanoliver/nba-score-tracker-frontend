// screens/EditProfileScreen.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Button from "components/Buttons/Button";
import ConfirmModal from "components/ConfirmModal";
import CropEditorModal from "components/CropEditorModal";
import { CustomHeader } from "components/CustomHeader";
import LabeledInput from "components/LabeledInput";
import ProfileBanner from "components/Profile/ProfileBanner";
import { usePreferences } from "contexts/PreferencesContext";
import { useAccountDetails } from "hooks/UserHooks/useAccountDetails";
import { useEditProfile } from "hooks/UserHooks/useEditProfile";
import {
  EDIT_PROFILE_BIO_MAX_LENGTH,
  editProfileSchema,
  type EditProfileFormValues,
} from "schemas/user/editProfileSchema";
import { useProfileRefreshStore } from "store/profileRefreshStore";
import type { AlertConfig } from "types/alert";

const BIO_INPUT_BUFFER = 25;

const INITIAL_FORM_VALUES: EditProfileFormValues = {
  fullName: "",
  bio: "",
};

type CropTarget = "profile" | "banner";
type ImageFieldName = "profileImage" | "bannerImage";
type InitializationSource = "cache" | "server";

type StoredProfileData = {
  username?: string | null;
  fullName?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  bannerImage?: string | null;
};

type InitialProfileData = {
  username: string;
  fullName: string;
  bio: string;
  profileImage: string | null;
  bannerImage: string | null;
};

type EditableImageAsset = {
  uri?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
};

type ReactNativeFormDataFile = {
  uri: string;
  name: string;
  type: string;
};

const FULL_NAME_SERVER_ERRORS = new Set([
  "Full name is required",
  "Full name must be 1-80 characters",
]);

const BIO_SERVER_ERRORS = new Set([
  "Bio must be a string",
  "Bio must be 150 characters or less",
]);

const normalizeStoredValue = (value?: string | null) => {
  if (!value || value === "null" || value === "undefined") return "";
  return value;
};

const normalizeStoredImage = (value?: string | null) => {
  const normalized = normalizeStoredValue(value);
  return normalized || null;
};

const getImageMimeType = (filenameOrUri: string, mimeType?: string | null) => {
  if (mimeType) return mimeType.toLowerCase();

  const extension = filenameOrUri
    .split("?")[0]
    .split("#")[0]
    .split(".")
    .pop()
    ?.toLowerCase();

  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
};

const getImageExtensionFromMime = (mimeType: string) => {
  switch (mimeType.toLowerCase()) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
};

const isGifAsset = (asset: EditableImageAsset) =>
  getImageMimeType(asset.fileName ?? asset.uri ?? "", asset.mimeType) ===
  "image/gif";

const isLocalImageUri = (uri: string | null): uri is string => {
  if (!uri) return false;

  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
  );
};

const getSafeUploadFileName = (
  uri: string,
  fieldName: ImageFieldName,
  mimeType: string,
) => {
  const fallbackName = `${fieldName}.${getImageExtensionFromMime(mimeType)}`;
  const rawFilename = uri.split("/").pop()?.split("?")[0]?.split("#")[0];

  if (!rawFilename) return fallbackName;

  const hasExtension = /\.[a-zA-Z0-9]+$/.test(rawFilename);
  return hasExtension ? rawFilename : fallbackName;
};

const appendLocalImageToFormData = (
  formData: FormData,
  uri: string | null,
  fieldName: ImageFieldName,
) => {
  if (!isLocalImageUri(uri)) return;

  const mimeType = getImageMimeType(uri);
  const filename = getSafeUploadFileName(uri, fieldName, mimeType);
  const file: ReactNativeFormDataFile = {
    uri,
    name: filename,
    type: mimeType,
  };

  formData.append(fieldName, file as unknown as Blob);
};

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const { saveProfile } = useEditProfile();
  const { userData } = useAccountDetails();
  const requestProfileRefresh = useProfileRefreshStore(
    (state) => state.requestProfileRefresh,
  );

  const {
    control,
    handleSubmit,
    reset,
    setError,
    trigger,
    formState: { isDirty, isSubmitting, isValid, isValidating },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: INITIAL_FORM_VALUES,
    mode: "onChange",
  });

  const initializationSourceRef = useRef<InitializationSource | null>(null);
  const handledServerDataRef = useRef(false);

  const [hasInitializedProfile, setHasInitializedProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [initialProfileImage, setInitialProfileImage] = useState<string | null>(
    null,
  );
  const [initialBannerImage, setInitialBannerImage] = useState<string | null>(
    null,
  );
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [isCropModalVisible, setCropModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const profileImageChanged = profileImage !== initialProfileImage;
  const bannerImageChanged = bannerImage !== initialBannerImage;
  const hasChanges = isDirty || profileImageChanged || bannerImageChanged;
  const canSave =
    hasInitializedProfile &&
    hasChanges &&
    isValid &&
    !isSubmitting &&
    !isValidating;

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  const resetCropState = useCallback(() => {
    setImageToCrop(null);
    setCropTarget(null);
    setCropModalVisible(false);
  }, []);

  const initializeProfile = useCallback(
    (profile: InitialProfileData, source: InitializationSource) => {
      initializationSourceRef.current = source;
      setUsername(profile.username);
      setProfileImage(profile.profileImage);
      setBannerImage(profile.bannerImage);
      setInitialProfileImage(profile.profileImage);
      setInitialBannerImage(profile.bannerImage);
      reset({
        fullName: profile.fullName,
        bio: profile.bio,
      });
      setHasInitializedProfile(true);
      void trigger();
    },
    [reset, trigger],
  );

  useEffect(() => {
    let mounted = true;

    const loadCachedData = async () => {
      try {
        const pairs = await AsyncStorage.multiGet([
          "username",
          "fullName",
          "bio",
          "profileImage",
          "bannerImage",
        ]);

        if (!mounted || initializationSourceRef.current) return;

        const data = Object.fromEntries(pairs) as StoredProfileData;
        const hasCachedProfile = pairs.some(([, value]) => value !== null);

        if (!hasCachedProfile) return;

        initializeProfile(
          {
            username: normalizeStoredValue(data.username),
            fullName: normalizeStoredValue(data.fullName),
            bio: normalizeStoredValue(data.bio),
            profileImage: normalizeStoredImage(data.profileImage),
            bannerImage: normalizeStoredImage(data.bannerImage),
          },
          "cache",
        );
      } catch {
        if (!mounted) return;

        showAlert({
          title: "Error",
          message: "Failed to load your cached profile data.",
        });
      }
    };

    void loadCachedData();

    return () => {
      mounted = false;
    };
  }, [initializeProfile, showAlert]);

  useEffect(() => {
    if (!userData || handledServerDataRef.current) return;

    handledServerDataRef.current = true;

    const mediaIsDirty = profileImageChanged || bannerImageChanged;
    const mayReplaceCachedValues =
      initializationSourceRef.current === "cache" &&
      !isDirty &&
      !mediaIsDirty;

    if (initializationSourceRef.current && !mayReplaceCachedValues) return;

    initializeProfile(
      {
        username: userData.username,
        fullName: userData.fullName,
        bio: userData.bio,
        profileImage: userData.profileImage,
        bannerImage: userData.bannerImage,
      },
      "server",
    );
  }, [
    bannerImageChanged,
    initializeProfile,
    isDirty,
    profileImageChanged,
    userData,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeader title="Edit Profile" onBack={goBack} />,
    });
  }, [navigation]);

  const requestImagePermission = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert({
        title: "Permission Required",
        message: "Please allow photo access to update your profile images.",
      });

      return false;
    }

    return true;
  }, [showAlert]);

  const openImagePickerFor = useCallback(
    async (target: CropTarget) => {
      try {
        const hasPermission = await requestImagePermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });

        if (result.canceled) {
          resetCropState();
          return;
        }

        const asset = result.assets?.[0];
        const uri = asset?.uri;

        if (!uri) {
          resetCropState();
          showAlert({
            title: "Error",
            message: "Could not read the selected image.",
          });

          return;
        }

        if (isGifAsset(asset)) {
          if (target === "profile") {
            setProfileImage(uri);
          } else {
            setBannerImage(uri);
          }

          resetCropState();
          return;
        }

        setImageToCrop(uri);
        setCropTarget(target);
        setCropModalVisible(true);
      } catch {
        resetCropState();
        showAlert({
          title: "Error",
          message: "Failed to open your photo library.",
        });
      }
    },
    [requestImagePermission, resetCropState, showAlert],
  );

  const handleProfileImagePress = useCallback(() => {
    void openImagePickerFor("profile");
  }, [openImagePickerFor]);

  const handleBannerImagePress = useCallback(() => {
    void openImagePickerFor("banner");
  }, [openImagePickerFor]);

  const handleImageCropped = useCallback(
    (croppedUri: string) => {
      if (!croppedUri) {
        resetCropState();
        showAlert({
          title: "Error",
          message: "Could not crop the selected image.",
        });
        return;
      }

      if (cropTarget === "profile") {
        setProfileImage(croppedUri);
      } else if (cropTarget === "banner") {
        setBannerImage(croppedUri);
      }

      resetCropState();
    },
    [cropTarget, resetCropState, showAlert],
  );

  const handleSave = useCallback(
    async (values: EditProfileFormValues) => {
      if (!hasInitializedProfile || !hasChanges) return;

      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("bio", values.bio);

      if (profileImageChanged) {
        appendLocalImageToFormData(formData, profileImage, "profileImage");
      }

      if (bannerImageChanged) {
        appendLocalImageToFormData(formData, bannerImage, "bannerImage");
      }

      if (__DEV__) {
        console.log("Edit profile save payload:", {
          hasChangedProfileImage:
            profileImageChanged && isLocalImageUri(profileImage),
          hasChangedBannerImage:
            bannerImageChanged && isLocalImageUri(bannerImage),
        });
      }

      try {
        const updatedUser = await saveProfile(formData);

        setUsername(updatedUser.username);
        setProfileImage(updatedUser.profileImage);
        setBannerImage(updatedUser.bannerImage);
        setInitialProfileImage(updatedUser.profileImage);
        setInitialBannerImage(updatedUser.bannerImage);
        reset({
          fullName: updatedUser.fullName,
          bio: updatedUser.bio,
        });
        requestProfileRefresh();

        showAlert({
          title: "Saved",
          message: "Profile updated successfully.",
          onConfirm: () => {
            closeAlert();
            router.back();
          },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to update your profile.";

        if (FULL_NAME_SERVER_ERRORS.has(message)) {
          setError("fullName", { type: "server", message });
          return;
        }

        if (BIO_SERVER_ERRORS.has(message)) {
          setError("bio", { type: "server", message });
          return;
        }

        showAlert({
          title: "Error",
          message,
        });
      }
    },
    [
      bannerImage,
      bannerImageChanged,
      closeAlert,
      hasChanges,
      hasInitializedProfile,
      profileImage,
      profileImageChanged,
      requestProfileRefresh,
      reset,
      router,
      saveProfile,
      setError,
      showAlert,
    ],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      style={styles.container}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileBanner
          bannerImage={bannerImage}
          profileImage={profileImage}
          isDark={isDark}
          editable={hasInitializedProfile}
          onPressBanner={handleBannerImagePress}
          onPressProfile={handleProfileImagePress}
        />

        <View style={styles.formContainer}>
          <Controller
            control={control}
            name="fullName"
            render={({ field, fieldState }) => (
              <LabeledInput
                label="Name"
                value={field.value}
                hint={fieldState.error?.message}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                autoCapitalize="words"
                editable={hasInitializedProfile}
                returnKeyType="next"
              />
            )}
          />

          <LabeledInput
            label="Username"
            value={username}
            editable={false}
            onChangeText={() => {}}
            autoCapitalize="none"
          />

          <Controller
            control={control}
            name="bio"
            render={({ field, fieldState }) => (
              <LabeledInput
                label="Bio"
                value={field.value}
                hint={fieldState.error?.message}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                editable={hasInitializedProfile}
                multiline
                enforceMaxLength={false}
                maxLength={EDIT_PROFILE_BIO_MAX_LENGTH + BIO_INPUT_BUFFER}
              />
            )}
          />

          <Button
            onPress={() => void handleSubmit(handleSave)()}
            disabled={!canSave}
            isDark={isDark}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </View>
      </ScrollView>

      {imageToCrop && cropTarget && (
        <CropEditorModal
          visible={isCropModalVisible}
          imageUri={imageToCrop}
          onCancel={resetCropState}
          onCrop={handleImageCropped}
          mode={cropTarget}
        />
      )}

      <ConfirmModal
        visible={!!alertConfig}
        title={alertConfig?.title}
        message={alertConfig?.message}
        confirmText={alertConfig?.confirmText ?? "OK"}
        cancelText={alertConfig?.cancelText}
        showCancel={alertConfig?.showCancel ?? !!alertConfig?.cancelText}
        confirmDisabled={alertConfig?.confirmDisabled}
        variant={alertConfig?.variant ?? "default"}
        onCancel={closeAlert}
        onConfirm={() => {
          if (alertConfig?.onConfirm) {
            alertConfig.onConfirm();
            return;
          }

          closeAlert();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 48,
  },
  formContainer: {
    gap: 14,
    paddingTop: 64,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
});
