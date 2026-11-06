import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { colors } from '../theme/colors';
import { KpiSummary, BankAccount } from '../types';

interface OverviewScreenProps {
  kpi: KpiSummary;
  accounts: BankAccount[];
  onNavigateTab: (tab: any) => void;
  onRefresh: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  kpi,
  accounts,
  onNavigateTab,
  onRefresh,
}) => {
  const handleApproveClose = () => {
    Alert.alert(
      'CPA Approval Gate',
      'Post 3 pending month-end adjustment journals under ASC 830 to the General Ledger?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm & Post', 
          style: 'default',
          onPress: () => {
            Alert.alert('Success', 'Month-end journals successfully committed to General Ledger.');
            onRefresh();
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Cash Balance Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Multi-Currency Cash Balance</Text>
        <Text style={styles.heroAmount}>
          ${kpi.totalCashUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
        </Text>
        <Text style={styles.heroSub}>
          Consolidated across 4 institutional vaults under ASC 830
        </Text>

        {/* 4 Core KPIs */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity 
            style={styles.kpiItem}
            onPress={() => onNavigateTab('reconcile')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiLabel}>Unreconciled</Text>
            <Text style={[styles.kpiValue, { color: colors.warning }]}>{kpi.unreconciledCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.kpiItem}
            onPress={() => onNavigateTab('anomalies')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiLabel}>Anomalies</Text>
            <Text style={[styles.kpiValue, { color: colors.danger }]}>{kpi.openAnomaliesCount}</Text>
          </TouchableOpacity>

          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Pending Close</Text>
            <Text style={[styles.kpiValue, { color: colors.accent }]}>{kpi.pendingJournalsCount}</Text>
          </View>

          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>GAAP Health</Text>
            <Text style={[styles.kpiValue, { color: colors.success }]}>{kpi.gaapComplianceRate}%</Text>
          </View>
        </View>
      </View>

      {/* Autonomous Month-End Close Action */}
      <View style={styles.actionCard}>
        <View style={styles.actionHeader}>
          <Text style={styles.actionTitle}>Autonomous Financial Close</Text>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>CPA Gate</Text>
          </View>
        </View>
        <Text style={styles.actionDesc}>
          3 ASC 830 unrealized FX revaluation journals prepared. Debit/Credit variance is $0.00.
        </Text>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={handleApproveClose}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>🔒 Review & Post Month-End Close</Text>
        </TouchableOpacity>
      </View>

      {/* Connected Bank Accounts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Institutional Bank Accounts</Text>
        <Text style={styles.sectionSub}>Live Balance</Text>
      </View>

      {accounts.map((acc) => (
        <View key={acc.id} style={styles.accountCard}>
          <View style={styles.accLeft}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>{acc.currency}</Text>
            </View>
            <View>
              <Text style={styles.accName}>{acc.bank_name}</Text>
              <Text style={styles.accNumber}>{acc.account_name} • {acc.account_number}</Text>
            </View>
          </View>
          <View style={styles.accRight}>
            <Text style={styles.accBalance}>
              {acc.currency} {acc.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.accStatus}>{acc.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginVertical: 6,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 14,
  },
  kpiItem: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 16,
    marginBottom: 20,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  actionPill: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.4)',
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  actionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  currencyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  accName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  accNumber: {
    fontSize: 11,
    color: colors.textMuted,
  },
  accRight: {
    alignItems: 'flex-end',
  },
  accBalance: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  accStatus: {
    fontSize: 10,
    color: colors.success,
    marginTop: 2,
  },
});
