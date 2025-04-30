// Declarações de módulos para bibliotecas sem tipos disponíveis

// // Declaração para react-native (caso o módulo não seja encontrado)
// declare module 'react-native' {
//   export * from '@types/react-native';
// }

declare module 'react-native-paper' {
  export const Text: any;
  export const Card: any;
  export const Button: any;
  export const ActivityIndicator: any;
  export const Divider: any;
  export const Chip: any;
  export const Portal: any;
  export const Modal: any;
  export const TextInput: any;
  export const Snackbar: any;
  export const RadioButton: any;
  export const Provider: any;
  export const DefaultTheme: any;
}

declare module 'react-native-safe-area-context' {
  export const SafeAreaView: any;
  export const SafeAreaProvider: any;
}

declare module '@expo/vector-icons' {
  export const Ionicons: any;
}

declare module 'expo-file-system' {
  export const documentDirectory: string;
  export function downloadAsync(uri: string, fileUri: string): Promise<{ uri: string }>;
}

declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string): Promise<void>;
}

declare module 'react-native-mask-text' {
  export const MaskedTextInput: any;
}

// Declaração para expo-clipboard
declare module 'expo-clipboard' {
  export function setStringAsync(text: string): Promise<void>;
  export function getStringAsync(): Promise<string>;
  export function hasStringAsync(): Promise<boolean>;
}

// Declaração para @react-navigation/native
declare module '@react-navigation/native' {
  export function useNavigation(): {
    navigate: (routeName: string, params?: any) => void;
    goBack: () => void;
    reset: (state: any) => void;
    setParams: (params: any) => void;
    dispatch: (action: any) => void;
    isFocused: () => boolean;
    addListener: (type: string, callback: () => void) => () => void;
  };
  
  export function useFocusEffect(effect: () => (() => void) | undefined): void;
  export function useRoute(): any;
  export function useIsFocused(): boolean;
  export const NavigationContainer: any;
  export type NavigationProp<ParamList> = any;
  export type RouteProp<ParamList, RouteName extends keyof ParamList> = any;
  export type ParamListBase = Record<string, object | undefined>;
  export type NavigationState = {
    index: number;
    routes: { name: string; key: string }[];
  };
}

// Declaração para @react-navigation/stack
declare module '@react-navigation/stack' {
  import { ComponentType } from 'react';
  
  export function createStackNavigator(): {
    Navigator: ComponentType<any>;
    Screen: ComponentType<any>;
  };
  
  export type StackNavigationProp<ParamList, RouteName extends keyof ParamList = string> = {
    navigate: (routeName: string, params?: any) => void;
    goBack: () => void;
    reset: (state: any) => void;
    setParams: (params: any) => void;
    dispatch: (action: any) => void;
    isFocused: () => boolean;
    addListener: (type: string, callback: () => void) => () => void;
  };
}

// Declaração para @react-navigation/native-stack
declare module '@react-navigation/native-stack' {
  import { ComponentType } from 'react';
  
  export function createNativeStackNavigator(): {
    Navigator: ComponentType<any>;
    Screen: ComponentType<any>;
  };
  
  export type NativeStackNavigationProp<ParamList, RouteName extends keyof ParamList = string> = any;
}

// Declaração para @react-navigation/bottom-tabs
declare module '@react-navigation/bottom-tabs' {
  import { ComponentType } from 'react';
  
  export function createBottomTabNavigator(): {
    Navigator: ComponentType<any>;
    Screen: ComponentType<any>;
  };
}

// Declaração para react-native-paper
declare module 'react-native-paper' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewStyle, TextStyle, StyleProp } from 'react-native';

  export const useTheme: () => {
    colors: {
      primary: string;
      background: string;
      surface: string;
      accent: string;
      error: string;
      text: string;
      onSurface: string;
      disabled: string;
      placeholder: string;
      backdrop: string;
      notification: string;
    };
  };

  export interface CardProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    mode?: 'elevated' | 'outlined';
    elevation?: number;
    onPress?: () => void;
    onLongPress?: () => void;
    content?: ReactNode;
  }

  export const Card: ComponentType<CardProps> & {
    Content: ComponentType<{
      children?: ReactNode;
      style?: StyleProp<ViewStyle>;
    }>;
    Actions: ComponentType<{
      children?: ReactNode;
      style?: StyleProp<ViewStyle>;
    }>;
    Cover: ComponentType<{
      source: { uri: string } | number;
      style?: StyleProp<ViewStyle>;
    }>;
    Title: ComponentType<{
      title?: string;
      subtitle?: string;
      left?: ReactNode;
      style?: StyleProp<TextStyle>;
    }>;
  };

  export interface ChipProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    mode?: 'flat' | 'outlined';
    selected?: boolean;
    disabled?: boolean;
    onPress?: () => void;
    onClose?: () => void;
    icon?: ReactNode | ((props: { size: number }) => ReactNode) | string;
    selectedColor?: string;
    textStyle?: StyleProp<TextStyle>;
  }

  export const Chip: ComponentType<ChipProps>;

  export interface ButtonProps {
    mode?: 'text' | 'outlined' | 'contained';
    compact?: boolean;
    dark?: boolean;
    loading?: boolean;
    icon?: string | ((props: { size: number, color: string }) => ReactNode);
    color?: string;
    disabled?: boolean;
    uppercase?: boolean;
    accessibilityLabel?: string;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    children?: ReactNode;
  }

  export const Button: ComponentType<ButtonProps>;

  export interface TextProps {
    style?: StyleProp<TextStyle>;
    children?: ReactNode;
    variant?: 'displayLarge' | 'displayMedium' | 'displaySmall' | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' | 'titleLarge' | 'titleMedium' | 'titleSmall' | 'labelLarge' | 'labelMedium' | 'labelSmall' | 'bodyLarge' | 'bodyMedium' | 'bodySmall';
  }

  export const Text: ComponentType<TextProps>;

  export interface DividerProps {
    style?: StyleProp<ViewStyle>;
    inset?: boolean;
    bold?: boolean;
    horizontalInset?: boolean;
  }

  export const Divider: ComponentType<DividerProps>;

  export interface ActivityIndicatorProps {
    animating?: boolean;
    color?: string;
    size?: 'small' | 'large' | number;
    style?: StyleProp<ViewStyle>;
  }

  export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;

  export interface ParagraphProps {
    style?: StyleProp<TextStyle>;
    children?: ReactNode;
  }

  export const Paragraph: ComponentType<ParagraphProps>;

  export interface TitleProps {
    style?: StyleProp<TextStyle>;
    children?: ReactNode;
  }

  export const Title: ComponentType<TitleProps>;
}
