import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('chartType') || 'all';
    
    // Get spend summary data, filtering out summary rows
    let query = supabase
      .from('spend_summary')
      .select('*')
      .not('date_coded', 'like', '%Total%')
      .not('date_coded', 'like', '%month-over-month%')
      .not('date_coded', 'like', '%YoY%')
      .not('date_coded', 'like', '%vs L3M%')
      .not('date_coded', 'like', '%Jan + Feb%')
      .not('date_coded', 'like', '%Grand Total%')
      .order('date_coded', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch spend summary data' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ spendData: [], months: [] });
    }
    
    // Sort data by date_coded to ensure chronological order
    const sortedData = data.sort((a, b) => {
      // Convert date_coded to Date objects for proper sorting
      const dateA = new Date(a.date_coded);
      const dateB = new Date(b.date_coded);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Generate months array from the sorted data
    const months = sortedData.map(item => item.date_coded);
    
    // Prepare chart data - add all companies once to avoid duplicates
    let chartData = [];
    
    // Add all companies with their data
    chartData.push({
      name: 'Chime',
      data: sortedData.map(item => item.chime || 0)
    });
    chartData.push({
      name: 'American Express',
      data: sortedData.map(item => item.american_express || 0)
    });
    chartData.push({
      name: 'Capital One',
      data: sortedData.map(item => item.capital_one || 0)
    });
    chartData.push({
      name: 'Discover',
      data: sortedData.map(item => item.discover || 0)
    });
    chartData.push({
      name: 'Credit Karma',
      data: sortedData.map(item => item.credit_karma || 0)
    });
    chartData.push({
      name: 'Self Financial',
      data: sortedData.map(item => item.self_financial || 0)
    });
    chartData.push({
      name: 'Dave',
      data: sortedData.map(item => item.dave || 0)
    });
    chartData.push({
      name: 'Earnin',
      data: sortedData.map(item => item.earnin || 0)
    });
    chartData.push({
      name: 'Empower Finance',
      data: sortedData.map(item => item.empower_finance || 0)
    });
    chartData.push({
      name: 'MoneyLion',
      data: sortedData.map(item => item.moneylion || 0)
    });
    chartData.push({
      name: 'Ally',
      data: sortedData.map(item => item.ally || 0)
    });
    chartData.push({
      name: 'Current',
      data: sortedData.map(item => item.current || 0)
    });
    chartData.push({
      name: 'One Finance',
      data: sortedData.map(item => item.one_finance || 0)
    });
    chartData.push({
      name: 'Varo',
      data: sortedData.map(item => item.varo || 0)
    });
    chartData.push({
      name: 'Rocket Money',
      data: sortedData.map(item => item.rocket_money || 0)
    });
    chartData.push({
      name: 'SoFI',
      data: sortedData.map(item => item.sofi || 0)
    });
    chartData.push({
      name: 'CashApp',
      data: sortedData.map(item => item.cashapp || 0)
    });
    chartData.push({
      name: 'PayPal',
      data: sortedData.map(item => item.paypal || 0)
    });
    chartData.push({
      name: 'Venmo',
      data: sortedData.map(item => item.venmo || 0)
    });
    chartData.push({
      name: 'Bank of America',
      data: sortedData.map(item => item.bank_of_america || 0)
    });
    chartData.push({
      name: 'Chase',
      data: sortedData.map(item => item.chase || 0)
    });
    chartData.push({
      name: 'Wells Fargo',
      data: sortedData.map(item => item.wells_fargo || 0)
    });
    
    return NextResponse.json({
      spendData: chartData,
      months: months,
      totalRecords: data.length
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
