import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Buttons/Button";
import { Colors, Fonts } from "../constants/styles";
import { usePreferences } from "../contexts/PreferencesContext";
import {
  FORGOT_PASSWORD_CODE_FIELDS,
  FORGOT_PASSWORD_EMAIL_FIELDS,
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "../schemas/auth/forgotPasswordSchema";
import {
  forgotPassword,
  resetPassword,
  verifyResetCode,
} from "../utils/apiClient";

const RESEND_COOLDOWN_SECONDS = 60;
const CODE_EXPIRATION_MINUTES = 10;

type ResetStep = "email" | "code" | "password";
type RequestAction = "requesting" | "resending" | "verifying" | null;

const INITIAL_VALUES: ForgotPasswordFormValues = {
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: unknown; message?: unknown }
      | undefined;

    if (typeof responseData?.error === "string" && responseData.error.trim()) {
      return responseData.error;
    }

    if (
      typeof responseData?.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = authStyles(isDark);

  const [step, setStep] = useState<ResetStep>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [requestAction, setRequestAction] = useState<RequestAction>(null);
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    clearErrors,
    control,
    formState: { isSubmitting, isValid, isValidating },
    getValues,
    handleSubmit,
    reset,
    setError: setFieldError,
    trigger,
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: INITIAL_VALUES,
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(forgotPasswordSchema),
    shouldUnregister: false,
  });

  const isRequestBusy = requestAction !== null || isSubmitting;
  const isBusy = isRequestBusy || isValidating;

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(
    () => () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    },
    [],
  );

  const requestCode = async ({ isResend = false } = {}) => {
    setGlobalError("");
    setSuccess("");

    const fieldsAreValid = await trigger(FORGOT_PASSWORD_EMAIL_FIELDS, {
      shouldFocus: !isResend,
    });

    if (!fieldsAreValid) return;

    const normalizedEmail = getValues("email").trim().toLowerCase();

    try {
      setRequestAction(isResend ? "resending" : "requesting");
      await forgotPassword(normalizedEmail);
      clearErrors("code");
      setStep("code");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccess(
        isResend
          ? "A new code has been sent."
          : "Check your email for a 6-digit code.",
      );
    } catch (error: unknown) {
      setGlobalError(
        getApiErrorMessage(
          error,
          "Unable to send reset code. Please try again.",
        ),
      );
    } finally {
      setRequestAction(null);
    }
  };

  const verifyCode = async () => {
    setGlobalError("");
    setSuccess("");

    const fieldsAreValid = await trigger(FORGOT_PASSWORD_CODE_FIELDS, {
      shouldFocus: true,
    });

    if (!fieldsAreValid) return;

    const normalizedEmail = getValues("email").trim().toLowerCase();
    const trimmedCode = getValues("code").trim();

    try {
      setRequestAction("verifying");
      await verifyResetCode(normalizedEmail, trimmedCode);
      setStep("password");
      setSuccess("Code verified. Enter a new password.");
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Unable to verify the code. Please try again.",
      );

      if (message === "Invalid or expired reset code") {
        setFieldError("code", { type: "server", message });
      } else {
        setGlobalError(message);
      }
    } finally {
      setRequestAction(null);
    }
  };

  const updatePassword = async (values: ForgotPasswordFormValues) => {
    setGlobalError("");
    setSuccess("");

    try {
      await resetPassword(values.email, values.code, values.password);
      setSuccess("Password updated. Redirecting to login...");

      redirectTimeout.current = setTimeout(() => {
        reset(INITIAL_VALUES);
        router.replace("/login");
      }, 1200);
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Unable to update password. Please try again.",
      );

      if (message === "Invalid or expired reset code") {
        setFieldError("code", { type: "server", message });
        setStep("code");
        return;
      }

      if (message.startsWith("Password")) {
        setFieldError("password", { type: "server", message });
        return;
      }

      setGlobalError(message);
    }
  };

  const renderEmailStep = () => (
    <>
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                value={field.value}
                onChangeText={(value) => {
                  field.onChange(value);
                  setGlobalError("");
                }}
                onBlur={field.onBlur}
                placeholder="Email"
                placeholderTextColor={Colors.midTone}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.inputText}
                editable={!isRequestBusy}
              />
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Button
        isDark={isDark}
        onPress={() => requestCode()}
        disabled={isBusy}
        style={styles.button}
      >
        {requestAction === "requesting" ? "Sending..." : "Send Code"}
      </Button>
    </>
  );

  const renderCodeStep = () => (
    <>
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                value={field.value}
                onChangeText={(value) => {
                  field.onChange(value.replace(/\D/g, "").slice(0, 6));
                  setGlobalError("");
                }}
                onBlur={field.onBlur}
                placeholder="6-digit code"
                placeholderTextColor={Colors.midTone}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                style={[styles.inputText, styles.codeInputText]}
                editable={!isRequestBusy}
              />
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Text style={styles.helperText}>
        Codes expire after {CODE_EXPIRATION_MINUTES} minutes.
      </Text>

      <Button
        isDark={isDark}
        onPress={verifyCode}
        disabled={isBusy}
        style={styles.button}
      >
        {requestAction === "verifying" ? "Verifying..." : "Verify Code"}
      </Button>

      <Pressable
        onPress={() => requestCode({ isResend: true })}
        disabled={isBusy || resendCooldown > 0}
        style={styles.linkButton}
      >
        <Text
          style={[
            styles.linkText,
            (isBusy || resendCooldown > 0) && styles.disabledLinkText,
          ]}
        >
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Resend code"}
        </Text>
      </Pressable>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                value={field.value}
                onChangeText={(value) => {
                  field.onChange(value);
                  setGlobalError("");
                  setSuccess("");
                }}
                onBlur={field.onBlur}
                placeholder="New password"
                placeholderTextColor={Colors.midTone}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                style={styles.inputText}
                editable={!isRequestBusy}
              />
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={isDark ? Colors.white : Colors.black}
                />
              </Pressable>
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                value={field.value}
                onChangeText={(value) => {
                  field.onChange(value);
                  setGlobalError("");
                  setSuccess("");
                }}
                onBlur={field.onBlur}
                placeholder="Confirm password"
                placeholderTextColor={Colors.midTone}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                style={styles.inputText}
                editable={!isRequestBusy}
              />
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Button
        isDark={isDark}
        onPress={handleSubmit(updatePassword)}
        disabled={isBusy || !isValid}
        style={styles.button}
      >
        {isSubmitting ? "Updating..." : "Update Password"}
      </Button>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.kicker}>Step {stepOrder[step]} of 3</Text>
                <Text style={styles.title}>Forgot Password</Text>
                <Text style={styles.subtitle}>{subtitleByStep[step]}</Text>
              </View>

              <View style={styles.form}>
                {step === "email" && renderEmailStep()}
                {step === "code" && renderCodeStep()}
                {step === "password" && renderPasswordStep()}

                {!!globalError && (
                  <Text style={styles.errorText}>{globalError}</Text>
                )}
                {!!success && <Text style={styles.successText}>{success}</Text>}

                <Pressable
                  onPress={() => router.replace("/login")}
                  disabled={isRequestBusy}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>Back to Login</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stepOrder: Record<ResetStep, number> = {
  email: 1,
  code: 2,
  password: 3,
};

const subtitleByStep: Record<ResetStep, string> = {
  email: "Enter your email and we will send you a 6-digit code.",
  code: "Check your email for a 6-digit code.",
  password: "Enter a new password for your account.",
};

const authStyles = (isDark: boolean) => {
  const surface = isDark
    ? Colors.dark.itemBackground
    : Colors.light.itemBackground;
  const text = isDark ? Colors.white : Colors.black;
  const secondaryText = isDark ? Colors.lightGray : Colors.darkGray;
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    keyboardView: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 12,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      gap: 32,
    },
    header: {
      gap: 8,
    },
    kicker: {
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: Colors.midTone,
      textAlign: "center",
      textTransform: "uppercase",
    },
    title: {
      fontFamily: Fonts.BOLD,
      fontSize: 34,
      color: text,
      textAlign: "center",
    },
    subtitle: {
      paddingHorizontal: 24,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: secondaryText,
      textAlign: "center",
    },
    form: {
      gap: 12,
    },
    field: {
      gap: 4,
    },
    input: {
      flexDirection: "row",
      alignItems: "center",
      height: 54,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: border,
      borderRadius: 8,
      backgroundColor: surface,
    },
    inputError: {
      borderColor: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    inputText: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: text,
    },
    codeInputText: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 22,
      letterSpacing: 8,
      textAlign: "center",
    },
    helperText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: secondaryText,
      textAlign: "center",
    },
    errorText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
      textAlign: "center",
    },
    fieldErrorText: {
      paddingHorizontal: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    successText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.dark.limeGreen : Colors.light.green,
      textAlign: "center",
    },
    button: {
      marginTop: 8,
    },
    linkButton: {
      alignSelf: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    linkText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: Colors.midTone,
    },
    disabledLinkText: {
      opacity: 0.6,
    },
  });
};
