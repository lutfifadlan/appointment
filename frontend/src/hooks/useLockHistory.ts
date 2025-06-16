import { useState, useCallback, useEffect } from 'react';
import { 
  LockHistoryItem, 
  LockStatistics, 
  LockHistoryResponse, 
  LockStatisticsResponse 
} from '../lib/types/appointment';

interface UseLockHistoryOptions {
  appointmentId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useLockHistory(options: UseLockHistoryOptions = {}) {
  const {
    appointmentId,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [history, setHistory] = useState<LockHistoryItem[]>([]);
  const [statistics, setStatistics] = useState<LockStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const fetchHistory = useCallback(async (
    currentLimit = limit,
    currentOffset = offset,
    appointmentIdOverride?: string
  ) => {
    const targetAppointmentId = appointmentIdOverride || appointmentId;
    if (!targetAppointmentId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/appointments/${targetAppointmentId}/lock-history?limit=${currentLimit}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LockHistoryResponse = await response.json();

      if (result.success) {
        setHistory(result.data);
        setTotal(result.total);
        setLimit(result.limit);
        setOffset(result.offset);
      } else {
        throw new Error('Failed to fetch lock history');
      }
    } catch (error) {
      console.error('Failed to fetch lock history:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch lock history');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, limit, offset]);

  const fetchStatistics = useCallback(async (appointmentIdOverride?: string) => {
    const targetAppointmentId = appointmentIdOverride || appointmentId;
    if (!targetAppointmentId) return;

    try {
      setIsLoadingStats(true);
      setError(null);

      const response = await fetch(`/api/appointments/${targetAppointmentId}/lock-statistics`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: LockStatisticsResponse = await response.json();

      if (result.success) {
        setStatistics(result.data);
      } else {
        throw new Error('Failed to fetch lock statistics');
      }
    } catch (error) {
      console.error('Failed to fetch lock statistics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch lock statistics');
    } finally {
      setIsLoadingStats(false);
    }
  }, [appointmentId]);

  const refresh = useCallback(async () => {
    if (!appointmentId) return;
    await Promise.all([
      fetchHistory(),
      fetchStatistics()
    ]);
  }, [appointmentId, fetchHistory, fetchStatistics]);

  const loadMore = useCallback(async () => {
    if (!appointmentId || isLoading) return;
    const newOffset = offset + limit;
    await fetchHistory(limit, newOffset);
  }, [appointmentId, isLoading, offset, limit, fetchHistory]);

  const changePagination = useCallback(async (newLimit: number, newOffset = 0) => {
    if (!appointmentId) return;
    await fetchHistory(newLimit, newOffset);
  }, [appointmentId, fetchHistory]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !appointmentId) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, appointmentId, refreshInterval, refresh]);

  // Initial fetch
  useEffect(() => {
    if (appointmentId) {
      refresh();
    }
  }, [appointmentId, refresh]);

  // Helper functions for analyzing history
  const getRecentActivity = useCallback((hours = 24): LockHistoryItem[] => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return history.filter(item => new Date(item.timestamp) > cutoff);
  }, [history]);

  const getUserActivity = useCallback((userId: string): LockHistoryItem[] => {
    return history.filter(item => item.userId === userId);
  }, [history]);

  const getActionCounts = useCallback(() => {
    return history.reduce((counts, item) => {
      counts[item.action] = (counts[item.action] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [history]);

  const getAverageLockDuration = useCallback((): number => {
    const durationsWithValues = history
      .filter(item => item.duration && item.duration > 0)
      .map(item => item.duration!);
    
    if (durationsWithValues.length === 0) return 0;
    
    const sum = durationsWithValues.reduce((acc, duration) => acc + duration, 0);
    return sum / durationsWithValues.length;
  }, [history]);

  const getMostActiveUsers = useCallback((): Array<{ userId: string; userName: string; count: number }> => {
    const userCounts = history.reduce((counts, item) => {
      const key = `${item.userId}:${item.userName}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .map(([key, count]) => {
        const [userId, userName] = key.split(':');
        return { userId, userName, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [history]);

  return {
    // Data
    history,
    statistics,
    total,
    limit,
    offset,
    
    // State
    isLoading,
    isLoadingStats,
    error,
    
    // Actions
    fetchHistory,
    fetchStatistics,
    refresh,
    loadMore,
    changePagination,
    
    // Helpers
    getRecentActivity,
    getUserActivity,
    getActionCounts,
    getAverageLockDuration,
    getMostActiveUsers,
    
    // Computed values
    hasMore: offset + limit < total,
    isEmpty: history.length === 0 && !isLoading,
    currentPage: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit)
  };
} 