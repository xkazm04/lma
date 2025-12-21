'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  ArrowLeft,
  RefreshCw,
  Filter,
  Lightbulb,
  Clock,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  KPICard,
  LoanTypeBadge,
  PredictionCard,
  WhatIfScenarioCard,
  MarginImpactChart,
  formatCurrency,
  mockFacilityPrediction,
  mockFacilities,
} from '@/app/features/esg';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

const riskLevelColors: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

export default function ESGPredictionsPage() {
  const [selectedFacility, setSelectedFacility] = useState('1');
  const [predictionHorizon, setPredictionHorizon] = useState('90');
  const [isGenerating, setIsGenerating] = useState(false);

  const prediction = mockFacilityPrediction;

  const handleGeneratePrediction = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => setIsGenerating(false), 2000);
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
              <h1 className="text-2xl font-bold text-zinc-900">AI Performance Predictor</h1>
            </div>
            <p className="text-zinc-500 mt-1">
              Forecast KPI trajectories and margin impacts 60-90 days in advance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-64" data-testid="facility-select">
              <SelectValue placeholder="Select facility" />
            </SelectTrigger>
            <SelectContent>
              {mockFacilities.map((facility) => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.facility_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={predictionHorizon} onValueChange={setPredictionHorizon}>
            <SelectTrigger className="w-40" data-testid="horizon-select">
              <SelectValue placeholder="Horizon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleGeneratePrediction}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="generate-prediction-btn"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate Prediction
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-500 delay-100">
        <KPICard
          title="KPIs On Track"
          value={`${prediction.summary.kpis_on_track}/${prediction.summary.total_kpis}`}
          subtitle={`${prediction.summary.kpis_at_risk} at risk`}
          variant="success"
          icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        />
        <KPICard
          title="Predicted Margin Change"
          value={`${prediction.summary.predicted_margin_change_bps > 0 ? '+' : ''}${prediction.summary.predicted_margin_change_bps}bps`}
          subtitle={prediction.summary.predicted_margin_change_bps > 0 ? 'Step-up risk' : 'Step-down opportunity'}
          variant={prediction.summary.predicted_margin_change_bps > 0 ? 'warning' : 'success'}
          icon={prediction.summary.predicted_margin_change_bps > 0 ? (
            <TrendingUp className="w-5 h-5 text-amber-600" />
          ) : (
            <TrendingDown className="w-5 h-5 text-green-600" />
          )}
        />
        <KPICard
          title="Financial Exposure"
          value={formatCurrency(prediction.summary.financial_exposure)}
          subtitle="Annual interest impact"
          variant={prediction.summary.financial_exposure > 100000 ? 'danger' : 'default'}
          icon={<DollarSign className="w-5 h-5 text-zinc-600" />}
        />
        <KPICard
          title="Risk Level"
          value={prediction.overall_risk_level.charAt(0).toUpperCase() + prediction.overall_risk_level.slice(1)}
          subtitle={`${prediction.prediction_horizon_days}-day forecast`}
          variant={prediction.overall_risk_level === 'high' || prediction.overall_risk_level === 'critical' ? 'danger' : prediction.overall_risk_level === 'medium' ? 'warning' : 'success'}
          icon={<Target className="w-5 h-5 text-zinc-600" />}
        />
      </div>

      {/* Facility Info Banner */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50/50 to-white animate-in slide-in-from-top-4 duration-500 delay-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-900">{prediction.facility_name}</h2>
                  <LoanTypeBadge type={prediction.esg_loan_type} />
                  <Badge
                    variant="outline"
                    className={riskLevelColors[prediction.overall_risk_level as RiskLevel]}
                  >
                    {prediction.overall_risk_level} risk
                  </Badge>
                </div>
                <p className="text-sm text-zinc-500">{prediction.borrower_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Prediction generated</p>
              <p className="text-sm font-medium text-zinc-700">
                {new Date(prediction.prediction_date).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="predictions" className="animate-in slide-in-from-bottom-4 duration-500 delay-300">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="predictions" data-testid="predictions-tab">
            <Target className="w-4 h-4 mr-2" />
            KPI Predictions
          </TabsTrigger>
          <TabsTrigger value="margin" data-testid="margin-tab">
            <BarChart3 className="w-4 h-4 mr-2" />
            Margin Impact
          </TabsTrigger>
          <TabsTrigger value="scenarios" data-testid="scenarios-tab">
            <Lightbulb className="w-4 h-4 mr-2" />
            What-If Scenarios
          </TabsTrigger>
          <TabsTrigger value="actions" data-testid="actions-tab">
            <CheckCircle className="w-4 h-4 mr-2" />
            Recommended Actions
          </TabsTrigger>
        </TabsList>

        {/* KPI Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">KPI Trajectory Predictions</h3>
              <p className="text-sm text-zinc-500">AI-powered forecasts for each sustainability KPI</p>
            </div>
            <Button variant="outline" size="sm" data-testid="filter-predictions-btn">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prediction.kpi_predictions.map((kpi) => (
              <PredictionCard
                key={kpi.kpi_id}
                prediction={kpi}
                showDetails
              />
            ))}
          </div>
        </TabsContent>

        {/* Margin Impact Tab */}
        <TabsContent value="margin" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Margin Impact Forecast</h3>
            <p className="text-sm text-zinc-500">
              Predicted margin adjustments based on KPI performance trajectory
            </p>
          </div>

          <MarginImpactChart marginImpact={prediction.margin_impact} showBreakdown />

          {/* Historical Context */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Impact Timeline</CardTitle>
              <CardDescription>Projected margin changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-50">
                  <Clock className="w-5 h-5 text-zinc-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">Current Period</p>
                    <p className="text-xs text-zinc-500">Margin: {prediction.margin_impact.current_margin_bps}bps</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">Predicted Next Period</p>
                    <p className="text-xs text-zinc-500">
                      Margin: {prediction.margin_impact.predicted_margin_bps}bps
                      ({prediction.margin_impact.predicted_adjustment_bps > 0 ? '+' : ''}{prediction.margin_impact.predicted_adjustment_bps}bps adjustment)
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-700">
                    Effective {new Date(prediction.margin_impact.effective_date).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* What-If Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">What-If Scenarios</h3>
              <p className="text-sm text-zinc-500">
                Explore how specific interventions could prevent margin step-ups
              </p>
            </div>
            <Button variant="outline" data-testid="create-scenario-btn">
              <Lightbulb className="w-4 h-4 mr-2" />
              Create Custom Scenario
            </Button>
          </div>

          {/* Scenario Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50/50 border-green-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-green-600 font-medium">Total Potential Savings</p>
                  <p className="text-3xl font-bold text-green-700">
                    {formatCurrency(
                      prediction.what_if_scenarios.reduce((sum, s) => sum + (s.financial_benefit || 0), 0)
                    )}
                  </p>
                  <p className="text-xs text-green-500 mt-1">Across all scenarios</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-blue-600 font-medium">Max Margin Improvement</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {Math.abs(Math.min(...prediction.what_if_scenarios.map((s) => s.margin_impact_change)))}bps
                  </p>
                  <p className="text-xs text-blue-500 mt-1">Best case scenario</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50/50 border-purple-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-xs text-purple-600 font-medium">Highest Success Rate</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {Math.max(...prediction.what_if_scenarios.map((s) => s.probability_of_success))}%
                  </p>
                  <p className="text-xs text-purple-500 mt-1">Probability of success</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scenario Cards */}
          <div className="space-y-4">
            {prediction.what_if_scenarios.map((scenario) => (
              <WhatIfScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        </TabsContent>

        {/* Recommended Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Recommended Actions</h3>
            <p className="text-sm text-zinc-500">
              Prioritized interventions to improve ESG performance and prevent margin step-ups
            </p>
          </div>

          <div className="space-y-4">
            {prediction.recommended_actions.map((action, idx) => (
              <Card
                key={action.id}
                className={`transition-all hover:shadow-md ${
                  action.priority === 'critical' || action.priority === 'high'
                    ? 'border-orange-200 bg-orange-50/30'
                    : ''
                }`}
                data-testid={`action-card-${action.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      action.priority === 'critical' || action.priority === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : action.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-zinc-900">{action.title}</h4>
                        <Badge className={priorityColors[action.priority]}>
                          {action.priority}
                        </Badge>
                        {action.potential_margin_benefit_bps > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            -{action.potential_margin_benefit_bps}bps potential
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-600 mb-3">{action.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-zinc-400">Expected Impact</p>
                          <p className="font-medium text-zinc-700">{action.expected_impact}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400">Effort</p>
                          <p className="font-medium text-zinc-700">{action.estimated_effort}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400">KPIs Affected</p>
                          <div className="flex flex-wrap gap-1">
                            {action.kpis_affected.map((kpi) => (
                              <Badge key={kpi} variant="secondary" className="text-xs">
                                {kpi}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      {action.deadline && (
                        <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span>Deadline: {new Date(action.deadline).toLocaleDateString()}</span>
                          </div>
                          <Button variant="ghost" size="sm" data-testid={`action-details-${action.id}`}>
                            View Details
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
