import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Filter,
  Search
} from 'lucide-react';
import { useLockHistory } from '../hooks/useLockHistory';

interface LockHistoryProps {
  appointmentId: string;
  autoRefresh?: boolean;
  compact?: boolean;
  showStatistics?: boolean;
  maxHeight?: string;
}

export function LockHistory({ 
  appointmentId, 
  autoRefresh = false, 
  compact = false,
  showStatistics = true,
  maxHeight = '400px'
}: LockHistoryProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpanded, setShowExpanded] = useState(true);
  
  const {
    history,
    statistics,
    isLoading,
    error,
    refresh,
    loadMore,
    hasMore,
    isEmpty,
    currentPage,
    totalPages
  } = useLockHistory({
    appointmentId,
    autoRefresh,
    refreshInterval: 30000
  });

  const filteredHistory = history.filter(item => {
    const matchesAction = filterAction === 'all' || item.action === filterAction;
    const matchesSearch = searchTerm === '' || 
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'acquired':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'released':
        return <XCircle className="h-4 w-4 text-blue-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'force_released':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'acquired':
        return 'bg-green-50 border-green-200';
      case 'released':
        return 'bg-blue-50 border-blue-200';
      case 'expired':
        return 'bg-yellow-50 border-yellow-200';
      case 'force_released':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Error loading lock history</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Lock History</h3>
            {isLoading && (
              <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExpanded(!showExpanded)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              {showExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showExpanded ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showExpanded && (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Actions</option>
                <option value="acquired">Acquired</option>
                <option value="released">Released</option>
                <option value="expired">Expired</option>
                <option value="force_released">Force Released</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 w-40"
              />
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {showStatistics && statistics && showExpanded && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Statistics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Acquisitions</div>
              <div className="font-medium text-gray-900">{statistics.totalAcquisitions}</div>
            </div>
            <div>
              <div className="text-gray-600">Avg Duration</div>
              <div className="font-medium text-gray-900">{formatDuration(statistics.averageDuration)}</div>
            </div>
            <div>
              <div className="text-gray-600">Expired Locks</div>
              <div className="font-medium text-gray-900">{statistics.totalExpired}</div>
            </div>
            <div>
              <div className="text-gray-600">Active Users</div>
              <div className="font-medium text-gray-900">{statistics.uniqueUsers}</div>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="overflow-hidden">
        {isEmpty ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No lock history found</p>
            <p className="text-sm">Lock activities will appear here once users interact with this appointment</p>
          </div>
        ) : (
          <div className={`overflow-y-auto ${compact ? 'max-h-60' : ''}`} style={{ maxHeight }}>
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${getActionColor(item.action)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(item.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{item.userName}</span>
                        <span className="text-sm text-gray-500">{item.userEmail}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">{item.action.replace('_', ' ')}</span>
                      {item.duration && (
                        <span>Duration: {formatDuration(item.duration)}</span>
                      )}
                      {item.releasedBy && (
                        <span>Released by: {item.releasedBy}</span>
                      )}
                      {item.metadata?.optimisticLocking && (
                        <span className="text-blue-600">Optimistic Locking</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && showExpanded && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {totalPages > 1 && showExpanded && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>
    </div>
  );
} 