'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Chart to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DashboardViewProps {
  onViewChange: (view: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DashboardView({ onViewChange }: DashboardViewProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = { role: 'user' as const, content: chatMessage };
    setChatHistory(prev => [...prev, newMessage]);
    const currentInput = chatMessage;
    setChatMessage('');
    setIsLoading(true);
    
    try {
      // Step 1: Analyze intent
      console.log('Step 1: Analyzing intent...');
      const intentResponse = await fetch('/api/chat/chime/intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: currentInput,
          selectedCharts: Array.from(selectedCharts)
        }),
      });

      if (!intentResponse.ok) {
        throw new Error('Intent analysis failed');
      }

      const intentData = await intentResponse.json();
      console.log('Intent analysis result:', intentData);

      // Step 2: Gather data using the new gather API
      console.log('Step 2: Gathering data...');
      const gatherResponse = await fetch('/api/chat/chime/gather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intentResponse: intentData,
          selectedCharts: Array.from(selectedCharts)
        }),
      });

      if (!gatherResponse.ok) {
        throw new Error('Data gathering failed');
      }

      const gatherData = await gatherResponse.json();
      const contextText = gatherData.contextText || '';
      const chartContext = gatherData.chartContext || '';
      
      console.log('Data gathering results:', {
        facetCount: gatherData.facetCount,
        successCount: gatherData.successCount,
        contextLength: contextText.length,
        chartContext: chartContext
      });
      
      // Step 3: Send to chat API with context
      console.log('Step 3: Sending to chat API...');
      const chatResponse = await fetch('/api/chat/chime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          isInitialRequest: false,
          selectedCharts: Array.from(selectedCharts),
          contextText: contextText,
          chartContext: chartContext
        }),
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        const aiResponse = { role: 'assistant' as const, content: chatData.response };
        setChatHistory(prev => [...prev, aiResponse]);
      } else {
        throw new Error('Chat API failed');
      }
    } catch (error) {
      console.error('Error in chat workflow:', error);
      const errorResponse = { role: 'assistant' as const, content: 'Sorry, I encountered an error processing your request. Please try again.' };
      setChatHistory(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [spendData, setSpendData] = useState<Array<{ name: string; data: number[] }>>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(new Set());

  // Fetch spend data from API
  useEffect(() => {
    const fetchSpendData = async () => {
      try {
        const response = await fetch('/api/spend-summary?chartType=all');
        const data = await response.json();
        
        if (response.ok) {
          setSpendData(data.spendData);
          setMonths(data.months);
        } else {
          console.error('Failed to fetch spend data:', data.error);
        }
      } catch (error) {
        console.error('Error fetching spend data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpendData();
  }, []);

  // Handle chart selection
  const handleChartClick = (chartId: string) => {
    setSelectedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chartId)) {
        newSet.delete(chartId);
      } else {
        newSet.add(chartId);
      }
      return newSet;
    });
  };

  // Create chart configurations for different charts
  const createChartConfig = (series: Array<{ name: string; data: number[] }>) => {
    return {
      type: "line" as const,
      height: 400,
      series: series,
      options: {
        chart: {
          toolbar: {
            show: false,
          },
        },
        title: {
          text: '',
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ECECF1'
          }
        },
        dataLabels: {
          enabled: false,
        },
        colors: ["#1e40af", "#dc2626", "#059669", "#7c3aed", "#f59e0b", "#ef4444"],
        stroke: {
          lineCap: "round" as const,
          curve: "smooth" as const,
          width: 2,
        },
        markers: {
          size: 4,
        },
        xaxis: {
          axisTicks: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
          labels: {
            style: {
              colors: "#9ca3af",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
          },
          categories: months,
        },
        yaxis: {
          labels: {
            style: {
              colors: "#9ca3af",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 400,
            },
            formatter: (value: number) => `$${(value / 1000000).toFixed(0)}M`,
          },
          min: 0,
        },
        grid: {
          show: true,
          borderColor: "#374151",
          strokeDashArray: 5,
          xaxis: {
            lines: {
              show: true,
            },
          },
          padding: {
            top: 5,
            right: 20,
          },
        },
        fill: {
          opacity: 0.8,
        },
        tooltip: {
          theme: "dark" as const,
          y: {
            formatter: (value: number) => `$${(value / 1000000).toFixed(1)}M`,
          },
        },
        legend: {
          position: "top" as const,
          horizontalAlign: "left" as const,
          labels: {
            colors: "#9ca3af",
          },
        },
      },
    };
  };

  // Create chart data and configurations when data is available
  const creditCardData = spendData.filter(item => 
    ['Chime', 'American Express', 'Capital One', 'Discover'].includes(item.name)
  );
  
  const creditBuilderData = spendData.filter(item => 
    ['Chime', 'Credit Karma', 'Self Financial'].includes(item.name)
  );

  const ewaData = spendData.filter(item => 
    ['Chime', 'Dave', 'Earnin', 'Empower Finance', 'MoneyLion'].includes(item.name)
  );

  const neobankData = spendData.filter(item => 
    ['Chime', 'Ally', 'Current', 'One Finance', 'Varo'].includes(item.name)
  );

  const otherData = spendData.filter(item => 
    ['Chime', 'Rocket Money', 'SoFI'].includes(item.name)
  );

  const p2pData = spendData.filter(item => 
    ['Chime', 'CashApp', 'PayPal', 'Venmo'].includes(item.name)
  );

  const traditionalData = spendData.filter(item => 
    ['Chime', 'Bank of America', 'Chase', 'Wells Fargo'].includes(item.name)
  );

  // Only create chart configurations when months data is available
  const creditCardConfig = months.length > 0 ? createChartConfig(creditCardData) : null;
  const creditBuilderConfig = months.length > 0 ? createChartConfig(creditBuilderData) : null;
  const ewaConfig = months.length > 0 ? createChartConfig(ewaData) : null;
  const neobankConfig = months.length > 0 ? createChartConfig(neobankData) : null;
  const otherConfig = months.length > 0 ? createChartConfig(otherData) : null;
  const p2pConfig = months.length > 0 ? createChartConfig(p2pData) : null;
  const traditionalConfig = months.length > 0 ? createChartConfig(traditionalData) : null;

  return (
    <div className="flex h-screen bg-[#202123]">
      {/* Left side - Chat (1/3 of screen) */}
      <div className="w-1/3 border-r border-[#343541] flex flex-col">
        <div className="p-4 border-b border-[#343541]">
          <h2 className="text-lg font-semibold text-[#ECECF1]">Dashboard Chat</h2>
        </div>
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-[#10A37F] text-[#ECECF1]'
                    : 'bg-[#343541] text-[#ECECF1]'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {/* Thinking Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#343541] border border-[#343541] px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#10A37F]"></div>
                  <span className="text-[#ECECF1]">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Input */}
        <div className="p-4 border-t border-[#343541]">
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your analytics..."
              className="flex-1 px-3 py-2 bg-[#343541] border border-[#4A4A4A] rounded-lg text-[#ECECF1] placeholder-[#9CA3AF] focus:outline-none focus:border-[#10A37F]"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-[#10A37F] text-[#ECECF1] rounded-lg hover:bg-[#0D8A6B] transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right side - Charts (2/3 of screen) */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-[#ECECF1] mb-6">Analytics Dashboard</h1>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-[#ECECF1]">Loading spend data...</div>
            </div>
          ) : (
            <>
                  {/* Chart 1 - Credit Card */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('credit-card') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('credit-card')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">Credit Card</h3>
                    {creditCardConfig && <Chart {...creditCardConfig} />}
                  </div>

                  {/* Chart 2 - Credit Builder */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('credit-builder') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('credit-builder')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">Credit Builder</h3>
                    {creditBuilderConfig && <Chart {...creditBuilderConfig} />}
                  </div>

                  {/* Chart 3 - EWA */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('ewa') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('ewa')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">EWA</h3>
                    {ewaConfig && <Chart {...ewaConfig} />}
                  </div>

                  {/* Chart 4 - Neobank */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('neobank') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('neobank')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">Neobank</h3>
                    {neobankConfig && <Chart {...neobankConfig} />}
                  </div>

                  {/* Chart 5 - Other */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('other') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('other')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">Other</h3>
                    {otherConfig && <Chart {...otherConfig} />}
                  </div>

                  {/* Chart 6 - P2P */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('p2p') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('p2p')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">P2P</h3>
                    {p2pConfig && <Chart {...p2pConfig} />}
                  </div>

                  {/* Chart 7 - Traditional */}
                  <div 
                    className={`rounded-lg p-6 cursor-pointer transition-colors duration-200 ${
                      selectedCharts.has('traditional') 
                        ? 'bg-[#343541]' 
                        : 'bg-transparent hover:bg-[#2a2a2a]'
                    }`}
                    onClick={() => handleChartClick('traditional')}
                  >
                    <h3 className="text-lg font-semibold text-[#ECECF1] mb-4">Traditional</h3>
                    {traditionalConfig && <Chart {...traditionalConfig} />}
                  </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
