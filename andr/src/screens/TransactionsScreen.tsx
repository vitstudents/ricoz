import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput 
} from 'react-native';
import { colors } from '../theme/colors';
import { Transaction } from '../types';

interface TransactionsScreenProps {
  transactions: Transaction[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  transactions,
  onRefresh,
  isRefreshing,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currencies = ['ALL', 'USD', 'EUR', 'GBP', 'INR'];

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCurrency = selectedCurrency === 'ALL' || tx.currency === selectedCurrency;
    const matchesQuery = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.category_name && tx.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.gl_account_code && tx.gl_account_code.includes(searchQuery));
    return matchesCurrency && matchesQuery;
  });

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search descriptions, GL codes, categories..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Currency Filter Bar */}
      <View style={styles.currencyFilterRow}>
        {currencies.map((curr) => {
          const isSelected = selectedCurrency === curr;
          return (
            <TouchableOpacity
              key={curr}
              style={[styles.filterPill, isSelected && styles.filterPillSelected]}
              onPress={() => setSelectedCurrency(curr)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterPillText, isSelected && styles.filterPillTextSelected]}>
                {curr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Header Info */}
      <View style={styles.listHeader}>
        <Text style={styles.countText}>
          Showing {filteredTransactions.length} of {transactions.length} Transactions
        </Text>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isPositive = item.amount >= 0;
          return (
            <View style={styles.txCard}>
              <View style={styles.txLeft}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {item.description}
                </Text>
                <View style={styles.txSubRow}>
                  <Text style={styles.txDate}>{item.date}</Text>
                  <Text style={styles.txDot}>•</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {item.category_name || 'General'} ({item.gl_account_code || '6000'})
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.txRight}>
                <Text style={[styles.txAmount, isPositive ? styles.amountPositive : styles.amountNegative]}>
                  {isPositive ? '+' : ''}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {item.currency}
                </Text>
                {item.currency !== 'USD' && item.amount_usd !== undefined && (
                  <Text style={styles.txUsdEquivalent}>
                    ≈ ${Math.abs(item.amount_usd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </Text>
                )}
                {item.is_reconciled && (
                  <Text style={styles.reconciledPill}>✓ Reconciled</Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
  },
  currencyFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterPillTextSelected: {
    color: '#FFF',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  txCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txLeft: {
    flex: 1,
    marginRight: 10,
  },
  txDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  txSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  txDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  categoryBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  amountPositive: {
    color: colors.success,
  },
  amountNegative: {
    color: colors.text,
  },
  txUsdEquivalent: {
    fontSize: 10,
    color: colors.secondary,
    marginTop: 2,
  },
  reconciledPill: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
    marginTop: 2,
  },
});
