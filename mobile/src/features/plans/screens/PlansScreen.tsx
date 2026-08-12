import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import Theme from '../../../core/theme/theme';
import api from '../../../core/api/axios';
import FadeInView from '../../../shared/components/animations/FadeInView';
import PressableScale from '../../../shared/components/animations/PressableScale';
import HoverWiggle from '../../../shared/components/animations/HoverWiggle';
import GlassCard from '../../../shared/components/Card/GlassCard';
import RazorpayCheckout from 'react-native-razorpay';
import {purchaseUsingWallet} from '../services/planService';
import {getWalletSummary} from '../../wallet/services/walletService';

interface Plan {
  _id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  price: number;
  duration: number;
  returnAmount: number;   // <-- ADD THIS
  displayOrder: number;
  status: boolean;
}

interface PlansResponse {
  success: boolean;
  message?: string;
  plans: Plan[];
}

interface CreateOrderResponse {
  success: boolean;
  message?: string;

  keyId: string;

  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };

  plan: {
    id: string;
    title: string;
    price: number;
    duration: number;
  };

  customer: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

interface VerifyPaymentResponse {
  success: boolean;
  message?: string;
  subscription?: {
    _id: string;
  };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  code?: number;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

const PlansScreen = () => {
  const navigation = useNavigation<any>();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isRefreshing, setIsRefreshing] =
    useState(false);
  const [selectedPlanId, setSelectedPlanId] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] =
    useState('');

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState<'wallet' | 'razorpay'>(
      'wallet',
    );

  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null);

  const [
    paymentModalVisible,
    setPaymentModalVisible,
  ] = useState(false);

  const [isProcessingPayment, setIsProcessingPayment] =
    useState(false);

  const loadPlans = async (
    showLoader = true,
  ) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      setErrorMessage('');

      const response =
        await api.get<PlansResponse>(
          '/plans/active',
        );

      if (response.data.success) {
        setPlans(response.data.plans || []);
      } else {
        setErrorMessage(
          response.data.message ||
            'Unable to load plans.',
        );
      }
    } catch (error: any) {
      console.log(
        'Plans API error:',
        error.response?.data ||
          error.message,
      );

      setErrorMessage(
        error.response?.data?.message ||
          'Unable to connect to the server.',
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const summaryResponse =
        await getWalletSummary();

      if (summaryResponse.success) {
        setWalletBalance(
          summaryResponse.summary
            ?.balance || 0,
        );
      }
    } catch (error: any) {
      console.log(
        'Wallet balance load error:',
        error.response?.data ||
          error.message,
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPlans();
      loadWalletBalance();

      return undefined;
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    loadPlans(false);
    loadWalletBalance();
  };

  const activatePlan = async (plan: Plan) => {
    try {
      setSelectedPlanId(plan._id);

      /*
       * Step 1:
       * Create an order securely from the backend.
       */
      const orderResponse =
        await api.post<CreateOrderResponse>(
          '/payments/create-order',
          {
            planId: plan._id,
          },
        );

      if (
        !orderResponse.data.success ||
        !orderResponse.data.order?.id
      ) {
        throw new Error(
          orderResponse.data.message ||
            'Unable to create payment order.',
        );
      }

      const {keyId, order, customer} =
        orderResponse.data;

      /*
       * Step 2:
       * Open Razorpay Checkout.
       *
       * Amount is already returned in paise
       * by the backend.
       */
      const options = {
        key: keyId,
        amount: String(order.amount),
        currency: order.currency || 'INR',
        name: 'Nexora',
        description: `${plan.title} Plan`,
        order_id: order.id,

        prefill: {
          name: customer?.name || '',
          email: customer?.email || '',
          contact: customer?.contact || '',
        },

        notes: {
          planId: plan._id,
          planTitle: plan.title,
        },

        theme: {
          color: Theme.colors.primary,
        },

        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const paymentResult =
        (await RazorpayCheckout.open(
          options,
        )) as RazorpaySuccessResponse;

      /*
       * Step 3:
       * Send Razorpay response to backend.
       * Backend verifies the signature and only
       * then activates the subscription.
       */
      const verifyResponse =
        await api.post<VerifyPaymentResponse>(
          '/payments/verify',
          {
            razorpay_order_id:
              paymentResult.razorpay_order_id,

            razorpay_payment_id:
              paymentResult.razorpay_payment_id,

            razorpay_signature:
              paymentResult.razorpay_signature,
          },
        );

      if (!verifyResponse.data.success) {
        throw new Error(
          verifyResponse.data.message ||
            'Payment verification failed.',
        );
      }

      Alert.alert(
        'Payment Successful',
        verifyResponse.data.message ||
          'Your plan has been activated successfully.',
        [
          {
            text: 'Open Dashboard',
            onPress: () =>
              navigation.navigate('Home'),
          },
        ],
      );
    } catch (error: any) {
      console.log(
        'Razorpay payment error:',
        error,
      );

      /*
       * Axios/backend error
       */
      if (error.response?.data?.message) {
        Alert.alert(
          'Payment Failed',
          error.response.data.message,
        );

        return;
      }

      /*
       * Razorpay Checkout error
       */
      const razorpayError =
        error as RazorpayErrorResponse;

      if (razorpayError.description) {
        Alert.alert(
          'Payment Not Completed',
          razorpayError.description,
        );

        return;
      }

      /*
       * Local JavaScript error
       */
      Alert.alert(
        'Payment Failed',
        error.message ||
          'Unable to complete the payment.',
      );
    } finally {
      setSelectedPlanId(null);
    }
  };

  const purchaseWithWallet = async (
    plan: Plan,
  ) => {
    try {
      setIsProcessingPayment(true);

      const response =
        await purchaseUsingWallet(plan._id);

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to complete wallet payment.',
        );
      }

      setPaymentModalVisible(false);
      setSelectedPlan(null);

      Alert.alert(
        'Payment Successful',
        response.message ||
          'Your plan has been activated successfully.',
        [
          {
            text: 'Open Dashboard',
            onPress: () =>
              navigation.navigate('Home'),
          },
        ],
      );

      loadWalletBalance();
    } catch (error: any) {
      console.log(
        'Wallet payment error:',
        error.response?.data ||
          error.message,
      );

      Alert.alert(
        'Payment Failed',
        error.response?.data?.message ||
          error.message ||
          'Unable to complete the payment.',
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openPaymentModal = (plan: Plan) => {
    setSelectedPlan(plan);

    setPaymentMethod(
      walletBalance >= (plan.price || 0)
        ? 'wallet'
        : 'razorpay',
    );

    setPaymentModalVisible(true);
  };

  const closePaymentModal = () => {
    if (isProcessingPayment) {
      return;
    }

    setPaymentModalVisible(false);
    setSelectedPlan(null);
  };

  const handleContinue = () => {
    if (!selectedPlan) {
      return;
    }

    if (paymentMethod === 'wallet') {
      if (
        walletBalance <
        (selectedPlan.price || 0)
      ) {
        Alert.alert(
          'Insufficient Balance',
          'Your wallet balance is not enough for this plan. Please choose Razorpay instead.',
        );

        return;
      }

      purchaseWithWallet(selectedPlan);
    } else {
      const plan = selectedPlan;

      setPaymentModalVisible(false);
      setSelectedPlan(null);

      activatePlan(plan);
    }
  };

  const renderPlan = ({
    item,
  }: {
    item: Plan;
  }) => {
    const isSubmitting =
      selectedPlanId === item._id;

    return (
      <FadeInView delay={40}>
        <HoverWiggle>
        <GlassCard style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category || 'General'}
            </Text>
          </View>

          <Text style={styles.duration}>
            {item.duration} days
          </Text>
        </View>

        <Text style={styles.planTitle}>
          {item.title}
        </Text>

        <Text style={styles.description}>
          {item.description ||
            'No description available.'}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ₹
            {Number(item.price || 0).toFixed(
              2,
            )}
          </Text>

          <Text style={styles.priceDuration}>
            / {item.duration} days
          </Text>
        </View>

        <View style={styles.returnRow}>
          <Text style={styles.returnLabel}>
            Return Amount
          </Text>

          <Text style={styles.returnAmount}>
            ₹
            {Number(
              item.returnAmount || 0,
            ).toFixed(2)}
          </Text>
        </View>

        <PressableScale
          disabled={isSubmitting}
          style={[
            styles.activateButton,
            isSubmitting &&
              styles.disabledButton,
          ]}
          onPress={() =>
            openPaymentModal(item)
          }>
          {isSubmitting ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.activateButtonText
              }>
              Choose Plan
            </Text>
          )}
        </PressableScale>
        </GlassCard>
        </HoverWiggle>
      </FadeInView>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={Theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading plans...
        </Text>
      </View>
    );
  }

  if (errorMessage && plans.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Plans unavailable
        </Text>

        <Text style={styles.errorMessage}>
          {errorMessage}
        </Text>

        <PressableScale
          style={styles.retryButton}
          onPress={() => loadPlans()}>
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={item => item._id}
        renderItem={renderPlan}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={
              Theme.colors.primary
            }
            colors={[
              Theme.colors.primary,
            ]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>
              Choose Your Plan
            </Text>

            <Text style={styles.subtitle}>
              Select the plan that works best
              for you.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No plans available
            </Text>

            <Text style={styles.emptyText}>
              New plans will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.bottomSpace} />
        }
      />

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closePaymentModal}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={closePaymentModal}
        />

        <GlassCard style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>
            Payment Method
          </Text>

          {selectedPlan && (
            <>
              <Text style={styles.sheetPlanTitle}>
                {selectedPlan.title}
              </Text>

              <View style={styles.sheetRow}>
                <Text
                  style={styles.sheetRowLabel}>
                  Plan Price
                </Text>

                <Text
                  style={styles.sheetRowValue}>
                  ₹
                  {Number(
                    selectedPlan.price || 0,
                  ).toFixed(2)}
                </Text>
              </View>

              <View style={styles.sheetRow}>
                <Text
                  style={styles.sheetRowLabel}>
                  Wallet Balance
                </Text>

                <Text
                  style={styles.sheetRowValue}>
                  ₹
                  {Number(
                    walletBalance || 0,
                  ).toFixed(2)}
                </Text>
              </View>

              <View
                style={
                  styles.optionsContainer
                }>
                <PressableScale
                  disabled={
                    walletBalance <
                    (selectedPlan.price ||
                      0)
                  }
                  style={[
                    styles.optionRow,
                    paymentMethod ===
                      'wallet' &&
                      styles.optionRowSelected,
                    walletBalance <
                      (selectedPlan.price ||
                        0) &&
                      styles.optionRowDisabled,
                  ]}
                  onPress={() =>
                    setPaymentMethod('wallet')
                  }>
                  <View
                    style={[
                      styles.radioOuter,
                      paymentMethod ===
                        'wallet' &&
                        styles.radioOuterSelected,
                    ]}>
                    {paymentMethod ===
                      'wallet' && (
                      <View
                        style={
                          styles.radioInner
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.optionTextGroup
                    }>
                    <Text
                      style={
                        styles.optionLabel
                      }>
                      Wallet
                    </Text>

                    {walletBalance <
                      (selectedPlan.price ||
                        0) && (
                      <Text
                        style={
                          styles.optionWarning
                        }>
                        Insufficient balance
                      </Text>
                    )}
                  </View>
                </PressableScale>

                <PressableScale
                  style={[
                    styles.optionRow,
                    paymentMethod ===
                      'razorpay' &&
                      styles.optionRowSelected,
                  ]}
                  onPress={() =>
                    setPaymentMethod(
                      'razorpay',
                    )
                  }>
                  <View
                    style={[
                      styles.radioOuter,
                      paymentMethod ===
                        'razorpay' &&
                        styles.radioOuterSelected,
                    ]}>
                    {paymentMethod ===
                      'razorpay' && (
                      <View
                        style={
                          styles.radioInner
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.optionTextGroup
                    }>
                    <Text
                      style={
                        styles.optionLabel
                      }>
                      Razorpay
                    </Text>

                    <Text
                      style={
                        styles.optionSubLabel
                      }>
                      Card / UPI / Netbanking
                    </Text>
                  </View>
                </PressableScale>
              </View>

              <PressableScale
                disabled={
                  isProcessingPayment
                }
                style={[
                  styles.continueButton,
                  isProcessingPayment &&
                    styles.disabledButton,
                ]}
                onPress={handleContinue}>
                {isProcessingPayment ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.continueButtonText
                    }>
                    Continue
                  </Text>
                )}
              </PressableScale>

              <PressableScale
                disabled={
                  isProcessingPayment
                }
                style={styles.cancelButton}
                onPress={closePaymentModal}>
                <Text
                  style={
                    styles.cancelButtonText
                  }>
                  Cancel
                </Text>
              </PressableScale>
            </>
          )}
        </GlassCard>
      </Modal>
    </View>
  );
};

export default PlansScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Theme.colors.background,
  },

  centerContainer: {
    flex: 1,
    backgroundColor:
      Theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },

  listContent: {
    padding: 20,
    paddingBottom: 110,
  },

  header: {
    marginBottom: 22,
  },

  title: {
    color: Theme.colors.onLightText,
    fontSize: 29,
    fontWeight: '800',
  },

  subtitle: {
    color: Theme.colors.onLightGrey,
    fontSize: 14,
    marginTop: 7,
    lineHeight: 20,
  },

  loadingText: {
    color: Theme.colors.onLightText,
    marginTop: 14,
  },

  errorTitle: {
    color: Theme.colors.onLightText,
    fontSize: 22,
    fontWeight: '700',
  },

  errorMessage: {
    color: Theme.colors.onLightGrey,
    textAlign: 'center',
    marginTop: 10,
  },

  retryButton: {
    backgroundColor:
      Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  planCard: {
    backgroundColor: Theme.colors.glass,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    ...Theme.shadows.card,
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
  },

  categoryText: {
    color: Theme.colors.primaryDeep,
    fontSize: 12,
    fontWeight: '700',
  },

  duration: {
    color: Theme.colors.grey,
    fontSize: 13,
  },

  planTitle: {
    color: Theme.colors.text,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 17,
  },

  description: {
    color: Theme.colors.grey,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 20,
  },

  price: {
    color: Theme.colors.primary,
    fontSize: 30,
    fontWeight: '800',
  },

  priceDuration: {
    color: Theme.colors.grey,
    fontSize: 13,
    marginLeft: 5,
    marginBottom: 5,
  },

  returnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  returnLabel: {
    color: Theme.colors.grey,
    fontSize: 14,
    fontWeight: '600',
  },

  returnAmount: {
    color: '#16A34A',
    fontSize: 20,
    fontWeight: '800',
  },

  activateButton: {
    minHeight: 52,
    backgroundColor:
      Theme.colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#B3421E',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 9,
  },

  disabledButton: {
    opacity: 0.65,
  },

  activateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 70,
  },

  emptyTitle: {
    color: Theme.colors.onLightText,
    fontSize: 20,
    fontWeight: '700',
  },

  emptyText: {
    color: Theme.colors.onLightGrey,
    marginTop: 8,
  },

  bottomSpace: {
    height: 10,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(120,80,40,0.3)',
  },

  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },

  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.grey,
    alignSelf: 'center',
    opacity: 0.4,
    marginBottom: 16,
  },

  sheetTitle: {
    color: Theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },

  sheetPlanTitle: {
    color: Theme.colors.grey,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },

  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  sheetRowLabel: {
    color: Theme.colors.grey,
    fontSize: 14,
  },

  sheetRowValue: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  optionsContainer: {
    marginTop: 14,
    marginBottom: 22,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Theme.colors.glassBorder,
    backgroundColor: '#FFF9EF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  optionRowSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FBE7D8',
  },

  optionRowDisabled: {
    opacity: 0.8,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.grey,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  radioOuterSelected: {
    borderColor: Theme.colors.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },

  optionTextGroup: {
    flex: 1,
  },

  optionLabel: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  optionSubLabel: {
    color: Theme.colors.onLightGrey,
    fontSize: 12,
    marginTop: 2,
  },

  optionWarning: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 2,
  },

  continueButton: {
    minHeight: 52,
    backgroundColor:
      Theme.colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#B3421E',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 9,
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },

  cancelButtonText: {
    color: Theme.colors.grey,
    fontSize: 14,
    fontWeight: '600',
  },
});