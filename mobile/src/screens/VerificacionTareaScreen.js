import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, Image, 
    TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTareaDetalle, verificarTarea } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

export default function VerificacionTareaScreen({ route, navigation }) {
    const { tareaId } = route.params;
    const [tarea, setTarea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getTareaDetalle(tareaId);
            setTarea(data);
        } catch (e) {
            Alert.alert('Error', 'No se pudo cargar la información de la tarea');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async () => {
        setVerifying(true);
        try {
            await verificarTarea(tareaId);
            Alert.alert('Éxito', 'Tarea verificada. La propiedad está lista para el check-in.');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'No se pudo verificar la tarea');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
    );

    const auditoria = tarea.auditoria_activos || [];
    const fotos = [
        { uri: tarea.foto_sala_url, label: 'Sala' },
        { uri: tarea.foto_habitacion_url, label: 'Habitación' },
        { uri: tarea.foto_bano_url, label: 'Baño' },
        { uri: tarea.foto_cocina_url, label: 'Cocina' },
        { uri: tarea.foto_extra_url, label: 'Extra' },
    ].filter(f => f.uri);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{tarea.nombre_propiedad}</Text>
                <Text style={styles.subtitle}>Check-out: {tarea.check_out}</Text>
            </View>

            {/* Evidencia Fotográfica */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📸 Evidencia Fotográfica</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                    {fotos.length === 0 ? (
                        <Text style={styles.emptyText}>No hay fotos registradas</Text>
                    ) : fotos.map((f, i) => (
                        <View key={i} style={styles.photoContainer}>
                            <Image source={{ uri: f.uri }} style={styles.photo} />
                            <Text style={styles.photoLabel}>{f.label}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Auditoría de Inventario */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📦 Auditoría de Inventario</Text>
                {auditoria.length === 0 ? (
                    <Text style={styles.emptyText}>No se reportaron movimientos de inventario</Text>
                ) : (
                    auditoria.map((item, i) => {
                        const isAlert = item.estado === 'FALTANTE' || item.estado === 'DAÑADO';
                        return (
                            <View key={i} style={[styles.itemCard, isAlert && styles.itemAlert]}>
                                <View>
                                    <Text style={styles.itemName}>{item.articulo}</Text>
                                    <Text style={styles.itemDetail}>Cantidad: {item.cantidad}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: isAlert ? COLORS.error : COLORS.success }]}>
                                    <Text style={styles.statusText}>{item.estado}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            {/* Acciones */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.approveButton, verifying && styles.disabled]} 
                    onPress={handleAprobar}
                    disabled={verifying}
                >
                    {verifying ? <ActivityIndicator color="white" /> : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                            <Text style={styles.approveButtonText}>Aprobar Check-in</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { ...FONTS.h2, color: COLORS.text },
    subtitle: { ...FONTS.body, color: COLORS.textSecondary },
    section: { padding: 20 },
    sectionTitle: { ...FONTS.h3, marginBottom: 15 },
    photoList: { flexDirection: 'row' },
    photoContainer: { marginRight: 15, alignItems: 'center' },
    photo: { width: 150, height: 200, borderRadius: 12, backgroundColor: '#eee' },
    photoLabel: { marginTop: 5, fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
    itemCard: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: COLORS.surface, 
        borderRadius: 12, 
        marginBottom: 10,
        ...SHADOWS.card 
    },
    itemAlert: { borderColor: COLORS.error, borderWidth: 1 },
    itemName: { ...FONTS.body, fontWeight: '700' },
    itemDetail: { ...FONTS.small, color: COLORS.textTertiary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { color: 'white', fontSize: 11, fontWeight: '800' },
    footer: { padding: 20, marginBottom: 30 },
    approveButton: { 
        backgroundColor: COLORS.primary, 
        height: 56, 
        borderRadius: 16, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 10,
        ...SHADOWS.button 
    },
    approveButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
    disabled: { opacity: 0.7 },
    emptyText: { color: COLORS.textTertiary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 }
});
