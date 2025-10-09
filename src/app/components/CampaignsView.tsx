'use client';

import { useState, useEffect } from 'react';

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

export default function CampaignsView({ onViewChange }: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
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
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage, searchTerm, mediaChannelFilter, marketingCompanyFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">↕</span>;
    }
    return sortDirection === 'asc' ? <span className="text-blue-400">↑</span> : <span className="text-blue-400">↓</span>;
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
        <h1 className="text-3xl font-bold text-[#ECECF1] mb-6">Marketing Campaigns</h1>
        
        {/* Filters and Search */}
        <div className="bg-[#343541] rounded-lg p-4 mb-6">
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
        <div className="bg-[#343541] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#202123]">
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
              <tbody className="divide-y divide-[#4A4A4A]">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-[#2A2A2A]">
                    <td className="px-4 py-4">
                      <img 
                        src={campaign.thumbnail_url} 
                        alt={campaign.marketing_company}
                        className="w-16 h-10 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1] font-mono">
                      {campaign.campaign_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1]">
                      {new Date(campaign.campaign_observation_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-[#ECECF1]">
                      <span className="px-2 py-1 bg-[#10A37F] text-white rounded-full text-xs">
                        {campaign.media_channel}
                      </span>
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
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-[#343541] text-[#ECECF1] rounded-lg hover:bg-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-[#343541] text-[#ECECF1] rounded-lg hover:bg-[#4A4A4A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
