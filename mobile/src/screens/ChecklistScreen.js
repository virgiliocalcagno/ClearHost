/**
 * ClearHost Staff — Checklist Digital.
 * Checkboxes grandes con feedback visual, barra de progreso circular.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { actualizarChecklist } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

export default function ChecklistScreen({ navigation, route }) {
  const { tarea } = route.params;
  const [items, setItems] = useState(tarea.checklist || []);
  const [saving, setSaving] = useState(false);

  const toggleItem = (index) => {
    const updated = [...items];
    updated[index] = { ...updated[index], completado: !updated[index].completado };
    setItems(updated);
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await actualizarChecklist(tarea.id, items);
      Alert.alert('✅ Guardado', 'Checklist actualizado correctamente');
      navigation.goBack();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al guardar';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const completados = items.filter((i) => i.completado).length;
  const progreso = items.length > 0 ? Math.round((completados / items.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Progress header */}
      <View style={styles.progressCard}>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPercent}>{progreso}%</Text>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>Progreso</Text>
          <Text style={styles.progressSubtitle}>
            {completados} de {items.length} tareas completadas
          </Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progreso}%`,
                  backgroundColor: progreso === 100 ? COLORS.success : COLORS.primary,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Checklist items */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.itemCard,
              item.completado && styles.itemCardDone,
            ]}
            onPress={() => toggleItem(index)}
            activeOpacity={0.7}
          >
            {/* Custom checkbox */}
            <View
              style={[
                styles.checkbox,
                item.completado && styles.checkboxDone,
              ]}
            >
              {item.completado && (
                <Ionicons name="checkmark" size={18} color={COLORS.textInverse} />
              )}
            </View>

            {/* Item text */}
            <View style={styles.itemTextArea}>
              <Text
                style={[
                  styles.itemText,
                  item.completado && styles.itemTextDone,
                ]}
              >
                {item.item}
              </Text>
              {item.requerido && !item.completado && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Obligatorio</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {items.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="list-outline" size={40} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyText}>Sin items en el checklist</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed save button */}
      <View style={styles.footer}>
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
              <Text style={styles.saveText}>Guardar Checklist</Text>
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
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: SPACING.xl,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.xl,
    ...SHADOWS.card,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    ...FONTS.h3,
    marginBottom: 2,
  },
  progressSubtitle: {
    ...FONTS.caption,
    marginBottom: SPACING.sm,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  list: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.lg,
    ...SHADOWS.soft,
  },
  itemCardDone: {
    backgroundColor: COLORS.successLight,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  itemTextArea: {
    flex: 1,
  },
  itemText: {
    ...FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textTertiary,
  },
  requiredBadge: {
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  requiredText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
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
