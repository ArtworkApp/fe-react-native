import { Link } from 'expo-router';
import { Controller, type Control } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthMode, FormValues } from '../auth/form';
import type { useAuthFormWorkflow } from '../auth/useAuthFormWorkflow';

interface AuthFieldProps {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  error?: string;
  hint?: string;
  inputProps: TextInputProps;
}

interface AuthFormViewProps {
  mode: AuthMode;
  workflow: ReturnType<typeof useAuthFormWorkflow>;
}

function AuthField({ control, name, label, error, hint, inputProps }: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TextInput
            {...inputProps}
            accessibilityLabel={label}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            style={styles.input}
            value={field.value}
          />
        )}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function AuthFormView({ mode, workflow }: AuthFormViewProps) {
  const isRegister = mode === 'register';
  const title = isRegister ? 'Create account' : 'Sign in';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.brand}>ArtworkApp</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <AuthField
            control={workflow.control}
            name="email"
            label="Email"
            error={workflow.errors.email?.message}
            inputProps={{
              autoCapitalize: 'none', autoComplete: 'email', autoCorrect: false,
              keyboardType: 'email-address', returnKeyType: 'next',
              textContentType: 'emailAddress',
            }}
          />
          <AuthField
            control={workflow.control}
            name="password"
            label="Password"
            error={workflow.errors.password?.message}
            hint="Use at least 12 characters."
            inputProps={{
              autoCapitalize: 'none',
              autoComplete: isRegister ? 'new-password' : 'current-password',
              secureTextEntry: true,
              textContentType: isRegister ? 'newPassword' : 'password',
            }}
          />
          {isRegister ? (
            <AuthField
              control={workflow.control}
              name="confirmPassword"
              label="Confirm password"
              error={workflow.errors.confirmPassword?.message}
              inputProps={{
                autoCapitalize: 'none', autoComplete: 'new-password',
                secureTextEntry: true, textContentType: 'newPassword',
              }}
            />
          ) : null}
          {workflow.requestError ? (
            <Text accessibilityRole="alert" style={styles.error}>{workflow.requestError}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={workflow.isSubmitting}
            onPress={() => { void workflow.submit(); }}
            style={[styles.button, workflow.isSubmitting && styles.disabled]}
          >
            <Text style={styles.buttonText}>
              {workflow.isSubmitting ? 'Please wait…' : title}
            </Text>
          </Pressable>
          <Link href={isRegister ? '/(auth)/login' : '/(auth)/register'} style={styles.link}>
            {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fafaf9' },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brand: { color: '#57534e', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#1c1917', fontSize: 30, fontWeight: '700', marginTop: 16 },
  field: { marginTop: 20 },
  label: { color: '#1c1917', fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderColor: '#d6d3d1', borderRadius: 10,
    borderWidth: 1, color: '#1c1917', fontSize: 16, marginTop: 8, minHeight: 48,
    paddingHorizontal: 14 },
  hint: { color: '#57534e', fontSize: 13, marginTop: 6 },
  error: { color: '#b91c1c', fontSize: 14, marginTop: 6 },
  button: { alignItems: 'center', backgroundColor: '#1c1917', borderRadius: 10,
    justifyContent: 'center', minHeight: 48, marginTop: 28 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.55 },
  link: { color: '#44403c', fontSize: 14, marginTop: 24, textAlign: 'center' },
});
