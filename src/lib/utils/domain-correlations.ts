/**
 * Domain-Specific Correlation Engines for LoanOS
 *
 * Pre-configured correlation engines for discovering relationships
 * between loans, documents, deals, compliance items, and ESG metrics.
 */

import {
  CorrelationEngine,
  createCrossCorrelationEngine,
  createSelfCorrelationEngine,
  combineExtractors,
  FeatureExtractors,
  type Entity,
  type CorrelationFactor,
  type Correlation,
  type CorrelationInsight,
} from './correlation-engine';

// ============================================================================
// Domain Entity Types
// ============================================================================

export interface Document extends Entity {
  type: 'document';
  documentType: string;
  uploadedAt: string;
  processedAt?: string;
  dealId?: string;
  borrowerId?: string;
  tags: string[];
  sector?: string;
  region?: string;
  processingTimeMs?: number;
}

export interface Deal extends Entity {
  type: 'deal';
  status: 'active' | 'closed' | 'pending';
  sector: string;
  region: string;
  borrowerId: string;
  startedAt: string;
  closedAt?: string;
  velocity?: number; // days to close
  documentCount?: number;
  negotiationRounds?: number;
}

export interface Borrower extends Entity {
  type: 'borrower';
  name: string;
  sector: string;
  region: string;
  creditRating?: string;
  esgScore?: number;
  totalExposure: number;
  activeLoans: number;
  complianceScore?: number;
}

export interface ComplianceItem extends Entity {
  type: 'compliance';
  itemType: string;
  borrowerId: string;
  dealId?: string;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sector?: string;
  region?: string;
}

export interface ESGMetric extends Entity {
  type: 'esg';
  metricType: string;
  borrowerId: string;
  score: number;
  rating: string;
  sector: string;
  region: string;
  reportedAt: string;
}

// ============================================================================
// Document-Deal Correlation
// ============================================================================

export const documentDealCorrelationEngine = createCrossCorrelationEngine<Document, Deal>(
  combineExtractors(
    // Documents in same sector correlate with deal velocity
    (doc, deal) => {
      const factors: CorrelationFactor<Document, Deal>[] = [];

      if (doc.sector === deal.sector) {
        factors.push({
          factorName: `Sector: ${doc.sector}`,
          factorType: 'sector',
          value: doc.sector,
          impactScore: 0.4,
          entityA: doc,
          entityB: deal,
        });
      }

      if (doc.region === deal.region) {
        factors.push({
          factorName: `Region: ${doc.region}`,
          factorType: 'geography',
          value: doc.region,
          impactScore: 0.3,
          entityA: doc,
          entityB: deal,
        });
      }

      // Document type affects deal velocity
      if (doc.documentType && deal.velocity) {
        factors.push({
          factorName: `Doc type ${doc.documentType} affects velocity`,
          factorType: 'document_type',
          value: { documentType: doc.documentType, velocity: deal.velocity },
          impactScore: 0.3,
          entityA: doc,
          entityB: deal,
        });
      }

      return factors;
    }
  ),
  {
    minStrength: 0.2,
  }
);

// ============================================================================
// Borrower-ESG Correlation
// ============================================================================

export const borrowerESGCorrelationEngine = createCrossCorrelationEngine<Borrower, ESGMetric>(
  combineExtractors(
    // Direct borrower link
    (borrower, esg) => {
      if (borrower.id === esg.borrowerId) {
        return [{
          factorName: 'Direct borrower link',
          factorType: 'direct',
          value: borrower.id,
          impactScore: 0.5,
          entityA: borrower,
          entityB: esg,
        }];
      }
      return [];
    },
    // Sector ESG patterns
    (borrower, esg) => {
      if (borrower.sector === esg.sector) {
        return [{
          factorName: `Sector: ${borrower.sector}`,
          factorType: 'sector',
          value: borrower.sector,
          impactScore: 0.4,
          entityA: borrower,
          entityB: esg,
        }];
      }
      return [];
    },
    // ESG score similarity
    (borrower, esg) => {
      if (borrower.esgScore && esg.score) {
        const diff = Math.abs(borrower.esgScore - esg.score);
        if (diff <= 15) {
          return [{
            factorName: 'Similar ESG scores',
            factorType: 'esg_score',
            value: { borrowerScore: borrower.esgScore, metricScore: esg.score },
            impactScore: 0.3 * (1 - diff / 15),
            entityA: borrower,
            entityB: esg,
          }];
        }
      }
      return [];
    }
  )
);

// ============================================================================
// Sector Performance Correlation
// ============================================================================

export const borrowerCorrelationEngine = createSelfCorrelationEngine<Borrower>(
  combineExtractors(
    FeatureExtractors.exactMatch('sector', 'sector', 0.4),
    FeatureExtractors.exactMatch('region', 'geography', 0.3),
    FeatureExtractors.numericSimilarity('esgScore', 'esg', 15, 0.2),
    FeatureExtractors.numericSimilarity('totalExposure', 'exposure', 50_000_000, 0.1)
  )
);

// ============================================================================
// Compliance Deadline Correlation
// ============================================================================

export const complianceCorrelationEngine = createSelfCorrelationEngine<ComplianceItem>(
  combineExtractors(
    FeatureExtractors.exactMatch('borrowerId', 'borrower', 0.5),
    FeatureExtractors.exactMatch('itemType', 'compliance_type', 0.3),
    FeatureExtractors.exactMatch('sector', 'sector', 0.3),
    FeatureExtractors.dateProximity('dueDate', 'temporal', 30, 0.4)
  )
);

// ============================================================================
// Multi-Domain Correlation Discovery
// ============================================================================

export interface CrossDomainInsight extends CorrelationInsight {
  domain: string;
  crossDomain: boolean;
  affectedEntities: {
    documents?: number;
    deals?: number;
    borrowers?: number;
    compliance?: number;
    esg?: number;
  };
}

export class MultiDomainCorrelationEngine {
  private engines = {
    documentDeal: documentDealCorrelationEngine,
    borrowerESG: borrowerESGCorrelationEngine,
    borrower: borrowerCorrelationEngine,
    compliance: complianceCorrelationEngine,
  };

  /**
   * Discover all cross-domain correlations
   */
  discoverAll(data: {
    documents?: Document[];
    deals?: Deal[];
    borrowers?: Borrower[];
    compliance?: ComplianceItem[];
    esg?: ESGMetric[];
  }): {
    documentDeal: Correlation<Document, Deal>[];
    borrowerESG: Correlation<Borrower, ESGMetric>[];
    borrowerBorrower: Correlation<Borrower, Borrower>[];
    complianceCompliance: Correlation<ComplianceItem, ComplianceItem>[];
    insights: CrossDomainInsight[];
  } {
    const documentDeal =
      data.documents && data.deals
        ? this.engines.documentDeal.computeAllCorrelations(data.documents, data.deals)
        : [];

    const borrowerESG =
      data.borrowers && data.esg
        ? this.engines.borrowerESG.computeAllCorrelations(data.borrowers, data.esg)
        : [];

    const borrowerBorrower = data.borrowers
      ? this.engines.borrower.computeAllCorrelations(data.borrowers, data.borrowers)
      : [];

    const complianceCompliance = data.compliance
      ? this.engines.compliance.computeAllCorrelations(data.compliance, data.compliance)
      : [];

    // Generate cross-domain insights
    const insights = this.generateCrossDomainInsights({
      documentDeal,
      borrowerESG,
      borrowerBorrower,
      complianceCompliance,
      data,
    });

    return {
      documentDeal,
      borrowerESG,
      borrowerBorrower,
      complianceCompliance,
      insights,
    };
  }

  /**
   * Generate actionable insights from cross-domain correlations
   */
  private generateCrossDomainInsights(params: {
    documentDeal: Correlation<Document, Deal>[];
    borrowerESG: Correlation<Borrower, ESGMetric>[];
    borrowerBorrower: Correlation<Borrower, Borrower>[];
    complianceCompliance: Correlation<ComplianceItem, ComplianceItem>[];
    data: {
      documents?: Document[];
      deals?: Deal[];
      borrowers?: Borrower[];
      compliance?: ComplianceItem[];
      esg?: ESGMetric[];
    };
  }): CrossDomainInsight[] {
    const insights: CrossDomainInsight[] = [];

    // Insight: Document type affects deal velocity
    if (params.documentDeal.length > 0 && params.data.deals) {
      const docTypeVelocity = this.analyzeDocumentTypeVelocity(
        params.documentDeal,
        params.data.deals
      );
      if (docTypeVelocity) {
        insights.push(docTypeVelocity);
      }
    }

    // Insight: Sector ESG risk clustering
    if (params.borrowerESG.length > 0) {
      const sectorESGRisk = this.analyzeSectorESGRisk(params.borrowerESG);
      if (sectorESGRisk) {
        insights.push(sectorESGRisk);
      }
    }

    // Insight: Compliance deadline clustering
    if (params.complianceCompliance.length > 0) {
      const deadlineClustering = this.analyzeComplianceDeadlines(params.complianceCompliance);
      if (deadlineClustering) {
        insights.push(deadlineClustering);
      }
    }

    // Insight: Borrower concentration risk
    if (params.borrowerBorrower.length > 0) {
      const concentrationRisk = this.analyzeBorrowerConcentration(params.borrowerBorrower);
      if (concentrationRisk) {
        insights.push(concentrationRisk);
      }
    }

    return insights.sort((a, b) => {
      const sigOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return sigOrder[b.significance] - sigOrder[a.significance];
    });
  }

  private analyzeDocumentTypeVelocity(
    correlations: Correlation<Document, Deal>[],
    deals: Deal[]
  ): CrossDomainInsight | null {
    // Group by document type
    const typeVelocity = new Map<string, number[]>();

    correlations.forEach((corr) => {
      const docType = corr.entityA.documentType;
      const deal = corr.entityB;
      if (deal.velocity) {
        const velocities = typeVelocity.get(docType) || [];
        velocities.push(deal.velocity);
        typeVelocity.set(docType, velocities);
      }
    });

    // Find document type with best velocity
    let bestType = '';
    let bestVelocity = Infinity;
    let worstVelocity = 0;

    typeVelocity.forEach((velocities, type) => {
      const avg = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
      if (avg < bestVelocity) {
        bestVelocity = avg;
        bestType = type;
      }
      if (avg > worstVelocity) {
        worstVelocity = avg;
      }
    });

    if (bestType && worstVelocity > bestVelocity) {
      const improvement = Math.round(((worstVelocity - bestVelocity) / worstVelocity) * 100);
      return {
        id: `insight-doc-velocity-${Date.now()}`,
        title: `Document type "${bestType}" correlates with ${improvement}% faster deal velocity`,
        description: `Deals with ${bestType} documents close in ${Math.round(bestVelocity)} days on average, compared to ${Math.round(worstVelocity)} days for other types.`,
        metric: 'Deal Velocity Improvement',
        value: `${improvement}%`,
        correlatedEntities: {
          typeA: 'document',
          typeB: 'deal',
          count: correlations.length,
        },
        significance: improvement > 30 ? 'high' : 'medium',
        actionable: true,
        recommendations: [
          `Prioritize ${bestType} documents in deal workflows`,
          'Analyze what makes these documents more efficient',
          'Consider standardizing on this document type',
        ],
        domain: 'document-deal',
        crossDomain: true,
        affectedEntities: {
          documents: correlations.length,
          deals: deals.length,
        },
      };
    }

    return null;
  }

  private analyzeSectorESGRisk(
    correlations: Correlation<Borrower, ESGMetric>[]
  ): CrossDomainInsight | null {
    const sectorScores = new Map<string, number[]>();

    correlations.forEach((corr) => {
      const sector = corr.entityA.sector;
      const score = corr.entityB.score;
      const scores = sectorScores.get(sector) || [];
      scores.push(score);
      sectorScores.set(sector, scores);
    });

    let worstSector = '';
    let worstScore = 100;

    sectorScores.forEach((scores, sector) => {
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      if (avg < worstScore) {
        worstScore = avg;
        worstSector = sector;
      }
    });

    if (worstSector && worstScore < 60) {
      const borrowerCount = correlations.filter(
        (c) => c.entityA.sector === worstSector
      ).length;

      return {
        id: `insight-esg-risk-${Date.now()}`,
        title: `Borrowers in ${worstSector} have ${Math.round(100 - worstScore)}% higher ESG risk`,
        description: `${borrowerCount} borrowers in the ${worstSector} sector show average ESG score of ${Math.round(worstScore)}, indicating elevated risk.`,
        metric: 'Sector ESG Risk',
        value: Math.round(worstScore),
        correlatedEntities: {
          typeA: 'borrower',
          typeB: 'esg',
          count: borrowerCount,
        },
        significance: worstScore < 40 ? 'critical' : worstScore < 50 ? 'high' : 'medium',
        actionable: true,
        recommendations: [
          `Increase ESG monitoring for ${worstSector} sector`,
          'Consider sector-specific ESG improvement programs',
          'Review exposure limits for high-risk sectors',
        ],
        domain: 'borrower-esg',
        crossDomain: true,
        affectedEntities: {
          borrowers: borrowerCount,
          esg: correlations.length,
        },
      };
    }

    return null;
  }

  private analyzeComplianceDeadlines(
    correlations: Correlation<ComplianceItem, ComplianceItem>[]
  ): CrossDomainInsight | null {
    // Find temporal clusters (deadlines within 7 days)
    const clusters = correlations.filter((corr) => {
      const factors = corr.sharedFactors.filter((f) => f.factorType === 'temporal');
      return factors.length > 0 && corr.strength > 0.5;
    });

    if (clusters.length > 5) {
      return {
        id: `insight-deadline-cluster-${Date.now()}`,
        title: `${clusters.length} compliance deadlines clustered within same timeframe`,
        description: `Multiple compliance items share similar due dates, creating potential resource constraints.`,
        metric: 'Clustered Deadlines',
        value: clusters.length,
        correlatedEntities: {
          typeA: 'compliance',
          typeB: 'compliance',
          count: clusters.length,
        },
        significance: clusters.length > 10 ? 'high' : 'medium',
        actionable: true,
        recommendations: [
          'Prioritize high-risk compliance items first',
          'Allocate additional resources for clustered periods',
          'Consider staggering future compliance schedules',
        ],
        domain: 'compliance',
        crossDomain: false,
        affectedEntities: {
          compliance: clusters.length,
        },
      };
    }

    return null;
  }

  private analyzeBorrowerConcentration(
    correlations: Correlation<Borrower, Borrower>[]
  ): CrossDomainInsight | null {
    const highCorrelations = correlations.filter((c) => c.strength > 0.6);

    if (highCorrelations.length > 0) {
      const totalExposure = highCorrelations.reduce(
        (sum, corr) => sum + corr.entityA.totalExposure + corr.entityB.totalExposure,
        0
      );

      return {
        id: `insight-borrower-concentration-${Date.now()}`,
        title: `${highCorrelations.length} borrower pairs show high correlation`,
        description: `Highly correlated borrowers represent concentration risk in the portfolio.`,
        metric: 'Concentrated Exposure',
        value: `$${(totalExposure / 1_000_000).toFixed(1)}M`,
        correlatedEntities: {
          typeA: 'borrower',
          typeB: 'borrower',
          count: highCorrelations.length,
        },
        significance: highCorrelations.length > 5 ? 'critical' : 'high',
        actionable: true,
        recommendations: [
          'Review concentration risk policies',
          'Consider hedging strategies for correlated positions',
          'Diversify future lending across uncorrelated sectors',
        ],
        domain: 'borrower',
        crossDomain: false,
        affectedEntities: {
          borrowers: highCorrelations.length * 2,
        },
      };
    }

    return null;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const multiDomainEngine = new MultiDomainCorrelationEngine();
