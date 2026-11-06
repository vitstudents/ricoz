import React, { useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView, 
  View, 
  StyleSheet 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { colors } from './src/theme/colors';
import { Header } from './src/components/Header';
import { BottomNav, TabType } from './src/components/BottomNav';
import { OverviewScreen } from './src/screens/OverviewScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { ReconciliationScreen } from './src/screens/ReconciliationScreen';
import { AnomaliesScreen } from './src/screens/AnomaliesScreen';
import { AssistantScreen } from './src/screens/AssistantScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { 
  KpiSummary, 
  Transaction, 
  Anomaly, 
  ReconciliationMatch, 
  BankAccount, 
  CurrencyRate 
} from './src/types';
import { apiService } from './src/services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Financial Data State
  const [kpi, setKpi] = useState<KpiSummary>({
    unreconciledCount: 14,
    openAnomaliesCount: 6,
    pendingJournalsCount: 3,
    totalTransactionsCount: 1054,
    gaapComplianceRate: 98.4,
    totalCashUsd: 1428500.0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationMatch[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [kpiRes, txRes, anomRes, recRes, accRes, currRes] = await Promise.all([
        apiService.getOverview(),
        apiService.getTransactions(40),
        apiService.getAnomalies(),
        apiService.getReconciliations(),
        apiService.getBankAccounts(),
        apiService.getCurrencies(),
      ]);

      setKpi(kpiRes);
      setTransactions(txRes);
      setAnomalies(anomRes);
      setReconciliations(recRes);
      setAccounts(accRes);
      setCurrencies(currRes);
    } catch (err) {
      console.warn('Network sync notice: falling back to cached state', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDismissAnomaly = async (id: string) => {
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
    setKpi((prev) => ({
      ...prev,
      openAnomaliesCount: Math.max(0, prev.openAnomaliesCount - 1),
    }));
    await apiService.dismissAnomaly(id);
  };

  const handleResetDatabase = () => {
    loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* Top Ledger Header */}
      <Header onRefresh={loadData} isRefreshing={isRefreshing} />

      {/* Screen Container */}
      <View style={styles.contentContainer}>
        {currentTab === 'overview' && (
          <OverviewScreen
            kpi={kpi}
            accounts={accounts}
            onNavigateTab={setCurrentTab}
            onRefresh={loadData}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsScreen
            transactions={transactions}
            onRefresh={loadData}
            isRefreshing={isRefreshing}
          />
        )}

        {currentTab === 'reconcile' && (
          <ReconciliationScreen
            matches={reconciliations}
          />
        )}

        {currentTab === 'anomalies' && (
          <AnomaliesScreen
            anomalies={anomalies}
            onDismiss={handleDismissAnomaly}
          />
        )}

        {currentTab === 'assistant' && (
          <AssistantScreen />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            currencies={currencies}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </View>

      {/* Bottom Tab Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        anomalyCount={anomalies.length}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
