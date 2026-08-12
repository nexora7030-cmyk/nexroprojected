import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Alert,
} from 'react-native';

import {Ionicons} from '@react-native-vector-icons/ionicons';

import Theme from '../../core/theme/theme';
import GlassCard from './Card/GlassCard';
import PressableScale from './animations/PressableScale';

interface SupportOption {
  icon: string;
  title: string;
  value: string;
  onPress: () => void;
}

interface SupportSheetProps {
  visible: boolean;
  onClose: () => void;
}

const openLink = async (
  url: string,
  appName: string,
  checkSupported = true,
) => {
  try {
    if (checkSupported) {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          `${appName} Not Available`,
          `Please install ${appName} to contact support.`,
        );
        return;
      }
    }

    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open this option. Please try again.');
  }
};

const openMail = () => {
  // mailto is opened directly — canOpenURL needs manifest <queries>
  // entries on Android 11+, so gating on it can false-negative.
  Linking.openURL('mailto:Nexora7030@gmail.com').catch(() => {
    Alert.alert('No Email App', 'No email app found on this device.');
  });
};

const options: SupportOption[] = [
  {
    icon: 'megaphone',
    title: 'NEXORA Official Channel',
    value: 't.me/NEXORA31',
    onPress: () => openLink('https://t.me/NEXORA31', 'Telegram'),
  },
  {
    icon: 'people',
    title: 'NEXORA PUBLIC GROUP',
    value: 't.me/NEXORAPUBLIC1',
    onPress: () => openLink('https://t.me/NEXORAPUBLIC1', 'Telegram'),
  },
  {
    icon: 'mail',
    title: 'Nexora Official Gmail ID',
    value: 'Nexora7030@gmail.com',
    onPress: openMail,
  },
  {
    icon: 'headset',
    title: 'Customer Support',
    value: '@nexora112',
    onPress: () => openLink('https://t.me/nexora112', 'Telegram'),
  },
];

const SupportSheet = ({visible, onClose}: SupportSheetProps) => {
  const handleOption = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <GlassCard style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.title}>Customer Support</Text>

        <Text style={styles.subtitle}>
          Choose a channel to reach us
        </Text>

        {options.map(option => (
          <PressableScale
            key={option.title}
            style={styles.optionRow}
            onPress={() => handleOption(option.onPress)}>
            <View style={styles.optionIcon}>
              <Ionicons
                name={option.icon as any}
                size={20}
                color={Theme.colors.primary}
              />
            </View>

            <View style={styles.optionTextGroup}>
              <Text style={styles.optionTitle}>
                {option.title}
              </Text>

              <Text style={styles.optionValue}>
                {option.value}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={Theme.colors.grey}
            />
          </PressableScale>
        ))}

        <PressableScale
          style={styles.closeButton}
          onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </PressableScale>
      </GlassCard>
    </Modal>
  );
};

export default SupportSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(120,80,40,0.35)',
  },

  sheet: {
    backgroundColor: Theme.colors.cardSolid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },

  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.grey,
    alignSelf: 'center',
    opacity: 0.4,
    marginBottom: 16,
  },

  title: {
    color: Theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  subtitle: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBg,
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  optionTextGroup: {
    flex: 1,
  },

  optionTitle: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  optionValue: {
    color: Theme.colors.primary,
    fontSize: 13,
    marginTop: 3,
  },

  closeButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  closeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
