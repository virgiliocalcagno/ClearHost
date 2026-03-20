/**
 * ClearHost Staff — Auditoría de Activos.
 * Verificación de inventario con estados táctiles y diseño limpio.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { actualizarAuditoria } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

const ESTADOS_ACTIVO = ['OK', 'FALTANTE', 'DAÑADO'];
const ESTADO_COLORS = {
  OK: COLORS.success,
  FALTANTE: COLORS.error,
  DAÑADO: COLORS.warning,
};
const ESTADO_ICONS = {
  OK: 'checkmark-circle',
  FALTANTE: 'close-circle',
  DAÑADO: 'warning',
};
const ESTADO_BG = {
  OK: COLORS.successLight,
  FALTANTE: COLORS.errorLight,
  DAÑADO: COLORS.warningLight,
};

export default function AuditoriaScreen({ navigation, route }) {
  const { tarea } = route.params;
  const [activos, setActivos] = useState(tarea.auditoria_activos || []);
  const [saving, setSaving] = useState(false);

  const cambiarEstado = (index) => {
    const updated = [...activos];
    const currentIdx = ESTADOS_ACTIVO.indexOf(updated[index].estado);
    const nextIdx = (currentIdx + 1) % ESTADOS_ACTIVO.length;
    updated[index] = { ...updated[index], estado: ESTADOS_ACTIVO[nextIdx] };
    setActivos(updated);
  };

  const actualizarNotas = (index, notas) => {
    const updated = [...activos];
    updated[index] = { ...updated[index], notas };
    setActivos(updated);
  };

  const actualizarCantidad = (index, cantidad) => {
    const updated = [...activos];
    const num = parseInt(cantidad) || 0;
    updated[index] = { ...updated[index], cantidad_encontrada: num };
    if (num < updated[index].cantidad_esperada) {
      updated[index].estado = 'FALTANTE';
    }
    setActivos(updated);
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await actualizarAuditoria(tarea.id, activos);
      Alert.alert('✅ Guardado', 'Auditoría actualizada correctamente');
      navigation.goBack();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al guardar';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const okCount = activos.filter((a) => a.estado === 'OK').length;
  const problemCount = activos.filter((a) => a.estado !== 'OK').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        <View style={[styles.statCard, { borderTopColor: COLORS.text }]}>
          <Text style={styles.statNum}>{activos.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.success }]}>
          <Text style={[styles.statNum, { color: COLORS.success }]}>{okCount}</Text>
          <Text style={styles.statLabel}>OK</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.error }]}>
          <Text style={[styles.statNum, { color: COLORS.error }]}>{problemCount}</Text>
          <Text style={styles.statLabel}>Problemas</Text>
        </View>
      </View>

      {/* Items */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {activos.map((activo, index) => (
          <View key={index} style={styles.itemCard}>
            {/* Header */}
            <View style={styles.itemHeader}>
              <View style={styles.itemLeft}>
                <View style={[styles.itemIcon, { backgroundColor: ESTADO_BG[activo.estado] }]}>
                  <Ionicons
                    name={ESTADO_ICONS[activo.estado]}
                    size={20}
                    color={ESTADO_COLORS[activo.estado]}
                  />
                </View>
                <Text style={styles.itemName}>{activo.activo}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stateBadge, { backgroundColor: ESTADO_BG[activo.estado] }]}
                onPress={() => cambiarEstado(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.stateBadgeText, { color: ESTADO_COLORS[activo.estado] }]}>
                  {activo.estado}
                </Text>
                <Ionicons name="refresh-outline" size={12} color={ESTADO_COLORS[activo.estado]} />
              </TouchableOpacity>
            </View>

            {/* Quantities */}
            <View style={styles.quantityRow}>
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Esperado</Text>
                <Text style={styles.quantityValue}>{activo.cantidad_esperada}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textTertiary} />
              <View style={styles.quantityBox}>
                <Text style={styles.quantityLabel}>Encontrado</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={String(activo.cantidad_encontrada)}
                  onChangeText={(val) => actualizarCantidad(index, val)}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* Notes for problems */}
            {activo.estado !== 'OK' && (
              <TextInput
                style={styles.notesInput}
                placeholder="Describe el problema..."
                placeholderTextColor={COLORS.textTertiary}
                value={activo.notas || ''}
                onChangeText={(val) => actualizarNotas(index, val)}
                multiline
              />
            )}
          </View>
        ))}

        {activos.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cube-outline" size={40} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Sin activos configurados</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {problemCount > 0 && (
          <View style={styles.warningBar}>
            <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
            <Text style={styles.warningText}>
              {problemCount} activo(s) con problemas
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveDisabled]}
          onPress={guardar}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textInverse} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.textInverse} />
              <Text style={styles.saveText}>Guardar Auditoría</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderTopWidth: 3,
    ...SHADOWS.card,
  },
  statNum: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    ...FONTS.small,
    marginTop: SPACING.xs,
  },
  list: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.soft,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    ...FONTS.bodyMedium,
    fontWeight: '600',
    flex: 1,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  quantityBox: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quantityLabel: {
    ...FONTS.small,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  quantityInput: {
    width: 52,
    height: 40,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  emptyText: {
    ...FONTS.caption,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl + 4,
    ...SHADOWS.cardHover,
  },
  warningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    ...FONTS.caption,
    color: COLORS.warning,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg + 2,
    ...SHADOWS.button,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    ...FONTS.button,
  },
});
