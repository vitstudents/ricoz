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
import { Anomaly } from '../types';

interface AnomaliesScreenProps {
  anomalies: Anomaly[];
  onDismiss: (id: string) => void;
}

export const AnomaliesScreen: React.FC<AnomaliesScreenProps> = ({
  anomalies,
  onDismiss,
}) => {
  const handleFlag = (anomaly: Anomaly) => {
    Alert.alert(
      'Flagged for CPA Investigation',
      `Anomaly ${anomaly.id} (${anomaly.anomaly_type}) has been placed into the Senior CPA review queue with highest priority.`
    );
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'high') return colors.danger;
    if (sev === 'medium') return colors.warning;
    return colors.secondary;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Autonomous Fraud & Outlier Watch</Text>
        <Text style={styles.headerSub}>
          Real-time pattern analysis flags duplicate vendor debits, moving average spikes, and GAAP capitalization violations.
        </Text>
      </View>

      <Text style={styles.listTitle}>
        Active Outliers ({anomalies.length})
      </Text>

      {anomalies.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyTitle}>Zero Open Anomalies</Text>
          <Text style={styles.emptyText}>All ledger transactions comply with GAAP guidelines.</Text>
        </View>
      ) : (
        anomalies.map((item) => {
          const sevColor = getSeverityColor(item.severity);
          return (
            <View key={item.id} style={[styles.card, { borderLeftColor: sevColor }]}>
              <View style={styles.cardTop}>
                <View style={[styles.sevBadge, { backgroundColor: `${sevColor}20` }]}>
                  <Text style={[styles.sevText, { color: sevColor }]}>
                    {item.severity.toUpperCase()} SEVERITY
                  </Text>
                </View>
                <Text style={styles.typeText}>
                  {item.anomaly_type.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <Text style={styles.descText}>{item.description}</Text>

              {item.amount && (
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Flagged Amount:</Text>
                  <Text style={styles.amountValue}>
                    {item.currency || 'USD'} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={styles.dismissBtn}
                  onPress={() => onDismiss(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.flagBtn, { backgroundColor: sevColor }]}
                  onPress={() => handleFlag(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagBtnText}>Flag for Audit</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
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
  headerBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  listTitle: {
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
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sevBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sevText: {
    fontSize: 10,
    fontWeight: '800',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  descText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  amountValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  flagBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  flagBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
