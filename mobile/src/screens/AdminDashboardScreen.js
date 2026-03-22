import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    ActivityIndicator, RefreshControl, FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTodasLasTareas } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

export default function AdminDashboardScreen({ navigation }) {
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const data = await getTodasLasTareas();
            setTareas(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Estadísticas para el "Semáforo"
    const urgentes = tareas.filter(t => t.prioridad === 'ALTA' || t.prioridad === 'EMERGENCIA').length;
    const sinAsignar = tareas.filter(t => t.estado === 'PENDIENTE').length;
    const porVerificar = tareas.filter(t => t.estado === 'CLEAN_AND_READY');

    if (loading && !refreshing) {
        return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color={COLORS.primary} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Centro de Comando</Text>
                    <Text style={styles.subtitle}>Supervisión en tiempo real</Text>
                </View>

                {/* Semáforo de Prioridades */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { borderLeftColor: COLORS.error, borderLeftWidth: 4 }]}>
                        <Text style={styles.statEmoji}>🔴</Text>
                        <Text style={styles.statValue}>{urgentes}</Text>
                        <Text style={styles.statLabel}>Críticas</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: COLORS.warning, borderLeftWidth: 4 }]}>
                        <Text style={styles.statEmoji}>🟡</Text>
                        <Text style={styles.statValue}>{sinAsignar}</Text>
                        <Text style={styles.statLabel}>Sin Asignar</Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: COLORS.success, borderLeftWidth: 4 }]}>
                        <Text style={styles.statEmoji}>🟢</Text>
                        <Text style={styles.statValue}>{porVerificar.length}</Text>
                        <Text style={styles.statLabel}>Por Validar</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📥 Bandeja de Aprobación (Ready)</Text>
                    {porVerificar.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.textTertiary} />
                            <Text style={styles.emptyText}>No hay tareas esperando revisión</Text>
                        </View>
                    ) : (
                        porVerificar.map(t => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={styles.taskCard}
                                onPress={() => navigation.navigate('VerificacionTarea', { tareaId: t.id })}
                            >
                                <View style={styles.taskInfo}>
                                    <Text style={styles.taskProp}>{t.nombre_propiedad}</Text>
                                    <Text style={styles.taskStaff}>Limpiado por: {t.nombre_staff || 'Staff'}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => onRefresh()}
            >
                <Ionicons name="refresh" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { paddingBottom: 100 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 60, backgroundColor: COLORS.surface },
    title: { ...FONTS.h1, color: COLORS.text },
    subtitle: { ...FONTS.body, color: COLORS.textSecondary, marginTop: 4 },
    statsRow: { flexDirection: 'row', padding: 15, justifyContent: 'space-between', gap: 10 },
    statCard: { 
        backgroundColor: COLORS.surface, 
        flex: 1,
        padding: 15, 
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.card
    },
    statEmoji: { fontSize: 20, marginBottom: 5 },
    statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
    statLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' },
    section: { padding: 20 },
    sectionTitle: { ...FONTS.h3, marginBottom: 15 },
    emptyCard: { padding: 40, alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border },
    emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 10, ...FONTS.small },
    taskCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 12,
        ...SHADOWS.card
    },
    taskInfo: { flex: 1 },
    taskProp: { ...FONTS.body, fontWeight: '700' },
    taskStaff: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
    fab: { 
        position: 'absolute', 
        bottom: 30, 
        right: 30, 
        width: 56, 
        height: 56, 
        borderRadius: 28, 
        backgroundColor: COLORS.primary, 
        justifyContent: 'center', 
        alignItems: 'center',
        ...SHADOWS.button 
    },
});
