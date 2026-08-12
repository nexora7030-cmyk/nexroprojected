import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import { Ionicons } from '@react-native-vector-icons/ionicons';

import DashboardScreen from '../../features/dashboard/screens/DashboardScreen';
import PlansScreen from '../../features/plans/screens/PlansScreen';
import WalletScreen from '../../features/wallet/screens/WalletScreen';
import ProfileScreen from '../../features/profile/screens/ProfileScreen';
import UsdtDepositScreen from '../../features/wallet/screens/UsdtDepositScreen';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import PressableScale from '../../shared/components/animations/PressableScale';
import Theme from '../../core/theme/theme';
import GlassCard from '../../shared/components/Card/GlassCard';

const Tab = createBottomTabNavigator();

const getIconName = (
  routeName: string,
  isFocused: boolean,
) => {
  switch (routeName) {
    case 'Home':
      return isFocused ? 'home' : 'home-outline';

    case 'Plans':
      return isFocused ? 'grid' : 'grid-outline';

    case 'Wallet':
      return isFocused ? 'wallet' : 'wallet-outline';

    case 'USDT':
      return isFocused ? 'cash' : 'cash-outline';

    case 'Profile':
      return isFocused ? 'person' : 'person-outline';

    default:
      return 'ellipse-outline';
  }
};

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, {bottom: insets.bottom + 14}]}>
      <GlassCard style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key].options;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="button"
              accessibilityState={
                isFocused ? { selected: true } : {}
              }
              accessibilityLabel={
                options.tabBarAccessibilityLabel
              }
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[
                styles.tabButton,
                isFocused && styles.activeTabButton,
              ]}
            >
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={isFocused ? 23 : 22}
                color={isFocused ? '#FFFFFF' : '#5A4632'}
              />

              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isFocused && styles.activeTabLabel,
                ]}
              >
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </GlassCard>
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: {backgroundColor: 'transparent'},
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
      />

      <Tab.Screen
        name="Plans"
        component={PlansScreen}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
      />
      <Tab.Screen
        name="USDT"
        component={UsdtDepositScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
  },

  tabBarContainer: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,250,240,0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(160,110,50,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 9,

    elevation: 14,

    shadowColor: '#8A6A4B',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },

  tabButton: {
    flex: 1,
    height: 52,
    marginHorizontal: 3,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeTabButton: {
    flex: 1.35,
    flexDirection: 'row',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#4A1803',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 7,
  },

  tabLabel: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.text,
  },

  activeTabLabel: {
    marginTop: 0,
    marginLeft: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BottomTabNavigator;