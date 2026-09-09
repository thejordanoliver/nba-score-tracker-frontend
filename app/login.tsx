import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { Animated, View } from "react-native";

import ConfirmModal from "../components/ConfirmModal";
import CropEditorModal from "../components/CropEditorModal";
import { CustomHeader } from "../components/CustomHeader";
import SignInForm from "../components/Forms/SignInForm";
import SignUpForm from "../components/Forms/SignUpForm";
import TabBar from "../components/TabBars/TabBar";
import type { FavoriteSportId } from "../constants/leagues";
import { usePreferences } from "../contexts/PreferencesContext";
import { useAuth } from "../hooks/UserHooks/useAuth";
import {
  SIGNUP_ACCOUNT_FIELDS,
  SIGNUP_CREDENTIAL_FIELDS,
  signupSchema,
  type SignupFormValues,
} from "../schemas/auth/signupSchema";
import { formStyles } from "../styles/FormStyles";
import type { AlertConfig } from "../types/alert";
import { buildFavoriteTeamKey } from "../types/favorites";

const LOGIN_TABS = ["sign in", "sign up"] as const;

type LoginTab = (typeof LOGIN_TABS)[number];

type CropTarget = "profile" | "banner";

const SIGNUP_MAX_STEP = 4;

const SIGNUP_HEADER_TITLES: Record<number, string> = {
  0: "Create Account",
  1: "Email & Password",
  2: "Select Favorites",
  3: "Upload Images",
  4: "Review Details",
};

const INITIAL_SIGNUP_DATA: SignupFormValues = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  favoriteTeams: [],
  favoriteSports: [],
  profileImage: null,
  bannerImage: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

function getFileName(uri: string, target: CropTarget): string {
  const filename = uri.split("/").pop()?.split("?")[0];

  if (filename && filename.includes(".")) {
    return filename;
  }

  return `${target}-${Date.now()}.jpg`;
}

function getMimeType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";

    case "webp":
      return "image/webp";

    case "heic":
    case "heif":
      return "image/heic";

    default:
      return "image/jpeg";
  }
}

export default function LoginScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const { resolvedColorScheme } = usePreferences();

  const { login, signup } = useAuth();

  const isDark = resolvedColorScheme === "dark";

  const styles = formStyles(isDark);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [selectedTab, setSelectedTab] = useState<LoginTab>("sign in");

  const [signupStep, setSignupStep] = useState(0);

  const {
    control: signupControl,
    formState: {
      isSubmitting: isSigningUp,
      isValidating: isSignupValidating,
    },
    getValues: getSignupValues,
    handleSubmit: handleSignupSubmit,
    setError: setSignupError,
    setValue: setSignupValue,
    trigger: triggerSignup,
  } = useForm<SignupFormValues>({
    defaultValues: INITIAL_SIGNUP_DATA,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(signupSchema),
    shouldUnregister: false,
  });

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isSigningIn, setIsSigningIn] = useState(false);

  const [isGridView, setIsGridView] = useState(true);

  const [isCropModalVisible, setCropModalVisible] = useState(false);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  const closeCropEditor = useCallback(() => {
    setCropModalVisible(false);
    setImageToCrop(null);
    setCropTarget(null);
  }, []);

  const openImagePickerFor = useCallback(
    async (target: CropTarget) => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });

        if (result.canceled) {
          return;
        }

        const asset = result.assets?.[0];

        if (!asset?.uri) {
          showAlert({
            title: "Image unavailable",
            message: "The selected image could not be loaded.",
          });

          return;
        }

        setImageToCrop(asset.uri);
        setCropTarget(target);
        setCropModalVisible(true);
      } catch (error: unknown) {
        showAlert({
          title: "Couldn’t open photos",
          message: getErrorMessage(
            error,
            "Your photo library could not be opened. Please try again.",
          ),
        });
      }
    },
    [showAlert],
  );

  const onImageCropped = useCallback(
    (croppedUri: string) => {
      if (!cropTarget) {
        closeCropEditor();
        return;
      }

      const fieldName =
        cropTarget === "profile" ? "profileImage" : "bannerImage";

      setSignupValue(fieldName, croppedUri, {
        shouldDirty: true,
      });

      closeCropEditor();
    },
    [closeCropEditor, cropTarget, setSignupValue],
  );

  const handleLogin = useCallback(async () => {
    if (isSigningIn) {
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      showAlert({
        title: "Username required",
        message: "Please enter your username.",
      });

      return;
    }

    if (!password) {
      showAlert({
        title: "Password required",
        message: "Please enter your password.",
      });

      return;
    }

    try {
      setIsSigningIn(true);

      await login(normalizedUsername, password);
    } catch (error: unknown) {
      showAlert({
        title: "Login failed",
        message: getErrorMessage(
          error,
          "Something went wrong. Please try again.",
        ),
      });
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn, login, password, showAlert, username]);

  const appendImage = useCallback(
    (formData: FormData, uri: string | null, target: CropTarget) => {
      if (!uri) {
        return;
      }

      const filename = getFileName(uri, target);

      const fieldName = target === "profile" ? "profileImage" : "bannerImage";

      const file = {
        uri,
        name: filename,
        type: getMimeType(filename),
      };

      formData.append(fieldName, file as unknown as Blob);
    },
    [],
  );

  const handleSignup = useCallback(async (signupData: SignupFormValues) => {
    const formData = new FormData();

    formData.append("fullName", signupData.fullName);

    formData.append("username", signupData.username);

    formData.append("email", signupData.email);

    formData.append("password", signupData.password);

    formData.append("favoriteTeams", JSON.stringify(signupData.favoriteTeams));

    formData.append(
      "favoriteSports",
      JSON.stringify(signupData.favoriteSports),
    );

    appendImage(formData, signupData.profileImage, "profile");

    appendImage(formData, signupData.bannerImage, "banner");

    try {
      await signup(formData);
    } catch (error: unknown) {
      const message = getErrorMessage(
        error,
        "Your account could not be created. Please try again.",
      );

      if (message.startsWith("Full name")) {
        setSignupError("fullName", { type: "server", message });
        setSignupStep(0);
        return;
      }

      if (message.startsWith("Username")) {
        setSignupError("username", { type: "server", message });
        setSignupStep(0);
        return;
      }

      if (message.startsWith("A valid email")) {
        setSignupError("email", { type: "server", message });
        setSignupStep(1);
        return;
      }

      if (message.startsWith("Password")) {
        setSignupError("password", { type: "server", message });
        setSignupStep(1);
        return;
      }

      showAlert({
        title: "Signup failed",
        message,
      });
    }
  }, [appendImage, setSignupError, showAlert, signup]);

  const handleInvalidSignup = useCallback(
    (errors: FieldErrors<SignupFormValues>) => {
      if (errors.fullName || errors.username) {
        setSignupStep(0);
        return;
      }

      if (errors.email || errors.password || errors.confirmPassword) {
        setSignupStep(1);
      }
    },
    [],
  );

  const handleToggleFavorite = useCallback(
    (league: string, id: string) => {
      const key = buildFavoriteTeamKey(league, id);

      if (!key) {
        return;
      }

      const favorites = getSignupValues("favoriteTeams");
      const isFavorite = favorites.includes(key);

      setSignupValue(
        "favoriteTeams",
        isFavorite
          ? favorites.filter((favorite) => favorite !== key)
          : [...favorites, key],
        { shouldDirty: true },
      );
    },
    [getSignupValues, setSignupValue],
  );

  const handleToggleFavoriteSport = useCallback(
    (sport: FavoriteSportId) => {
      const favorites = getSignupValues("favoriteSports");
      const isFavorite = favorites.includes(sport);

      setSignupValue(
        "favoriteSports",
        isFavorite
          ? favorites.filter((favorite) => favorite !== sport)
          : [...favorites, sport],
        { shouldDirty: true },
      );
    },
    [getSignupValues, setSignupValue],
  );

  const toggleLayout = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setIsGridView((previous) => !previous);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleMainTabPress = useCallback((tab: LoginTab) => {
    setSelectedTab(tab);
    setSignupStep(0);
  }, []);

  const handleNextSignupStep = useCallback(async () => {
    if (signupStep === 0) {
      const isValid = await triggerSignup(SIGNUP_ACCOUNT_FIELDS, {
        shouldFocus: true,
      });

      if (!isValid) {
        return;
      }
    }

    if (signupStep === 1) {
      const isValid = await triggerSignup(SIGNUP_CREDENTIAL_FIELDS, {
        shouldFocus: true,
      });

      if (!isValid) {
        return;
      }
    }

    setSignupStep((current) => Math.min(current + 1, SIGNUP_MAX_STEP));
  }, [signupStep, triggerSignup]);

  const handlePreviousSignupStep = useCallback(() => {
    setSignupStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleHeaderBack = useCallback(() => {
    if (selectedTab === "sign up" && signupStep > 0) {
      handlePreviousSignupStep();
      return;
    }

    router.back();
  }, [handlePreviousSignupStep, router, selectedTab, signupStep]);

  useLayoutEffect(() => {
    const isSignup = selectedTab === "sign up";

    const showBackButton = !(
      selectedTab === "sign in" ||
      (isSignup && signupStep === 0)
    );

    const showLayoutToggle = isSignup && signupStep === 2;

    const headerTitle =
      selectedTab === "sign in"
        ? "Sign In"
        : (SIGNUP_HEADER_TITLES[signupStep] ?? "Sign Up");

    navigation.setOptions({
      header: () => (
        <CustomHeader
          title={headerTitle}
          tabName="Login"
          onBack={handleHeaderBack}
          isGrid={isGridView}
          onToggleLayout={showLayoutToggle ? toggleLayout : undefined}
          showBackButton={showBackButton}
        />
      ),
    });
  }, [
    handleHeaderBack,
    isGridView,
    navigation,
    selectedTab,
    signupStep,
    toggleLayout,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionContainer}>
        {!(selectedTab === "sign up" && signupStep > 0) && (
          <View style={styles.tabBarWrapper}>
            <TabBar
              tabs={LOGIN_TABS}
              selected={selectedTab}
              onTabPress={handleMainTabPress}
              isDark={isDark}
            />
          </View>
        )}

        <View style={styles.sectionContainer}>
          {selectedTab === "sign in" ? (
            <SignInForm
              username={username}
              password={password}
              showPassword={showPassword}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onToggleShowPassword={() =>
                setShowPassword((previous) => !previous)
              }
              onSubmit={handleLogin}
              onForgotPassword={() => router.push("/forgot-password")}
            />
          ) : (
            <SignUpForm
              control={signupControl}
              signupStep={signupStep}
              onNextStep={handleNextSignupStep}
              onToggleFavorite={handleToggleFavorite}
              onToggleFavoriteSport={handleToggleFavoriteSport}
              onOpenImagePickerFor={openImagePickerFor}
              isGridView={isGridView}
              fadeAnim={fadeAnim}
              isSubmitting={isSigningUp}
              isValidating={isSignupValidating}
              onSubmit={handleSignupSubmit(
                handleSignup,
                handleInvalidSignup,
              )}
            />
          )}
        </View>

        {imageToCrop && cropTarget && (
          <CropEditorModal
            visible={isCropModalVisible}
            imageUri={imageToCrop}
            onCancel={closeCropEditor}
            onCrop={onImageCropped}
            mode={cropTarget}
          />
        )}
      </View>

      <ConfirmModal
        visible={Boolean(alertConfig)}
        title={alertConfig?.title}
        message={alertConfig?.message}
        confirmText={alertConfig?.confirmText ?? "OK"}
        cancelText={alertConfig?.cancelText}
        showCancel={alertConfig?.showCancel ?? Boolean(alertConfig?.cancelText)}
        confirmDisabled={alertConfig?.confirmDisabled}
        variant={alertConfig?.variant ?? "default"}
        onCancel={closeAlert}
        onConfirm={() => {
          const onConfirm = alertConfig?.onConfirm;

          if (onConfirm) {
            onConfirm();
            return;
          }

          closeAlert();
        }}
      />
    </View>
  );
}
