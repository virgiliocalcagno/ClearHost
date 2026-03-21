/**
 * ClearHost Staff — TaskCard Component.
 * Tarjeta premium con sombras suaves, bordes redondeados, botón CTA.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

const ESTADO_CONFIG = {
  PENDIENTE: { color: COLORS.pendiente, icon: 'time-outline', label: 'En Bolsa', bg: COLORS.warningLight },
  ASIGNADA_NO_CONFIRMADA: { color: COLORS.pendiente, icon: 'alert-circle-outline', label: 'Por Confirmar', bg: COLORS.warningLight },
  ACEPTADA: { color: COLORS.success, icon: 'checkbox-outline', label: 'Confirmada', bg: COLORS.successLight },
  EN_PROGRESO: { color: COLORS.enProgreso, icon: 'play-circle-outline', label: 'En Progreso', bg: COLORS.secondaryLight },
  COMPLETADA: { color: COLORS.completada, icon: 'checkmark-circle', label: 'Completada', bg: COLORS.successLight },
  VERIFICADA: { color: COLORS.verificada, icon: 'shield-checkmark', label: 'Verificada', bg: '#F3F0FF' },
};

export default function TaskCard({ tarea, onPress }) {
  const estado = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.PENDIENTE;
  const progreso = calcularProgreso(tarea);
  const esPendiente = tarea.estado === 'PENDIENTE';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row: badge + laundry */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: estado.bg }]}>
          <Ionicons name={estado.icon} size={14} color={estado.color} />
          <Text style={[styles.badgeText, { color: estado.color }]}>
            {estado.label}
          </Text>
        </View>
        {tarea.requiere_lavado_ropa && (
          <View style={styles.laundryBadge}>
            <Text style={styles.laundryText}>🧺 Lavado</Text>
          </View>
        )}
      </View>

      {/* Property name */}
      <Text style={styles.propertyName} numberOfLines={1}>
        {tarea.nombre_propiedad || 'Propiedad'}
      </Text>

      {/* Address */}
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={14} color={COLORS.textTertiary} />
        <Text style={styles.addressText} numberOfLines={1}>
          {tarea.direccion_propiedad || 'Sin dirección'}
        </Text>
      </View>

      {/* Info pills */}
      <View style={styles.pillsRow}>
        {tarea.hora_inicio && (
          <View style={styles.pill}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.pillText}>{tarea.hora_inicio}</Text>
          </View>
        )}
        <View style={styles.pill}>
          <Ionicons name="person-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.pillText} numberOfLines={1}>
            {tarea.nombre_huesped || 'Huésped'}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: progreso + '%', backgroundColor: estado.color },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>{progreso}%</Text>
      </View>

      {/* CTA Button */}
      {tarea.estado === 'ASIGNADA_NO_CONFIRMADA' && (
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: COLORS.warning }]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={16} color={COLORS.textInverse} />
          <Text style={styles.ctaText}>Confirmar Tarea</Text>
        </TouchableOpacity>
      )}

      {(tarea.estado === 'PENDIENTE' || tarea.estado === 'ACEPTADA') && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={16} color={COLORS.textInverse} />
          <Text style={styles.ctaText}>Empezar Limpieza</Text>
        </TouchableOpacity>
      )}

      {!esPendiente && (
        <View style={styles.continueRow}>
          <Text style={styles.continueText}>
            {calcularProgresoLabel(tarea)}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function calcularProgreso(tarea) {
  if (tarea.estado === 'COMPLETADA' || tarea.estado === 'VERIFICADA') return 100;
  if (!tarea.checklist || tarea.checklist.length === 0) return 0;
  const completados = tarea.checklist.filter((i) => i.completado).length;
  return Math.round((completados / tarea.checklist.length) * 100);
}

function calcularProgresoLabel(tarea) {
  if (tarea.estado === 'COMPLETADA') return 'Clean & Ready ✅';
  if (tarea.estado === 'VERIFICADA') return 'Verificada ✅';
  if (!tarea.checklist || tarea.checklist.length === 0) return 'Ver detalles';
  const completados = tarea.checklist.filter((i) => i.completado).length;
  return `${completados}/${tarea.checklist.length} completados`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  laundryBadge: {
    backgroundColor: '#F5F0FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  laundryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  propertyName: {
    ...FONTS.h3,
    marginBottom: SPACING.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  addressText: {
    ...FONTS.caption,
    flex: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  pillText: {
    ...FONTS.small,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 2,
    ...SHADOWS.button,
  },
  ctaText: {
    ...FONTS.buttonSmall,
    color: COLORS.textInverse,
  },
  continueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueText: {
    ...FONTS.caption,
  },
});
