/**
 * ClearHost Staff — Detalle de Tarea.
 * Vista hub con acciones y botón fijo "Clean & Ready" al fondo.
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getTareaDetalle, completarTarea, aceptarTarea } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

const ESTADO_CONFIG = {
  PENDIENTE: { color: COLORS.pendiente, label: 'En Bolsa', bg: COLORS.warningLight },
  ASIGNADA_NO_CONFIRMADA: { color: COLORS.pendiente, label: 'Por Confirmar', bg: COLORS.warningLight },
  ACEPTADA: { color: COLORS.success, label: 'Confirmada', bg: COLORS.successLight },
  EN_PROGRESO: { color: COLORS.enProgreso, label: 'En Progreso', bg: COLORS.secondaryLight },
  COMPLETADA: { color: COLORS.completada, label: 'Clean & Ready ✅', bg: COLORS.successLight },
  VERIFICADA: { color: COLORS.verificada, label: 'Verificada ✅', bg: '#F3F0FF' },
};

export default function TareaDetalleScreen({ navigation, route }) {
  const [tarea, setTarea] = useState(route.params.tarea);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  useFocusEffect(
    useCallback(() => { recargar(); }, [])
  );

  const recargar = async () => {
    try {
      const data = await getTareaDetalle(tarea.id);
      setTarea(data);
    } catch (e) {
      console.error('Error recargando tarea:', e);
    }
  };

  const handleAceptar = async () => {
    setLoading(true);
    try {
      const data = await aceptarTarea(tarea.id);
      setTarea(data);
      Alert.alert('¡Excelente!', 'Tarea aceptada. Ahora puedes comenzar con la limpieza.');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al aceptar';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletar = async () => {
    Alert.alert(
      '¿Marcar como lista?',
      'Se notificará al administrador que la propiedad está Clean & Ready.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '✅ Confirmar',
          style: 'default',
          onPress: async () => {
            setCompleting(true);
            try {
              const data = await completarTarea(tarea.id);
              setTarea(data);
              Alert.alert('¡Excelente!', 'Propiedad marcada como Clean & Ready.');
            } catch (error) {
              const msg = error.response?.data?.detail || 'Error al completar';
              Alert.alert('Error', msg);
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const estado = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG.PENDIENTE;
  const fotosAntes = tarea.fotos_antes || [];
  const fotosDespues = tarea.fotos_despues || [];
  const checklistItems = tarea.checklist || [];
  const itemsCompletados = checklistItems.filter((i) => i.completado).length;
  const puedeCompletar = tarea.estado !== 'COMPLETADA' && tarea.estado !== 'VERIFICADA';

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Property info card */}
        <View style={styles.propertyCard}>
          <View style={[styles.statusBadge, { backgroundColor: estado.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: estado.color }]} />
            <Text style={[styles.statusText, { color: estado.color }]}>
              {estado.label}
            </Text>
          </View>

          <Text style={styles.propertyName}>
            {tarea.nombre_propiedad || 'Propiedad'}
          </Text>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.addressText}>
              {tarea.direccion_propiedad || 'Sin dirección'}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Huésped</Text>
              <Text style={styles.infoValue}>{tarea.nombre_huesped || '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoBox}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Check-out</Text>
              <Text style={styles.infoValue}>{tarea.check_out || tarea.fecha_programada}</Text>
            </View>
          </View>

          {tarea.requiere_lavado_ropa && (
            <View style={styles.laundryAlert}>
              <Ionicons name="water-outline" size={18} color="#7C3AED" />
              <Text style={styles.laundryText}>
                Requiere lavado de ropa (sábanas y toallas)
              </Text>
            </View>
          )}

          {/* Ganancia por tarea (Muro de Privacidad) */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>Pago por esta tarea</Text>
              <Text style={styles.earningsValue}>
                {tarea.pago_al_staff?.toLocaleString()} {tarea.moneda_tarea}
              </Text>
            </View>
            <View style={styles.earningsIcon}>
              <Ionicons name="cash-outline" size={24} color={COLORS.success} />
            </View>
          </View>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Acciones</Text>

        {/* Checklist */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Checklist', { tarea })}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: COLORS.infoLight }]}>
            <Ionicons name="checkbox-outline" size={22} color={COLORS.info} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Checklist de Limpieza</Text>
            <View style={styles.actionProgressRow}>
              <View style={styles.actionProgressTrack}>
                <View style={[
                  styles.actionProgressFill,
                  { width: checklistItems.length > 0 ? `${(itemsCompletados / checklistItems.length) * 100}%` : '0%' }
                ]} />
              </View>
              <Text style={styles.actionProgressText}>
                {itemsCompletados}/{checklistItems.length}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Audit */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Auditoria', { tarea })}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: COLORS.warningLight }]}>
            <Ionicons name="clipboard-outline" size={22} color={COLORS.warning} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Auditoría de Activos</Text>
            <Text style={styles.actionSubtitle}>Verificar inventario de la propiedad</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Photos */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Camara', { tarea })}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconBox, { backgroundColor: COLORS.primaryLight }]}>
            <Ionicons name="camera-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Fotos de Evidencia</Text>
            <Text style={styles.actionSubtitle}>
              📸 {fotosAntes.length} antes · {fotosDespues.length} después
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Completed banner */}
        {tarea.estado === 'COMPLETADA' && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            <Text style={styles.completedText}>
              Propiedad lista. Esperando verificación del admin.
            </Text>
          </View>
        )}

        {/* Space for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed CTA bottom button */}
      {tarea.estado === 'ASIGNADA_NO_CONFIRMADA' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: COLORS.warning }]}
            onPress={handleAceptar}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="checkbox-outline" size={24} color={COLORS.textInverse} />
                <Text style={styles.ctaText}>Aceptar Tarea (Confirmar)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {puedeCompletar && (tarea.estado === 'ACEPTADA' || tarea.estado === 'EN_PROGRESO') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.ctaButton, completing && styles.ctaDisabled]}
            onPress={handleCompletar}
            disabled={completing}
            activeOpacity={0.85}
          >
            {completing ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={24} color={COLORS.textInverse} />
                <Text style={styles.ctaText}>Marcar como Clean & Ready</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.xl,
  },
  propertyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.card,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  propertyName: {
    ...FONTS.h1,
    marginBottom: SPACING.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  addressText: {
    ...FONTS.caption,
    flex: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  infoLabel: {
    ...FONTS.small,
  },
  infoValue: {
    ...FONTS.bodyMedium,
    fontWeight: '700',
  },
  laundryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    backgroundColor: '#F5F0FF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  laundryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7C3AED',
    flex: 1,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: SPACING.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm + 2,
    gap: SPACING.lg,
    ...SHADOWS.card,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...FONTS.bodyMedium,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...FONTS.small,
    marginTop: 2,
  },
  actionProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs + 2,
  },
  actionProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  actionProgressFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: RADIUS.full,
  },
  actionProgressText: {
    ...FONTS.small,
    fontWeight: '700',
    color: COLORS.info,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.successLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  completedText: {
    ...FONTS.caption,
    color: COLORS.success,
    flex: 1,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl + 4,
    ...SHADOWS.cardHover,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg + 2,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    ...FONTS.button,
    fontSize: 17,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    ...FONTS.small,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 2,
  },
  earningsValue: {
    ...FONTS.h3,
    color: COLORS.success,
  },
  earningsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
