/**
 * ClearHost Staff — Evidencia Fotográfica.
 * Placeholders atractivos con bordes punteados e iconos grandes de cámara.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { subirFoto } from '../services/api';
import { COLORS, SHADOWS, RADIUS, SPACING, FONTS } from '../theme';

export default function CamaraScreen({ navigation, route }) {
  const { tarea } = route.params;
  const [fotosAntes, setFotosAntes] = useState(tarea.fotos_antes || []);
  const [fotosDespues, setFotosDespues] = useState(tarea.fotos_despues || []);
  const [uploading, setUploading] = useState(false);

  const tomarFoto = async (tipo) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await subirFotoAlServidor(tipo, result.assets[0].uri);
    }
  };

  const seleccionarDeGaleria = async (tipo) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      for (const asset of result.assets) {
        await subirFotoAlServidor(tipo, asset.uri);
      }
    }
  };

  const subirFotoAlServidor = async (tipo, uri) => {
    setUploading(true);
    try {
      const data = await subirFoto(tarea.id, tipo, uri);
      setFotosAntes(data.fotos_antes || []);
      setFotosDespues(data.fotos_despues || []);
    } catch (error) {
      const msg = error.response?.data?.detail || 'Error al subir foto';
      Alert.alert('Error', msg);
    } finally {
      setUploading(false);
    }
  };

  const mostrarOpciones = (tipo) => {
    Alert.alert(
      tipo === 'antes' ? '📸 Foto — ANTES' : '📸 Foto — DESPUÉS',
      '¿Cómo quieres agregar la foto?',
      [
        { text: 'Tomar Foto', onPress: () => tomarFoto(tipo) },
        { text: 'Galería', onPress: () => seleccionarDeGaleria(tipo) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const renderFotoSection = (titulo, fotos, tipo, accentColor, accentBg, icon) => {
    const required = fotos.length < 1;

    return (
      <View style={styles.section}>
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: accentBg }]}>
            <Ionicons name={icon} size={18} color={accentColor} />
          </View>
          <View style={styles.sectionTitleArea}>
            <Text style={styles.sectionTitle}>{titulo}</Text>
            <Text style={styles.sectionCount}>
              {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
            </Text>
          </View>
        </View>

        {/* Photos grid */}
        <View style={styles.photosGrid}>
          {fotos.map((foto, index) => (
            <View key={index} style={styles.photoThumb}>
              <Image
                source={{ uri: foto.url }}
                style={styles.photoImage}
              />
              <Text style={styles.photoTime}>
                {new Date(foto.uploaded_at).toLocaleTimeString('es-MX', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          ))}

          {/* Add photo placeholder — big dashed border with camera icon */}
          <TouchableOpacity
            style={[styles.addPhoto, { borderColor: accentColor }]}
            onPress={() => mostrarOpciones(tipo)}
            disabled={uploading}
            activeOpacity={0.7}
          >
            <View style={[styles.addPhotoCircle, { backgroundColor: accentBg }]}>
              <Ionicons name="camera" size={28} color={accentColor} />
            </View>
            <Text style={[styles.addPhotoText, { color: accentColor }]}>
              Agregar foto
            </Text>
          </TouchableOpacity>
        </View>

        {/* Requirement alert */}
        {required && (
          <View style={styles.requirementBar}>
            <Ionicons name="information-circle" size={16} color={COLORS.warning} />
            <Text style={styles.requirementText}>
              Mínimo 1 foto requerida
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* Upload banner */}
      {uploading && (
        <View style={styles.uploadBar}>
          <ActivityIndicator color={COLORS.primary} size="small" />
          <Text style={styles.uploadText}>Subiendo foto...</Text>
        </View>
      )}

      {/* ANTES */}
      {renderFotoSection(
        'Fotos ANTES de limpiar',
        fotosAntes,
        'antes',
        COLORS.warning,
        COLORS.warningLight,
        'time-outline'
      )}

      {/* DESPUÉS */}
      {renderFotoSection(
        'Fotos DESPUÉS de limpiar',
        fotosDespues,
        'despues',
        COLORS.success,
        COLORS.successLight,
        'checkmark-circle-outline'
      )}

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Las fotos antes y después son obligatorias para marcar la propiedad como "Clean & Ready".
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl + 20,
  },
  uploadBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  uploadText: {
    ...FONTS.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleArea: {
    flex: 1,
  },
  sectionTitle: {
    ...FONTS.bodyMedium,
    fontWeight: '700',
  },
  sectionCount: {
    ...FONTS.small,
    marginTop: 1,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  photoThumb: {
    alignItems: 'center',
  },
  photoImage: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  photoTime: {
    ...FONTS.small,
    fontSize: 10,
    marginTop: SPACING.xs,
  },
  addPhoto: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addPhotoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '700',
  },
  requirementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.warningLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  requirementText: {
    ...FONTS.caption,
    color: COLORS.warning,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  infoText: {
    ...FONTS.caption,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 20,
  },
});
