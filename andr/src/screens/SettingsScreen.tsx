import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { colors } from '../theme/colors';
import { CurrencyRate } from '../types';

interface SettingsScreenProps {
  currencies: CurrencyRate[];
  onResetDatabase: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currencies,
  onResetDatabase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'currencies' | 'audit' | 'org'>('currencies');

  const handleReset = () => {
    Alert.alert(
      'Reset Synthetic Dataset',
      'This will re-seed 1,000+ multi-currency transactions and recalculate all general ledger balances under ASC 830. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset & Re-seed', 
          style: 'destructive', 
          onPress: () => {
            onResetDatabase();
            Alert.alert('Success', 'Financial dataset reset and seeded successfully.');
          } 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Organization Header */}
      <View style={styles.orgCard}>
        <View style={styles.orgHeader}>
          <Text style={styles.orgName}>Acme Global Holdings Inc.</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>Admin / Controller</Text>
          </View>
        </View>
        <Text style={styles.orgSub}>
          Organization ID: org-prod-001 • Base Currency: USD ($)
        </Text>
      </View>

      {/* Sub-tab Switcher */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'currencies' && styles.subTabActive]}
          onPress={() => setActiveSubTab('currencies')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeSubTab === 'currencies' && styles.subTabTextActive]}>
            FX Rates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'audit' && styles.subTabActive]}
          onPress={() => setActiveSubTab('audit')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeSubTab === 'audit' && styles.subTabTextActive]}>
            Audit Trail
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeSubTab === 'org' && styles.subTabActive]}
          onPress={() => setActiveSubTab('org')}
          activeOpacity={0.7}
        >
          <Text style={[styles.subTabText, activeSubTab === 'org' && styles.subTabTextActive]}>
            Controls
          </Text>
        </TouchableOpacity>
      </View>

      {/* SUB-TAB 1: CURRENCIES & FX RATES */}
      {activeSubTab === 'currencies' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ASC 830 Foreign Exchange Table</Text>
          <Text style={styles.cardSub}>Conversion rates applied to foreign bank vaults.</Text>

          {currencies.map((c) => (
            <View key={c.currency} style={styles.currencyRow}>
              <View>
                <Text style={styles.currCode}>{c.currency}</Text>
                <Text style={styles.currDesc}>{c.description}</Text>
              </View>
              <View style={styles.ratePill}>
                <Text style={styles.rateText}>{c.rate_to_usd.toFixed(4)} USD</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SUB-TAB 2: SOX AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Immutable SOX Security Audit Log</Text>
          <Text style={styles.cardSub}>Chronological ledger of user approvals and modifications.</Text>

          <View style={styles.auditItem}>
            <Text style={styles.auditTime}>2026-11-06 14:02 UTC</Text>
            <Text style={styles.auditAction}>APPROVED_JOURNAL_ENTRY</Text>
            <Text style={styles.auditDetails}>CPA Biometric Approval for ASC 830 foreign exchange revaluation #JE-2026-11-001.</Text>
          </View>

          <View style={styles.auditItem}>
            <Text style={styles.auditTime}>2026-11-06 13:45 UTC</Text>
            <Text style={styles.auditAction}>RECONCILIATION_MATCH</Text>
            <Text style={styles.auditDetails}>Approved 1:1 match for Stripe payout $18,450.00 USD.</Text>
          </View>

          <View style={styles.auditItem}>
            <Text style={styles.auditTime}>2026-11-06 12:30 UTC</Text>
            <Text style={styles.auditAction}>ANOMALY_DISMISSED</Text>
            <Text style={styles.auditDetails}>Admin dismissed duplicate flag on recurring GitHub Enterprise invoice.</Text>
          </View>
        </View>
      )}

      {/* SUB-TAB 3: ADMINISTRATIVE CONTROLS */}
      {activeSubTab === 'org' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System & Database Operations</Text>
          <Text style={styles.cardSub}>Administrative triggers for evaluation and stress testing.</Text>

          <TouchableOpacity 
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.resetBtnText}>🔄 Reset & Re-Seed 1,000+ Transactions</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>API Cloud Endpoint</Text>
            <Text style={styles.infoVal}>work-hazel-one.vercel.app</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Mobile App Version</Text>
            <Text style={styles.infoVal}>v1.0.0 (Expo SDK 58)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Audit Standard</Text>
            <Text style={styles.infoVal}>US GAAP / SOX 404</Text>
          </View>
        </View>
      )}
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
  orgCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  rolePill: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  orgSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabActive: {
    backgroundColor: colors.primary,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subTabTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 14,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  currCode: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  currDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratePill: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: 'monospace',
  },
  auditItem: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  auditTime: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  auditAction: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: 4,
  },
  auditDetails: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  resetBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  infoKey: {
    fontSize: 11,
    color: colors.textMuted,
  },
  infoVal: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});
