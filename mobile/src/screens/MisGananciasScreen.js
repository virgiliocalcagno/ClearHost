import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBilletera } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

export default function MisGananciasScreen({ route, navigation }) {
  const { staff } = route.params;
  const [billetera, setBilletera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarBilletera = async () => {
    try {
      const data = await getBilletera(staff.id);
      setBilletera(data);
    } catch (error) {
      console.error('Error cargando billetera:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarBilletera();
  }, [staff.id]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarBilletera();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <StatusBar barStyle="dark-content" />

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Saldo Disponible</Text>
        <Text style={styles.walletAmount}>
          {billetera?.moneda || '$'} {billetera?.saldo_neto?.toLocaleString() || '0'}
        </Text>
        <View style={styles.walletDivider} />
        <View style={styles.walletStats}>
          <View>
            <Text style={styles.statLabel}>Total Ganado</Text>
            <Text style={styles.statValueGreen}>+ {billetera?.total_ganado?.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View>
            <Text style={styles.statLabel}>Adelantos</Text>
            <Text style={styles.statValueRed}>- {billetera?.total_adelantos?.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* History Sections */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Desglose de Tareas</Text>
      </View>

      <View style={styles.historyCard}>
        {billetera?.historial_tareas?.length === 0 ? (
          <Text style={styles.emptyText}>No hay tareas verificadas con pago aún.</Text>
        ) : (
          billetera?.historial_tareas?.map((item, index) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyName}>{item.tipo || 'Limpieza'}</Text>
                <Text style={styles.historySub}>{item.propiedad?.nombre || 'Propiedad'}</Text>
                <Text style={styles.historyDate}>{new Date(item.fecha).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.historyAmount}>+ {item.pago?.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Adelantos Recibidos</Text>
      </View>

      <View style={[styles.historyCard, { marginBottom: 40 }]}>
        {billetera?.historial_adelantos?.length === 0 ? (
          <Text style={styles.emptyText}>No has solicitado adelantos.</Text>
        ) : (
          billetera?.historial_adelantos?.map((item, index) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: COLORS.errorLight }]}>
                <Ionicons name="arrow-down-circle" size={20} color={COLORS.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyName}>Adelanto / Préstamo</Text>
                <Text style={styles.historySub}>{item.notas || 'Sin notas'}</Text>
                <Text style={styles.historyDate}>{new Date(item.fecha).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.historyAmount, { color: COLORS.error }]}>- {item.monto?.toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCard: {
    backgroundColor: COLORS.text, // Dark mode for balance card
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingVertical: SPACING.xxl,
    ...SHADOWS.card,
    marginBottom: SPACING.xl,
  },
  walletLabel: {
    ...FONTS.caption,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  walletAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.surface,
    marginTop: SPACING.xs,
  },
  walletDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: SPACING.xl,
  },
  walletStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#374151',
  },
  statLabel: {
    ...FONTS.small,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
    textAlign: 'center',
  },
  statValueRed: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.error,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h3,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.soft,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  historyName: {
    ...FONTS.bodyMedium,
  },
  historySub: {
    ...FONTS.caption,
    fontSize: 12,
  },
  historyDate: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyText: {
    ...FONTS.caption,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
});
