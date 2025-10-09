'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface Campaign {
  id: number;
  campaign_id: string;
  campaign_observation_date: string;
  media_channel: string;
  marketing_company: string;
  industry: string;
  estimated_volume: number;
  estimated_spend: number;
  thumbnail_url: string;
  subindustry?: string;
  product_type?: string;
  brand?: string;
  product?: string;
  properties?: string;
  affiliated_company?: string;
  post_link?: string;
  landing_page?: string;
  campaign_observation_country?: string;
  email_inbox_rate?: string;
  email_spam_rate?: string;
  email_read_rate?: string;
  email_delete_rate?: string;
  email_delete_without_read_rate?: string;
  subject_line?: string;
  email_sender_domain?: string;
  social_post_type?: string;
  social_engagement?: string;
  digital_domain_ad_seen_on?: string;
  panelist_location?: string;
  metro_area?: string;
  is_general_branding?: boolean;
  text_content?: string;
  day_part?: string;
  ad_duration_seconds?: number;
  channel?: string;
  program?: string;
}

interface CampaignsViewProps {
  onViewChange: (view: string) => void;
}

type SortField = 'campaign_id' | 'campaign_observation_date' | 'media_channel' | 'marketing_company' | 'industry' | 'estimated_volume' | 'estimated_spend';
type SortDirection = 'asc' | 'desc';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function CampaignsView({ onViewChange }: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaChannelFilter, setMediaChannelFilter] = useState('');
  const [marketingCompanyFilter, setMarketingCompanyFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('campaign_observation_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [availableFilters, setAvailableFilters] = useState({
    mediaChannels: [] as string[],
    marketingCompanies: [] as string[]
  });

  // Debounce search input
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCampaigns = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearchTerm,
        mediaChannel: mediaChannelFilter,
        marketingCompany: marketingCompanyFilter,
        sortField: sortField,
        sortDirection: sortDirection
      });

      const response = await fetch(`/api/campaigns?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCampaigns(data.campaigns);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        setAvailableFilters(data.filters);
      } else {
        console.error('Failed to fetch campaigns:', data.error);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, mediaChannelFilter, marketingCompanyFilter, sortField, sortDirection]);

  // Initial load
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handle updates when filters/sort change
  useEffect(() => {
    if (!loading) {
      fetchCampaigns(true); // Use refreshing state for updates
    }
  }, [currentPage, debouncedSearchTerm, mediaChannelFilter, marketingCompanyFilter, sortField, sortDirection, fetchCampaigns, loading]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleMediaChannelFilter = (value: string) => {
    setMediaChannelFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleMarketingCompanyFilter = (value: string) => {
    setMarketingCompanyFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span className="text-blue-400">↑</span> : <span className="text-blue-400">↓</span>;
  };

  const getMediaChannelIcon = (channel: string) => {
    const channelLower = channel.toLowerCase();
    
    if (channelLower.includes('instagram')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('facebook')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('twitter') || channelLower.includes('x.com')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('youtube')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('tiktok')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('linkedin')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('email')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      );
    }
    
    if (channelLower.includes('google') || channelLower.includes('search')) {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );
    }
    
    // Default icon for unknown channels
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#202123]">
        <div className="text-[#ECECF1]">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#202123] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-[#ECECF1] mb-8 mt-4">Chime - Competitive Set Campaigns</h1>
        
        {/* Filters and Search */}
        <div className="rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-[#ECECF1] mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full px-3 py-2 bg-[#202123] border border-[#4A4A4A] rounded-lg text-[#ECECF1] placeholder-[#9CA3AF] focus:outline-none focus:border-[#10A37F]"
              />
            </div>
            
            {/* Media Channel Filter */}
            <div>
              <label className="block text-sm font-medium text-[#ECECF1] mb-2">Media Channel</label>
              <select
                value={mediaChannelFilter}
                onChange={(e) => handleMediaChannelFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#202123] border border-[#4A4A4A] rounded-lg text-[#ECECF1] focus:outline-none focus:border-[#10A37F]"
              >
                <option value="">All Channels</option>
                {availableFilters.mediaChannels.map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </div>
            
            {/* Marketing Company Filter */}
            <div>
              <label className="block text-sm font-medium text-[#ECECF1] mb-2">Marketing Company</label>
              <select
                value={marketingCompanyFilter}
                onChange={(e) => handleMarketingCompanyFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#202123] border border-[#4A4A4A] rounded-lg text-[#ECECF1] focus:outline-none focus:border-[#10A37F]"
              >
                <option value="">All Companies</option>
                {availableFilters.marketingCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-[#ECECF1]">
                Showing {campaigns.length} of {totalCount} campaigns
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg overflow-hidden relative">
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#10A37F] animate-pulse z-10"></div>
          )}
          <div className={`overflow-x-auto transition-opacity duration-200 ${isRefreshing ? 'opacity-75' : 'opacity-100'}`}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider">
                    Thumbnail
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('campaign_id')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Campaign ID</span>
                      <SortIcon field="campaign_id" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('campaign_observation_date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Observation Date</span>
                      <SortIcon field="campaign_observation_date" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('media_channel')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Media Channel</span>
                      <SortIcon field="media_channel" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('marketing_company')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Marketing Company</span>
                      <SortIcon field="marketing_company" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('industry')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Industry</span>
                      <SortIcon field="industry" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('estimated_volume')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Estimated Volume</span>
                      <SortIcon field="estimated_volume" />
                    </div>
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-[#ECECF1] uppercase tracking-wider cursor-pointer hover:bg-[#2A2A2A]"
                    onClick={() => handleSort('estimated_spend')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Estimated Spend</span>
                      <SortIcon field="estimated_spend" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-[#2A2A2A] cursor-pointer" onClick={() => handleRowClick(campaign)}>
                    <td className="px-4 py-4">
                      <Image 
                        src={campaign.thumbnail_url?.includes('via.placeholder.com') ? "/images/default-thumbnail.jpeg" : (campaign.thumbnail_url || "/images/default-thumbnail.jpeg")} 
                        alt={campaign.marketing_company}
                        width={64}
                        height={40}
                        className="object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1] font-mono">
                      {campaign.campaign_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1]">
                      {new Date(campaign.campaign_observation_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1]">
                      <div className="flex items-center justify-center" title={campaign.media_channel}>
                        {getMediaChannelIcon(campaign.media_channel)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1] font-medium">
                      {campaign.marketing_company}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1]">
                      {campaign.industry}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1]">
                      {campaign.estimated_volume?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1] font-medium">
                      ${campaign.estimated_spend?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-[#ECECF1]">
              Page {currentPage} of {totalPages} ({totalCount} total campaigns)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isRefreshing}
                className="px-3 py-2 bg-[#343541] text-[#ECECF1] rounded-lg hover:bg-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isRefreshing}
                className="px-3 py-2 bg-[#343541] text-[#ECECF1] rounded-lg hover:bg-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Detail Modal */}
      {isModalOpen && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#202123] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-[#ECECF1]">Campaign Details</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#9CA3AF] hover:text-[#ECECF1] text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Image and Basic Info */}
                <div className="space-y-4">
                  <div className="bg-[#343541] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-3">Campaign Image</h3>
                    <div className="flex justify-center">
                      <Image 
                        src={selectedCampaign.thumbnail_url?.includes('via.placeholder.com') ? "/images/default-thumbnail.jpeg" : (selectedCampaign.thumbnail_url || "/images/default-thumbnail.jpeg")} 
                        alt={selectedCampaign.marketing_company}
                        width={300}
                        height={200}
                        className="object-cover rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="bg-[#343541] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-3">Basic Information</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[#9CA3AF]">Campaign ID:</span>
                        <span className="text-[#ECECF1] ml-2 font-mono">{selectedCampaign.campaign_id}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF]">Date:</span>
                        <span className="text-[#ECECF1] ml-2">{new Date(selectedCampaign.campaign_observation_date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF]">Company:</span>
                        <span className="text-[#ECECF1] ml-2 font-medium">{selectedCampaign.marketing_company}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF]">Industry:</span>
                        <span className="text-[#ECECF1] ml-2">{selectedCampaign.industry}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Detailed Information */}
                <div className="space-y-4">
                  <div className="bg-[#343541] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-3">Media & Channel</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-[#9CA3AF]">Media Channel:</span>
                        <div className="flex items-center mt-1">
                          {getMediaChannelIcon(selectedCampaign.media_channel)}
                          <span className="text-[#ECECF1] ml-2">{selectedCampaign.media_channel}</span>
                        </div>
                      </div>
                      {selectedCampaign.subindustry && (
                        <div>
                          <span className="text-[#9CA3AF]">Subindustry:</span>
                          <span className="text-[#ECECF1] ml-2">{selectedCampaign.subindustry}</span>
                        </div>
                      )}
                      {selectedCampaign.product_type && (
                        <div>
                          <span className="text-[#9CA3AF]">Product Type:</span>
                          <span className="text-[#ECECF1] ml-2">{selectedCampaign.product_type}</span>
                        </div>
                      )}
                      {selectedCampaign.brand && (
                        <div>
                          <span className="text-[#9CA3AF]">Brand:</span>
                          <span className="text-[#ECECF1] ml-2">{selectedCampaign.brand}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#343541] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[#9CA3AF] text-sm">Estimated Volume</span>
                        <div className="text-[#ECECF1] font-semibold text-lg">
                          {selectedCampaign.estimated_volume?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF] text-sm">Estimated Spend</span>
                        <div className="text-[#ECECF1] font-semibold text-lg">
                          ${selectedCampaign.estimated_spend?.toLocaleString() || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {(selectedCampaign.post_link || selectedCampaign.landing_page || selectedCampaign.subject_line) && (
                    <div className="bg-[#343541] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-[#ECECF1] mb-3">Additional Details</h3>
                      <div className="space-y-2">
                        {selectedCampaign.post_link && (
                          <div>
                            <span className="text-[#9CA3AF]">Post Link:</span>
                            <a 
                              href={selectedCampaign.post_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#10A37F] ml-2 hover:underline"
                            >
                              View Post
                            </a>
                          </div>
                        )}
                        {selectedCampaign.landing_page && (
                          <div>
                            <span className="text-[#9CA3AF]">Landing Page:</span>
                            <a 
                              href={selectedCampaign.landing_page} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[#10A37F] ml-2 hover:underline"
                            >
                              Visit Page
                            </a>
                          </div>
                        )}
                        {selectedCampaign.subject_line && (
                          <div>
                            <span className="text-[#9CA3AF]">Subject Line:</span>
                            <div className="text-[#ECECF1] mt-1 p-2 bg-[#2A2A2A] rounded">
                              {selectedCampaign.subject_line}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
