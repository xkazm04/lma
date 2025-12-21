'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Target,
  Users,
  TrendingDown,
  Sparkles,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  Lightbulb,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  KPICard,
  ConcentrationChart,
  SectorAllocationChart,
  MarketBenchmarkCard,
  InstitutionalTargetsCard,
  DiversificationOpportunityCard,
  SyndicationOpportunityCard,
  DivestmentCandidateCard,
  OptimizationScenarioCard,
  PortfolioESGScoreCard,
  formatCurrency,
  mockPortfolioOptimization,
} from '@/app/features/esg';

export default function PortfolioOptimizationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const data = mockPortfolioOptimization;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleParticipate = (opportunityId: string) => {
    console.log('Participate in:', opportunityId);
    // Would open a participation workflow modal
  };

  const handleDivest = (candidateId: string) => {
    console.log('Initiate divestment for:', candidateId);
    // Would open a divestment workflow modal
  };

  const handleSelectScenario = (scenarioId: string) => {
    console.log('Selected scenario:', scenarioId);
  };

  const handleRunSimulation = (scenarioId: string) => {
    console.log('Run simulation for:', scenarioId);
    // Would run a simulation and show results
  };

  // Calculate summary stats
  const exceedsLimitCount = data.concentration_analysis.filter(c => c.status === 'exceeds_limit').length;
  const atRiskTargets = data.institutional_targets.filter(t => t.status === 'at_risk' || t.status === 'off_track').length;
  const urgentOpportunities = data.syndication_opportunities.filter(s => {
    const daysUntil = Math.ceil((new Date(s.syndication_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30;
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/esg">
            <Button variant="ghost" size="sm" data-testid="back-to-esg-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Portfolio Optimization Engine</h1>
            <p className="text-zinc-500">Optimize your ESG loan mix for better performance and risk management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="refresh-analysis-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
          <Button variant="outline" data-testid="export-portfolio-btn">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Portfolio Score and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PortfolioESGScoreCard data={data.portfolio_esg_score} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <KPICard
            title="Total Portfolio"
            value={formatCurrency(data.total_portfolio_value)}
            subtitle={`${data.total_facilities} ESG facilities`}
            icon={<Layers className="w-5 h-5 text-blue-600" />}
          />
          <KPICard
            title="Concentration Alerts"
            value={exceedsLimitCount.toString()}
            subtitle="Exposures exceed limits"
            variant={exceedsLimitCount > 0 ? 'danger' : 'success'}
            icon={<Filter className="w-5 h-5 text-amber-600" />}
          />
          <KPICard
            title="Syndication Pipeline"
            value={data.syndication_opportunities.length.toString()}
            subtitle={`${urgentOpportunities} closing within 30 days`}
            icon={<Users className="w-5 h-5 text-green-600" />}
          />
          <KPICard
            title="Targets At Risk"
            value={atRiskTargets.toString()}
            subtitle={`of ${data.institutional_targets.length} institutional targets`}
            variant={atRiskTargets > 0 ? 'warning' : 'success'}
            icon={<Target className="w-5 h-5 text-purple-600" />}
          />
        </div>
      </div>

      {/* Action Alerts */}
      {data.recommended_actions.filter(a => a.priority === 'critical' || a.priority === 'high').length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 animate-in slide-in-from-top-4 duration-500 delay-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-800">Priority Actions</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Recommended portfolio adjustments requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommended_actions
                .filter(a => a.priority === 'critical' || a.priority === 'high')
                .map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/50"
                    data-testid={`action-item-${action.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={action.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {action.priority}
                      </Badge>
                      <div>
                        <div className="font-medium text-zinc-900">{action.title}</div>
                        <div className="text-sm text-zinc-500">{action.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-zinc-500">Expected Impact</div>
                        <div className="text-sm font-medium text-zinc-900">{action.expected_impact}</div>
                      </div>
                      {action.deadline && (
                        <div className="text-right">
                          <div className="text-xs text-zinc-500">Deadline</div>
                          <div className="text-sm font-medium text-amber-700">
                            {new Date(action.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="concentration" data-testid="tab-concentration">
            <Filter className="w-4 h-4 mr-2" />
            Concentration
          </TabsTrigger>
          <TabsTrigger value="opportunities" data-testid="tab-opportunities">
            <Users className="w-4 h-4 mr-2" />
            Syndication
          </TabsTrigger>
          <TabsTrigger value="divestment" data-testid="tab-divestment">
            <TrendingDown className="w-4 h-4 mr-2" />
            Divestment
          </TabsTrigger>
          <TabsTrigger value="scenarios" data-testid="tab-scenarios">
            <Sparkles className="w-4 h-4 mr-2" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectorAllocationChart data={data.sector_allocation} />
            <MarketBenchmarkCard data={data.market_benchmarks} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InstitutionalTargetsCard data={data.institutional_targets} />
            <DiversificationOpportunityCard
              data={data.diversification_opportunities}
              onViewOpportunity={(id) => console.log('View opportunity:', id)}
            />
          </div>
        </TabsContent>

        {/* Concentration Tab */}
        <TabsContent value="concentration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConcentrationChart
              data={data.concentration_analysis.filter(c => c.dimension === 'industry')}
              title="Industry Concentration"
              description="Portfolio exposure by industry sector vs limits"
              filterDimension="industry"
            />
            <ConcentrationChart
              data={data.concentration_analysis.filter(c => c.dimension === 'loan_type')}
              title="Loan Type Concentration"
              description="Portfolio exposure by ESG loan type vs limits"
              filterDimension="loan_type"
            />
          </div>
          <ConcentrationChart
            data={data.concentration_analysis.filter(c => c.dimension === 'borrower')}
            title="Single Borrower Concentration"
            description="Top borrower exposures vs single name limits"
            filterDimension="borrower"
          />
        </TabsContent>

        {/* Syndication Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-6">
          <SyndicationOpportunityCard
            data={data.syndication_opportunities}
            onParticipate={handleParticipate}
            onViewDetails={(id) => console.log('View syndication details:', id)}
          />
        </TabsContent>

        {/* Divestment Tab */}
        <TabsContent value="divestment" className="space-y-6">
          <DivestmentCandidateCard
            data={data.divestment_candidates}
            onInitiateDivestment={handleDivest}
            onViewDetails={(id) => console.log('View facility:', id)}
          />
        </TabsContent>

        {/* Optimization Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <OptimizationScenarioCard
            data={data.optimization_scenarios}
            onSelectScenario={handleSelectScenario}
            onRunSimulation={handleRunSimulation}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900">Need help optimizing your portfolio?</h3>
              <p className="text-sm text-zinc-500">
                Our AI assistant can help you analyze trade-offs and build custom scenarios.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/esg/facilities">
                <Button variant="outline" data-testid="view-facilities-btn">
                  <Building2 className="w-4 h-4 mr-2" />
                  View All Facilities
                </Button>
              </Link>
              <Link href="/esg/ai">
                <Button data-testid="ai-assistant-btn">
                  <Sparkles className="w-4 h-4 mr-2" />
                  ESG AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
