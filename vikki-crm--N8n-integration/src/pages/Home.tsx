import { useState, useEffect } from 'react';
import { useAlertDialog } from '../hooks/useAlertDialog.tsx';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  AlertCircle, 
  BarChart3, 
  Calendar, 
  Clock, 
  Plus, 
  RefreshCw,
  Users,
  FileText,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/database';
import { useAuth } from '../contexts/AuthContext';
import { calculateDaysUntilStatute } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CASE_STAGES, CASE_STATUSES, getAllStatuses } from '../constants/caseStages';
import { generateAndDownloadSOU } from '../services/souService';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeCases: 0,
    nearStatute: 0,
    totalSettlements: 0,
    avgCaseDuration: 0,
    providers: 0,
    insurers: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [stageData, setStageData] = useState<{ name: string; value: number }[]>([]);
  const [intakeData, setIntakeData] = useState<{ month: string; cases: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangeMonths, setDateRangeMonths] = useState<number>(6);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({});
  const [stageFilter, setStageFilter] = useState<Record<string, boolean>>({});
  const [generatingSOU, setGeneratingSOU] = useState(false);
  const { alert, Dialog: AlertDialog } = useAlertDialog();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch casefiles (exclude archived cases)
        // Try with is_archived filter first, fallback to all cases if column doesn't exist
        let { data: caseRows, error: caseError } = await supabase
          .from('casefiles')
          .select('id, created_at, status, stage, statute_deadline, days_until_statute, statute_alert')
          .eq('is_archived', false);
        
        // If error is about missing column, retry without the filter
        if (caseError && (caseError.message?.includes('column') || caseError.code === '42703')) {
          console.warn('is_archived column not found, loading all cases:', caseError.message);
          const retry = await supabase
          .from('casefiles')
          .select('id, created_at, status, stage, statute_deadline, days_until_statute, statute_alert');
          caseRows = retry.data;
          caseError = retry.error;
        }
        
        if (caseError) {
          console.error('Error fetching cases:', caseError);
          caseRows = [];
        }
        
        // Calculate statute alerts using same logic as OverviewTab
        // Include expired cases (≤0) and urgent cases (≤90 days)
        const casesWithStatuteAlerts = (caseRows || []).map(c => {
          // Try both snake_case and camelCase field names (OverviewTab uses both)
          const statuteDeadline = c.statute_deadline || (c as any).statuteDeadline;
          
          let daysUntilStatute: number | null = null;
          
          if (statuteDeadline) {
            // Calculate using same function as OverviewTab
            const calculated = calculateDaysUntilStatute(statuteDeadline);
            if (calculated !== null && !isNaN(calculated)) {
              daysUntilStatute = calculated;
            }
          }
          
          // Fallback to database value if calculation returned null
          if (daysUntilStatute === null && c.days_until_statute !== null && c.days_until_statute !== undefined) {
            const dbValue = Number(c.days_until_statute);
            if (!isNaN(dbValue)) {
              daysUntilStatute = dbValue;
            }
          }
          
          // Check database statute_alert field as additional signal
          const dbStatuteAlert = c.statute_alert;
          
          // Same logic as OverviewTab: urgent if <= 90 days OR expired if <= 0
          // Include expired cases (negative or 0 days)
          const hasUrgentAlert = daysUntilStatute !== null && typeof daysUntilStatute === 'number' && daysUntilStatute <= 90;
          
          // Also check database flag if calculation is null
          const hasAlertFromDb = dbStatuteAlert === true || dbStatuteAlert === 'true';
          
          // Final determination: alert if calculated <= 90 OR database flag says alert
          const finalHasAlert = hasUrgentAlert || (daysUntilStatute === null && hasAlertFromDb);
          
          // Debug logging for cases with alerts
          if (finalHasAlert) {
            console.log('📊 Home: Statute Alert Detected', {
              caseId: c.id,
              statuteDeadline,
              daysUntilStatute,
              dbStatuteAlert,
              hasUrgentAlert,
              hasAlertFromDb,
              finalHasAlert
            });
          }
          
          return {
            ...c,
            calculatedDaysUntilStatute: daysUntilStatute,
            hasStatuteAlert: finalHasAlert,
            statuteDeadlineValue: statuteDeadline
          };
        });
        
        // Count active cases (not closed, not in Closed stage)
        const activeCases = casesWithStatuteAlerts.filter(c => {
          const stage = (c.stage || '').trim();
          const status = (c.status || '').trim();
          return stage !== 'Closed' && status !== 'Closed';
        }).length || 0;
        
        // Count cases with statute alert (≤90 days includes expired ≤0)
        const nearStatute = casesWithStatuteAlerts.filter(c => c.hasStatuteAlert).length || 0;
        
        // Debug: Log all cases with statute deadlines
        console.log('📊 Home: Statute Alert Summary', {
          totalCases: caseRows?.length || 0,
          casesWithDeadline: casesWithStatuteAlerts.filter(c => c.statuteDeadlineValue).length,
          casesWithCalculation: casesWithStatuteAlerts.filter(c => c.calculatedDaysUntilStatute !== null).length,
          nearStatuteCount: nearStatute,
          casesWithAlerts: casesWithStatuteAlerts.filter(c => c.hasStatuteAlert).map(c => ({
            id: c.id,
            daysUntil: c.calculatedDaysUntilStatute,
            deadline: c.statuteDeadlineValue,
            dbAlert: c.statute_alert
          }))
        });
        
        // Fetch settlements
        const { data: settlements } = await supabase
          .from('settlements')
          .select('*');
          
        const totalSettlements = settlements?.reduce((sum, s) => sum + (s.gross_settlement || 0), 0) || 0;
        
        // Fetch providers
        const { count: providerCount } = await supabase
          .from('medical_providers')
          .select('*', { count: 'exact', head: true });
          
        // Fetch insurers
        const { count: insurerCount } = await supabase
          .from('auto_insurance')
          .select('*', { count: 'exact', head: true });
        
        // Fetch recent activity
        const { data: activity } = await supabase
          .from('work_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(5);
        
        setStats({
          activeCases,
          nearStatute,
          totalSettlements,
          avgCaseDuration: Math.floor(Math.random() * 120) + 30, // Placeholder
          providers: providerCount || 0,
          insurers: insurerCount || 0
        });
        setCases(caseRows || []);
        
        // Debug logging for statute alerts
        console.log('📊 Home: Statute Alert Detection');
        console.log(`  Total cases: ${caseRows?.length || 0}`);
        const casesWithDeadline = caseRows?.filter(c => c.statute_deadline).length || 0;
        console.log(`  Cases with statute_deadline: ${casesWithDeadline}`);
        console.log(`  Cases with alerts (≤90 days): ${nearStatute}`);
        
        // Always log all cases with deadlines for debugging
        casesWithStatuteAlerts.forEach(c => {
          if (c.statuteDeadlineValue) {
            const alertStatus = c.hasStatuteAlert ? '✅ ALERT' : '❌ NO ALERT';
            console.log(`  ${alertStatus} Case ${c.id}: ${c.calculatedDaysUntilStatute} days (deadline: ${c.statuteDeadlineValue})`);
          }
        });
        
        // Also log cases without deadlines
        const casesWithoutDeadline = casesWithStatuteAlerts.filter(c => !c.statuteDeadlineValue).length;
        if (casesWithoutDeadline > 0) {
          console.log(`  ⚠️  Cases without statute_deadline: ${casesWithoutDeadline}`);
        }
        setRecentActivity(activity || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000);
    // Realtime updates
    const channel = supabase
      .channel('casefiles-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'casefiles' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Build filters and chart datasets whenever cases or filters change
  useEffect(() => {
    // Get unique stages from actual data, but use CASE_STAGES for consistency
    const uniqueStages = Array.from(new Set((cases || []).map(c => (c.stage || '').trim()).filter(Boolean)));
    // Use CASE_STAGES but only show stages that exist in data
    const availableStages = CASE_STAGES.filter(stage => uniqueStages.includes(stage));
    setStages(availableStages);
    
    // Initialize stage filter if empty
    if (availableStages.length > 0 && Object.keys(stageFilter).length === 0) {
      const init: Record<string, boolean> = {};
      availableStages.forEach(st => { init[st] = true; });
      setStageFilter(init);
    }

    // Get all unique statuses from data
    const allStatuses = getAllStatuses();
    if (Object.keys(statusFilter).length === 0) {
      const init: Record<string, boolean> = {};
      allStatuses.forEach(st => { init[st] = true; });
      setStatusFilter(init);
    }

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - dateRangeMonths);
    const filtered = (cases || []).filter(c => {
      const created = c.created_at ? new Date(c.created_at) : null;
      if (created && created < cutoff) return false;
      const st = (c.stage || '').trim();
      if (st && stageFilter && Object.keys(stageFilter).length > 0 && stageFilter[st] === false) return false;
      const status = (c.status || '').trim();
      if (status && statusFilter && Object.keys(statusFilter).length > 0 && statusFilter[status] === false) return false;
      return true;
    });

    // Status dataset - group by actual status values from new system
    const statusCounts: Record<string, number> = {};
    filtered.forEach(c => {
      const status = (c.status || '').trim();
      if (status) {
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    // Sort by count descending and take top statuses for chart
    const sortedStatuses = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 statuses
      .map(([name, value]) => ({ name, value }));
    setStatusData(sortedStatuses);

    // Stage dataset - use actual stages from new system
    const stageCounts: Record<string, number> = {};
    filtered.forEach(c => {
      const st = (c.stage || '').trim();
      if (st && CASE_STAGES.includes(st as any)) {
      stageCounts[st] = (stageCounts[st] || 0) + 1;
      }
    });
    setStageData(Object.entries(stageCounts).map(([name, value]) => ({ name, value: value as number })));

    // Intake dataset (per month)
    const monthCounts: Record<string, number> = {};
    const now = new Date();
    for (let i = dateRangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthCounts[key] = 0;
    }
    filtered.forEach(c => {
      if (!c.created_at) return;
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthCounts[key] !== undefined) monthCounts[key]++;
    });
    setIntakeData(Object.entries(monthCounts).map(([month, cases]) => ({ month, cases })));
  }, [cases, dateRangeMonths, statusFilter, stageFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleGenerateSOU = async () => {
    setGeneratingSOU(true);
    try {
      await generateAndDownloadSOU();
      // Show success message (you can add toast notification here)
      console.log('✅ SOU generated and downloaded successfully');
      await alert('SOU report generated and downloaded successfully!', { title: 'Success', variant: 'success' });
    } catch (error) {
      console.error('❌ Error generating SOU:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate SOU report';
      await alert(`Error: ${errorMessage}`, { title: 'Error', variant: 'error' });
    } finally {
      setGeneratingSOU(false);
    }
  };

  return (
    <DashboardLayout>
      <BreadcrumbNav items={[{ label: 'Home' }]} className="mb-4" />
      
      <PageHeader 
        title="Dashboard" 
        description={user?.email ? `Signed in as ${user.email}` : 'Welcome to Vikki Legal CRM'}
      >
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleGenerateSOU}
          disabled={generatingSOU}
        >
          {generatingSOU ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate SOU
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
        <Link to="/intake">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Case
          </Button>
        </Link>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Statute Alerts Card */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${stats.nearStatute > 0 ? "border-red-300 bg-red-50 hover:bg-red-100" : "hover:border-orange-300"}`}
          onClick={() => navigate('/dashboard?statuteAlert=true')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {stats.nearStatute > 0 && <AlertCircle className="h-5 w-5 text-red-500" />}
              <Calendar className={`h-5 w-5 ${stats.nearStatute > 0 ? 'text-red-500' : 'text-orange-500'}`} />
              Statute Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.nearStatute}
            </div>
            <p className="text-sm text-muted-foreground">
              Cases approaching deadline (≤90 days) or expired
            </p>
          </CardContent>
        </Card>
        
        {/* Active Cases Card */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-300"
          onClick={() => navigate('/dashboard')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Active Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.activeCases}
            </div>
            <p className="text-sm text-muted-foreground">
              Cases in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              Total Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {formatCurrency(stats.totalSettlements)}
            </div>
            <p className="text-sm text-muted-foreground">
              Year to date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Avg. Case Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {(() => {
                if (!cases || cases.length === 0) return 0;
                const now = Date.now();
                const diffs = cases
                  .map(c => c.created_at ? Math.max(0, Math.floor((now - new Date(c.created_at).getTime()) / (1000*60*60*24))) : 0);
                const avg = diffs.length ? Math.round(diffs.reduce((a,b) => a+b, 0) / diffs.length) : 0;
                return avg;
              })()} days
            </div>
            <p className="text-sm text-muted-foreground">
              From intake to settlement
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-purple-300"
          onClick={() => navigate('/medical-providers')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Medical Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.providers}
            </div>
            <p className="text-sm text-muted-foreground">
              Active in network
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-indigo-300"
          onClick={() => navigate('/auto-insurance')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Insurance Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-1">
              {stats.insurers}
            </div>
            <p className="text-sm text-muted-foreground">
              In database
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine charts using live data filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date range</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={dateRangeMonths}
                onChange={e => setDateRangeMonths(parseInt(e.target.value))}
              >
                <option value={3}>Last 3 months</option>
                <option value={6}>Last 6 months</option>
                <option value={12}>Last 12 months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <div className="flex flex-wrap gap-3 max-h-32 overflow-auto border rounded-md p-2">
                {getAllStatuses().length === 0 ? (
                  <span className="text-gray-500 text-sm">No statuses</span>
                ) : getAllStatuses().map(s => (
                  <label key={s} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={statusFilter[s] !== false} onChange={e => setStatusFilter(prev => ({ ...prev, [s]: e.target.checked }))} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Stages</label>
              <div className="flex flex-wrap gap-3 max-h-24 overflow-auto border rounded-md p-2">
                {CASE_STAGES.length === 0 ? (
                  <span className="text-gray-500 text-sm">No stages</span>
                ) : CASE_STAGES.map(st => (
                  <label key={st} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={stageFilter[st] !== false} onChange={e => setStageFilter(prev => ({ ...prev, [st]: e.target.checked }))} />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Case Status</CardTitle>
            <CardDescription>Click a segment to filter by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.reduce((s, d) => s + d.value, 0) === 0 ? (
              <div className="h-72 flex items-center justify-center text-gray-500">No status data</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={statusData} 
                      dataKey="value" 
                      nameKey="name" 
                      outerRadius={90} 
                      label
                      onClick={(data) => {
                        if (data && data.name) {
                          navigate(`/dashboard?status=${encodeURIComponent(data.name)}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-s-${index}`} 
                          fill={["#2563eb", "#16a34a", "#64748b", "#eab308", "#ef4444", "#8b5cf6", "#14b8a6", "#f59e0b", "#10b981", "#6366f1"][index % 10]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Case Stages</CardTitle>
            <CardDescription>Click a segment to filter by stage</CardDescription>
          </CardHeader>
          <CardContent>
            {stageData.reduce((s, d) => s + d.value, 0) === 0 ? (
              <div className="h-72 flex items-center justify-center text-gray-500">No stage data</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={stageData} 
                      dataKey="value" 
                      nameKey="name" 
                      outerRadius={90} 
                      label
                      onClick={(data) => {
                        if (data && data.name) {
                          navigate(`/dashboard?stage=${encodeURIComponent(data.name)}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {stageData.map((entry, index) => (
                        <Cell 
                          key={`cell-st-${index}`} 
                          fill={["#8b5cf6", "#eab308", "#ef4444", "#14b8a6", "#2563eb"][index % 5]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Case Intake</CardTitle>
            <CardDescription>New cases per month - Click a bar to view cases from that month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intakeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar 
                    dataKey="cases" 
                    fill="#2563eb"
                    onClick={(data) => {
                      if (data && data.month) {
                        // Navigate to dashboard - could add date filter in future
                        navigate('/dashboard');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across all cases</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <ul className="space-y-4">
              {recentActivity.map((item, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {isLoading ? 'Loading activity...' : 'No recent activity'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions removed per requirements */}
      {AlertDialog}
    </DashboardLayout>
  );
}
