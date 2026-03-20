/**
 * ClearHost Staff — Navegación principal.
 * Light theme, Material Design 3 inspired.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import CalendarioScreen from '../screens/CalendarioScreen';
import TareaDetalleScreen from '../screens/TareaDetalleScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import AuditoriaScreen from '../screens/AuditoriaScreen';
import CamaraScreen from '../screens/CamaraScreen';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.surface,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.primary,
        },
      }}
    >
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.surface,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Calendario"
          component={CalendarioScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TareaDetalle"
          component={TareaDetalleScreen}
          options={{ title: 'Detalle' }}
        />
        <Stack.Screen
          name="Checklist"
          component={ChecklistScreen}
          options={{ title: 'Checklist' }}
        />
        <Stack.Screen
          name="Auditoria"
          component={AuditoriaScreen}
          options={{ title: 'Inventario' }}
        />
        <Stack.Screen
          name="Camara"
          component={CamaraScreen}
          options={{ title: 'Evidencia' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
