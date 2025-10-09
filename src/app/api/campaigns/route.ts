import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const mediaChannel = searchParams.get('mediaChannel') || '';
    const marketingCompany = searchParams.get('marketingCompany') || '';
    const sortField = searchParams.get('sortField') || 'campaign_observation_date';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the query
    let query = supabase
      .from('marketing_campaigns')
      .select('*', { count: 'exact' });
    
    // Apply search filter
    if (search) {
      query = query.or(`campaign_id.ilike.%${search}%,marketing_company.ilike.%${search}%,industry.ilike.%${search}%`);
    }
    
    // Apply media channel filter
    if (mediaChannel) {
      query = query.eq('media_channel', mediaChannel);
    }
    
    // Apply marketing company filter
    if (marketingCompany) {
      query = query.eq('marketing_company', marketingCompany);
    }
    
    // Apply sorting
    query = query.order(sortField, { ascending: sortDirection === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }
    
    // Get unique values for filters
    const { data: mediaChannels } = await supabase
      .from('marketing_campaigns')
      .select('media_channel')
      .not('media_channel', 'is', null);
    
    const { data: marketingCompanies } = await supabase
      .from('marketing_campaigns')
      .select('marketing_company')
      .not('marketing_company', 'is', null);
    
    // Get unique values
    const uniqueMediaChannels = [...new Set(mediaChannels?.map(item => item.media_channel) || [])];
    const uniqueMarketingCompanies = [...new Set(marketingCompanies?.map(item => item.marketing_company) || [])];
    
    return NextResponse.json({
      campaigns: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      filters: {
        mediaChannels: uniqueMediaChannels,
        marketingCompanies: uniqueMarketingCompanies
      }
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
