'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Brain,
  Target,
  ArrowLeft,
  Filter,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Building2,
  BarChart3,
  Zap,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ActionableEntityCard,
  ActionableEntityList,
  KPICard,
  LoanTypeBadge,
  formatCurrency,
  mockFacilityPrediction,
  mockFacilities,
  mockDivestmentCandidates,
  createFacilityActionableEntity,
  createKPIActionableEntity,
  toDivestmentAction,
  toDivestmentOutcome,
  sortByPriority,
  filterRequiringAttention,
  type FacilityActionableEntity,
  type KPIActionableEntity,
  type ActionableEntity,
  type EntityBase,
  type ActionBase,
  type OutcomeBase,
  type PortfolioPositionEntity,
  type DivestmentAction,
  type DivestmentOutcome,
} from '@/app/features/esg';

/**
 * ESG Decision Support Page
 *
 * This page demonstrates the Entity-Action-Outcome pattern for unified
 * decision support across facilities, KPIs, and portfolio positions.
 */
export default function ESGDecisionSupportPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Transform existing data into ActionableEntity pattern
  const {
    facilityEntities,
    kpiEntities,
    portfolioEntities,
    allEntities,
    stats,
  } = useMemo(() => {
    // Create facility actionable entity from prediction
    const facilityEntity = createFacilityActionableEntity(mockFacilityPrediction);

    // Create KPI actionable entities
    const kpiEntities: KPIActionableEntity[] = mockFacilityPrediction.kpi_predictions.map((pred) => {
      // Find the matching KPI data (simplified for demo)
      const mockKPI = {
        id: pred.kpi_id,
        kpi_name: pred.kpi_name,
        kpi_category: pred.kpi_category,
        unit: pred.unit,
        baseline_value: pred.baseline_value,
        baseline_year: 2020,
        current_value: pred.current_value,
        weight: 25,
        is_active: true,
        targets: [{
          target_year: parseInt(pred.target_date.split('-')[0]),
          target_value: pred.target_value,
          target_status: pred.will_miss_target ? 'at_risk' as const : 'on_track' as const,
        }],
      };

      return createKPIActionableEntity(
        mockKPI,
        pred,
        mockFacilityPrediction.facility_id,
        mockFacilityPrediction.facility_name,
        mockFacilityPrediction.recommended_actions
      );
    });

    // Create portfolio position actionable entities from divestment candidates
    const portfolioEntities: ActionableEntity<PortfolioPositionEntity, DivestmentAction, DivestmentOutcome>[] =
      mockDivestmentCandidates.map((candidate) => {
        const entity: PortfolioPositionEntity = {
          id: candidate.facility_id,
          name: candidate.facility_name,
          entityType: 'portfolio_position',
          description: `${candidate.borrower_name} - ${candidate.borrower_industry}`,
          exposure: candidate.current_exposure,
          percentage: (candidate.current_exposure / 500000000) * 100, // Mock portfolio total
          esgScore: candidate.esg_score,
          riskLevel: candidate.esg_performance === 'off_track' ? 'critical' : candidate.esg_performance === 'at_risk' ? 'high' : 'low',
          dimension: 'borrower',
        };

        const action = toDivestmentAction(candidate);
        const outcome = toDivestmentOutcome(candidate, action.id);

        return {
          id: `actionable-portfolio-${candidate.id}`,
          entity,
          availableActions: [action],
          predictedOutcomes: { [action.id]: outcome },
          currentState: {
            status: candidate.esg_performance,
            riskLevel: candidate.esg_performance === 'off_track' ? 'critical' : candidate.esg_performance === 'at_risk' ? 'high' : 'low',
            actionRecommended: candidate.priority === 'high',
            currentValue: candidate.esg_score,
            targetValue: 70, // Mock target
          },
          generatedAt: new Date().toISOString(),
          requiresAttention: candidate.priority === 'high',
          priorityRank: candidate.priority === 'high' ? 80 : candidate.priority === 'medium' ? 50 : 20,
        };
      });

    // Combine all entities
    const allEntities = [
      facilityEntity,
      ...kpiEntities,
      ...portfolioEntities,
    ] as ActionableEntity<EntityBase, ActionBase, OutcomeBase>[];

    // Calculate stats
    const requiresAttention = allEntities.filter(e => e.requiresAttention).length;
    const totalActions = allEntities.reduce((sum, e) => sum + e.availableActions.length, 0);

    return {
      facilityEntities: [facilityEntity],
      kpiEntities,
      portfolioEntities,
      allEntities: sortByPriority(allEntities),
      stats: {
        totalEntities: allEntities.length,
        requiresAttention,
        totalActions,
        criticalActions: allEntities.filter(e => e.currentState.riskLevel === 'critical').length,
      },
    };
  }, []);

  // Filter entities based on selection
  const filteredEntities = useMemo(() => {
    let entities = allEntities;

    if (selectedTab === 'facilities') {
      entities = facilityEntities as ActionableEntity<EntityBase, ActionBase, OutcomeBase>[];
    } else if (selectedTab === 'kpis') {
      entities = kpiEntities as ActionableEntity<EntityBase, ActionBase, OutcomeBase>[];
    } else if (selectedTab === 'portfolio') {
      entities = portfolioEntities as ActionableEntity<EntityBase, ActionBase, OutcomeBase>[];
    } else if (selectedTab === 'attention') {
      entities = filterRequiringAttention(allEntities);
    }

    if (filterPriority !== 'all') {
      entities = entities.filter(e => {
        if (filterPriority === 'critical') return e.currentState.riskLevel === 'critical';
        if (filterPriority === 'high') return e.currentState.riskLevel === 'high' || e.currentState.riskLevel === 'critical';
        return true;
      });
    }

    return entities;
  }, [allEntities, facilityEntities, kpiEntities, portfolioEntities, selectedTab, filterPriority]);

  const handlePrimaryAction = (entity: ActionableEntity<EntityBase, ActionBase, OutcomeBase>, action: ActionBase) => {
    console.log('Primary action triggered:', entity.id, action.id);
    // In a real app, this would trigger the action workflow
  };

  const handleViewDetails = (entity: ActionableEntity<EntityBase, ActionBase, OutcomeBase>) => {
    console.log('View details:', entity.id);
    // In a real app, this would navigate to detail page
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/esg">
            <Button variant="ghost" size="sm" data-testid="back-to-esg-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to ESG
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-zinc-900">Decision Support Center</h1>
            </div>
            <p className="text-zinc-500 mt-1">
              Unified view of all actionable ESG entities with AI-recommended interventions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40" data-testid="priority-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical Only</SelectItem>
              <SelectItem value="high">High & Critical</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500 delay-100">
        <KPICard
          title="Total Actionable Items"
          value={stats.totalEntities.toString()}
          subtitle={`${stats.requiresAttention} need attention`}
          variant="default"
          icon={<Target className="w-5 h-5 text-purple-600" />}
        />
        <KPICard
          title="Critical Actions"
          value={stats.criticalActions.toString()}
          subtitle="Require immediate action"
          variant={stats.criticalActions > 0 ? 'danger' : 'success'}
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
        />
        <KPICard
          title="Available Actions"
          value={stats.totalActions.toString()}
          subtitle="AI-recommended interventions"
          variant="default"
          icon={<Zap className="w-5 h-5 text-amber-600" />}
        />
        <KPICard
          title="Potential Savings"
          value={formatCurrency(450000)}
          subtitle="If all actions executed"
          variant="success"
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
        />
      </div>

      {/* Entity-Action-Outcome Pattern Info */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50/50 to-white animate-in slide-in-from-top-4 duration-500 delay-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 mb-1">Entity-Action-Outcome Pattern</h3>
              <p className="text-sm text-zinc-600 mb-3">
                This view unifies all ESG decision support into a single abstraction. Each card represents
                an <span className="font-medium">Entity</span> (facility, KPI, or portfolio position) with
                available <span className="font-medium">Actions</span> (interventions, scenarios, divestments)
                and predicted <span className="font-medium">Outcomes</span> (margin impact, ESG improvement).
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-zinc-600">{facilityEntities.length} Facilities</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-zinc-600">{kpiEntities.length} KPIs</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="text-zinc-600">{portfolioEntities.length} Positions</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="animate-in slide-in-from-bottom-4 duration-500 delay-300"
      >
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all" data-testid="tab-all">
            <Target className="w-4 h-4 mr-2" />
            All Items
            <Badge variant="secondary" className="ml-2">{allEntities.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="attention" data-testid="tab-attention">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Needs Attention
            <Badge variant="destructive" className="ml-2">{stats.requiresAttention}</Badge>
          </TabsTrigger>
          <TabsTrigger value="facilities" data-testid="tab-facilities">
            <Building2 className="w-4 h-4 mr-2" />
            Facilities
          </TabsTrigger>
          <TabsTrigger value="kpis" data-testid="tab-kpis">
            <TrendingUp className="w-4 h-4 mr-2" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="portfolio" data-testid="tab-portfolio">
            <BarChart3 className="w-4 h-4 mr-2" />
            Portfolio
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {filteredEntities.length > 0 ? (
            <>
              {/* Quick Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  Showing {filteredEntities.length} actionable item{filteredEntities.length !== 1 ? 's' : ''},
                  sorted by priority
                </p>
                {filteredEntities.some(e => e.requiresAttention) && (
                  <Badge variant="outline" className="text-amber-600 border-amber-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {filteredEntities.filter(e => e.requiresAttention).length} items need attention
                  </Badge>
                )}
              </div>

              {/* Actionable Entity List */}
              <ActionableEntityList
                entities={filteredEntities}
                onPrimaryAction={handlePrimaryAction}
                onViewDetails={handleViewDetails}
                sortByPriority
              />
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">All Clear!</h3>
              <p className="text-zinc-500">No actionable items match your current filters.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
