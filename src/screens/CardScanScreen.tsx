import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { parseCardText, CardOcrResult } from '../utils/cardOcr';
import { RADIUS } from '../constants/theme';

type CardScanScreenProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (result: CardOcrResult) => void;
};

export default function CardScanScreen({ visible, onClose, onScanned }: CardScanScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && !hasPermission) {
      requestPermission();
    }
    if (visible) setError('');
  }, [visible, hasPermission, requestPermission]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    setError('');
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      const result = await TextRecognition.recognize(`file://${photo.path}`);
      const parsed = parseCardText(result.text);
      if (!parsed.cardNumber) {
        setError("Couldn't read a card number — try again with better light, or enter details manually.");
        setCapturing(false);
        return;
      }
      onScanned(parsed);
    } catch (e) {
      setError('Scan failed. Try again or enter details manually.');
      setCapturing(false);
    }
  }, [capturing, onScanned]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {device && hasPermission ? (
          <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={visible} photo />
        ) : (
          <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
            <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.permissionText, { color: colors.text }]}>
              {hasPermission ? 'No camera available on this device.' : 'Camera permission is needed to scan a card.'}
            </Text>
          </View>
        )}

        <View style={[styles.overlay, StyleSheet.absoluteFillObject]} pointerEvents="box-none">
          <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.hint}>Align the card inside the frame</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.frameWrap} pointerEvents="none">
            <View style={styles.frame} />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
            <TouchableOpacity
              style={[styles.captureBtn, { backgroundColor: colors.accent }]}
              onPress={handleCapture}
              disabled={capturing || !device || !hasPermission}
              activeOpacity={0.85}>
              {capturing ? <ActivityIndicator color="#00110E" /> : <Ionicons name="camera" size={28} color="#00110E" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  permissionText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  overlay: { justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#fff', fontSize: 13, fontWeight: '600' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '85%', aspectRatio: 1.586, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
  errorBox: { marginHorizontal: 24, marginBottom: 12, backgroundColor: 'rgba(229,72,77,0.9)', borderRadius: RADIUS.md, padding: 12 },
  errorText: { color: '#fff', fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  bottomBar: { alignItems: 'center' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
