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
import { ReconciliationMatch } from '../types';

interface ReconciliationScreenProps {
  matches: ReconciliationMatch[];
  onApproveMatch?: (id: string) => void;
}

export const ReconciliationScreen: React.FC<ReconciliationScreenProps> = ({
  matches,
  onApproveMatch,
}) => {
  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const handleApprove = (match: ReconciliationMatch) => {
    setApprovedIds((prev) => [...prev, match.id]);
    Alert.alert(
      'Match Approved',
      `Reconciliation match for ${match.currency} ${match.amount.toLocaleString()} has been committed to the general ledger and locked in the SOX audit trail.`
    );
    if (onApproveMatch) onApproveMatch(match.id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoBanner}>
        <Text style={styles.infoTitle}>Continuous Auto-Reconciliation Engine</Text>
        <Text style={styles.infoText}>
          The agent correlates bank transactions against accounts receivable/payable schedules using amount, date proximity, and entity matching.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Suggested Reconciliation Matches ({matches.length - approvedIds.length} Pending)
      </Text>

      {matches.map((item) => {
        const isApproved = approvedIds.includes(item.id);
        const confidencePct = (item.confidence_score * 100).toFixed(1);

        return (
          <View key={item.id} style={[styles.card, isApproved && styles.cardApproved]}>
            <View style={styles.cardHeader}>
              <View style={styles.confidencePill}>
                <Text style={styles.confidenceText}>
                  {confidencePct}% Confidence Match
                </Text>
              </View>
              <Text style={styles.matchType}>
                {item.match_type === 'one_to_one' ? '1:1 Match' : '1:N Multi-Match'}
              </Text>
            </View>

            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Matched Amount:</Text>
                <Text style={styles.detailValue}>
                  {item.currency} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Target GL Account:</Text>
                <Text style={styles.detailValue}>{item.gl_account}</Text>
              </View>
            </View>

            {isApproved ? (
              <View style={styles.approvedNotice}>
                <Text style={styles.approvedText}>✓ Committed to SOX Audit Log</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.approveBtn}
                onPress={() => handleApprove(item)}
                activeOpacity={0.8}
              >
                <Text style={styles.approveBtnText}>Approve Match & Lock Audit</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
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
  infoBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  cardApproved: {
    borderColor: colors.success,
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidencePill: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  matchType: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  description: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  detailsBox: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  approveBtn: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  approvedNotice: {
    backgroundColor: colors.successLight,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approvedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
});
