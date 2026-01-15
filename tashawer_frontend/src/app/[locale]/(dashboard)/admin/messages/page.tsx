'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Alert,
  AlertDescription,
  Spinner,
} from '@/components/ui';
import { handleApiError } from '@/lib/api';
import {
  getAdminConversations,
  getMessagingStats,
  searchMessages,
  type AdminConversation,
  type MessagingStats,
  type SearchResult,
  type PaginationInfo,
} from '@/lib/admin-messages';
import {
  MessageSquare,
  Search,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Eye,
  BarChart3,
  Filter,
} from 'lucide-react';

export default function AdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [stats, setStats] = useState<MessagingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [filters, setFilters] = useState({
    sort: '-last_message_at',
    has_messages: '',
  });
  const pageSize = 20;

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [convResponse, statsResponse] = await Promise.all([
        getAdminConversations({
          page,
          page_size: pageSize,
          sort: filters.sort,
          has_messages: filters.has_messages === 'true' ? true : filters.has_messages === 'false' ? false : undefined,
        }),
        getMessagingStats(),
      ]);

      setConversations(convResponse.conversations);
      setPagination(convResponse.pagination);
      setStats(statsResponse);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setShowSearch(true);
      const response = await searchMessages({ q: searchQuery, page_size: 50 });
      setSearchResults(response.results);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    setSearchResults([]);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      client: 'bg-blue-100 text-blue-700',
      consultant: 'bg-teal-100 text-teal-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {role}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = pagination?.total_pages || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Message Monitoring
            </h1>
            <p className="text-muted-foreground">
              View and monitor all platform conversations
            </p>
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Conversations</p>
                    <p className="text-2xl font-bold">{stats.overview.total_conversations}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold">{stats.overview.total_messages}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Messages Today</p>
                    <p className="text-2xl font-bold">{stats.overview.messages_today}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold">{stats.overview.active_conversations_today}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                className="px-3 py-2 border rounded-md"
                value={filters.sort}
                onChange={(e) => {
                  setFilters(f => ({ ...f, sort: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="-last_message_at">Latest Activity</option>
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="-message_count">Most Messages</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md"
                value={filters.has_messages}
                onChange={(e) => {
                  setFilters(f => ({ ...f, has_messages: e.target.value }));
                  setPage(1);
                }}
              >
                <option value="">All Conversations</option>
                <option value="true">With Messages</option>
                <option value="false">Empty</option>
              </select>
              <Button type="submit" disabled={isSearching}>
                {isSearching ? <Spinner size="sm" /> : 'Search'}
              </Button>
              {showSearch && (
                <Button type="button" variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {showSearch && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Results ({searchResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No messages found</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/admin/messages/${result.conversation_id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{result.sender_name}</span>
                            {getRoleBadge(result.sender_role)}
                            {result.project_title && (
                              <span className="text-xs text-muted-foreground">
                                in {result.project_title}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.content_preview}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(result.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conversations Table */}
        {!showSearch && (
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Participants</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Context</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Last Message</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Messages</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Last Activity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {conversations.map((conv) => (
                        <tr key={conv.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {conv.participants.slice(0, 2).map((p) => (
                                <div key={p.id} className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{p.full_name}</span>
                                  {getRoleBadge(p.role)}
                                </div>
                              ))}
                              {conv.participants.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{conv.participants.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {conv.project_info ? (
                              <div className="text-sm">
                                <p className="font-medium truncate max-w-[200px]">
                                  {conv.project_info.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {conv.project_info.status}
                                </p>
                              </div>
                            ) : conv.proposal_info ? (
                              <div className="text-sm">
                                <p className="font-medium truncate max-w-[200px]">
                                  Proposal: {conv.proposal_info.project_title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {conv.proposal_info.status}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {conv.subject || 'Direct Message'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {conv.last_message ? (
                              <div className="text-sm">
                                <p className="truncate max-w-[200px]">
                                  {conv.last_message.content}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  by {conv.last_message.sender_name}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No messages</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-muted text-sm font-medium">
                              {conv.message_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(conv.last_message_at)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/messages/${conv.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, pagination.total_count)} of {pagination.total_count}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
