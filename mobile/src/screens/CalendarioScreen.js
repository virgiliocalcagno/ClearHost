/**
 * ClearHost Staff — Dashboard de Tareas del Día.
 * Cards premium con resumen visual y pull-to-refresh.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTareasDeHoy, logout } from '../services/api';
import TaskCard from '../components/TaskCard';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

export default function CalendarioScreen({ navigation, route }) {
  const { staff } = route.params;
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarTareas = async () => {
    try {
      const data = await getTareasDeHoy(staff.id);
      setTareas(data);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => { cargarTareas(); }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarTareas();
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const hoy = new Date();
  const fechaFormateada = hoy.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const pendientes = tareas.filter((t) => t.estado === 'PENDIENTE').length;
  const enProgreso = tareas.filter((t) => t.estado === 'EN_PROGRESO').length;
  const completadas = tareas.filter(
    (t) => t.estado === 'COMPLETADA' || t.estado === 'VERIFICADA'
  ).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {staff.nombre?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hola, {staff.nombre} 👋</Text>
            <Text style={styles.fecha}>{fechaFormateada}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.pendiente }]}>
          <Text style={[styles.summaryNumber, { color: COLORS.pendiente }]}>{pendientes}</Text>
          <Text style={styles.summaryLabel}>Pendientes</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.enProgreso }]}>
          <Text style={[styles.summaryNumber, { color: COLORS.enProgreso }]}>{enProgreso}</Text>
          <Text style={styles.summaryLabel}>En Progreso</Text>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: COLORS.completada }]}>
          <Text style={[styles.summaryNumber, { color: COLORS.completada }]}>{completadas}</Text>
          <Text style={styles.summaryLabel}>Listas</Text>
        </View>
      </View>

      {/* Section label */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tareas de hoy</Text>
        <Text style={styles.sectionCount}>{tareas.length}</Text>
      </View>

      {/* Task List */}
      {tareas.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark-done-circle" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyText}>¡Día libre!</Text>
          <Text style={styles.emptySubtext}>No tienes tareas asignadas para hoy</Text>
        </View>
      ) : (
        <FlatList
          data={tareas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              tarea={item}
              onPress={() => navigation.navigate('TareaDetalle', { tarea: item })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl + 16,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  greeting: {
    ...FONTS.h3,
  },
  fecha: {
    ...FONTS.caption,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 3,
    ...SHADOWS.card,
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  summaryLabel: {
    ...FONTS.small,
    marginTop: SPACING.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
  },
  sectionCount: {
    ...FONTS.caption,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    fontWeight: '700',
    overflow: 'hidden',
  },
  list: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emptyText: {
    ...FONTS.h2,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    ...FONTS.caption,
  },
});
