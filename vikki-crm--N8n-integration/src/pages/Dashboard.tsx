import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, FolderOpen, AlertTriangle, Users, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import CaseTable from '../components/CaseTable';
import SearchBar from '../components/SearchBar';
import BackToTop from '../components/BackToTop';
import CaseFiltersComponent, { CaseFilters } from '../components/case/CaseFilters';
import { supabase } from '../utils/database';
import { calculateDaysOpen, calculateDaysUntilStatute, generateCaseName, hasStatuteAlert } from '../utils/calculations';
import type { Casefile, Client } from '../types';

interface CaseWithClients extends Casefile {
  clients: Client[];
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<CaseWithClients[]>([]);
  const [filteredCases, setFilteredCases] = useState<CaseWithClients[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CaseFilters>({
    stages: [],
    statuses: [],
    daysOpenFilter: 'all',
    daysOpenSort: 'alphabetical',
    statuteAlertOnly: false
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    const statusParam = searchParams.get('status');
    const statuteAlertParam = searchParams.get('statuteAlert');

    if (stageParam || statusParam || statuteAlertParam) {
      setFilters(prev => ({
        ...prev,
        stages: stageParam ? [stageParam] : prev.stages,
        statuses: statusParam ? [statusParam] : prev.statuses,
        statuteAlertOnly: statuteAlertParam === 'true' || statuteAlertParam === 'critical'
      }));
      // Clear URL params after applying to avoid confusion
      if (stageParam || statusParam || statuteAlertParam) {
        const newParams = new URLSearchParams(searchParams);
        if (stageParam) newParams.delete('stage');
        if (statusParam) newParams.delete('status');
        if (statuteAlertParam) newParams.delete('statuteAlert');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    loadCases();
    // Realtime subscription to reflect new/updated cases immediately
    const channel = supabase
      .channel('casefiles-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'casefiles' }, () => {
        loadCases();
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  useEffect(() => {
    filterCases();
  }, [searchQuery, cases, filters]);

  const loadCases = async () => {
    setLoading(true);

    try {
      // Exclude archived cases from main dashboard
      // Try with is_archived filter first, fallback to all cases if column doesn't exist
      let { data: casefilesData, error: casefilesError } = await supabase
        .from('casefiles')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      // If error is about missing column, retry without the filter
      if (casefilesError && (casefilesError.message?.includes('column') || casefilesError.code === '42703')) {
        console.warn('is_archived column not found, loading all cases:', casefilesError.message);
        const retry = await supabase
          .from('casefiles')
          .select('*')
          .order('created_at', { ascending: false });
        casefilesData = retry.data;
        casefilesError = retry.error;
      }

      if (casefilesError) {
        console.error('Error loading cases:', casefilesError);
        setLoading(false);
        return;
      }

      if (!casefilesData || casefilesData.length === 0) {
        console.log('No casefiles found in database');
        setCases([]);
        setFilteredCases([]);
        setLoading(false);
        return;
      }

      console.log(`Loaded ${casefilesData.length} casefiles from database`);

      // Load all clients for all cases
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('client_order');

      if (clientsError) {
        console.error('Error loading clients:', clientsError);
        setLoading(false);
        return;
      }

      const casesWithClients: CaseWithClients[] = casefilesData
        .map((caseItem: any) => {
          const caseClients = clientsData?.filter((c: any) => c.casefile_id === caseItem.id) || [];

          return {
            id: caseItem.id,
            stage: caseItem.stage,
            status: caseItem.status,
            clientCount: caseItem.client_count || caseClients.length,
            defendantCount: caseItem.defendant_count || 0,
            dateOfLoss: caseItem.date_of_loss,
            timeOfWreck: caseItem.time_of_wreck,
            wreckType: caseItem.wreck_type,
            wreckStreet: caseItem.wreck_street,
            wreckCity: caseItem.wreck_city,
            wreckState: caseItem.wreck_state,
            wreckCounty: caseItem.wreck_county,
            wreckDescription: caseItem.wreck_description,
            isPoliceInvolved: caseItem.is_police_involved,
            policeForce: caseItem.police_force,
            isPoliceReport: caseItem.is_police_report,
            policeReportNumber: caseItem.police_report_number,
            vehicleDescription: caseItem.vehicle_description,
            damageLevel: caseItem.damage_level,
            wreckNotes: caseItem.wreck_notes,
            signUpDate: caseItem.sign_up_date || caseItem.created_at?.split('T')[0],
            statuteDeadline: caseItem.statute_deadline,
            daysUntilStatute: caseItem.days_until_statute,
            isArchived: caseItem.is_archived === true || caseItem.is_archived === 'true',
            archivedAt: caseItem.archived_at || null,
            createdAt: caseItem.created_at,
            updatedAt: caseItem.updated_at,
            clients: caseClients.map((client: any) => ({
              id: client.id,
              casefileId: client.casefile_id,
              clientNumber: client.client_number,
              clientOrder: client.client_order || 1,
              isDriver: client.is_driver,
              firstName: client.first_name || '',
              middleName: client.middle_name || '',
              lastName: client.last_name || '',
              dateOfBirth: client.date_of_birth || '',
              ssn: client.ssn || '',
              streetAddress: client.street_address || '',
              city: client.city || '',
              state: client.state || '',
              zipCode: client.zip_code || '',
              primaryPhone: client.primary_phone || '',
              secondaryPhone: client.secondary_phone || '',
              email: client.email || '',
              maritalStatus: client.marital_status || '',
              injuryDescription: client.injury_description || '',
              priorAccidents: client.prior_accidents || '',
              priorInjuries: client.prior_injuries || '',
              workImpact: client.work_impact || '',
              referrer: client.referrer || '',
              referrerRelationship: client.referrer_relationship || '',
              hasHealthInsurance: client.has_health_insurance || false
            }))
          };
        })
        .filter((c): c is CaseWithClients => c !== null);

      setCases(casesWithClients);
      setFilteredCases(casesWithClients);
      setLoading(false);
    } catch (err) {
      console.error('Error loading cases:', err);
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    // Apply search query filter
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
      filtered = filtered.filter((caseItem) => {
      // Search by case name (hyphenated client names)
      const caseName = generateCaseName(caseItem.clients);
      if (caseName.toLowerCase().includes(query)) return true;

      // Search by individual client names
      return caseItem.clients.some(client => 
        client.firstName.toLowerCase().includes(query) ||
        client.lastName.toLowerCase().includes(query)
      );
      });
    }

    // Apply stage filter
    if (filters.stages.length > 0) {
      filtered = filtered.filter(c => filters.stages.includes(c.stage));
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(c => filters.statuses.includes(c.status));
    }

    // Apply days open filter
    if (filters.daysOpenFilter !== 'all') {
      const daysLimit = parseInt(filters.daysOpenFilter);
      filtered = filtered.filter(c => {
        const daysOpen = calculateDaysOpen(c.signUpDate || c.createdAt);
        return daysOpen <= daysLimit;
      });
    }

    // Apply statute alert filter
    if (filters.statuteAlertOnly) {
      filtered = filtered.filter(c => {
        const daysUntil = c.daysUntilStatute ?? calculateDaysUntilStatute(c.statuteDeadline);
        return hasStatuteAlert(daysUntil);
      });
    }

    // Sort based on daysOpenSort filter
    filtered.sort((a, b) => {
      if (filters.daysOpenSort === 'alphabetical') {
        // Sort alphabetically by case name
        const nameA = generateCaseName(a.clients).toLowerCase();
        const nameB = generateCaseName(b.clients).toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        const daysOpenA = calculateDaysOpen(a.signUpDate || a.createdAt);
        const daysOpenB = calculateDaysOpen(b.signUpDate || b.createdAt);
        
        if (filters.daysOpenSort === 'newest') {
          // Newest first = fewer days open first
          return daysOpenA - daysOpenB;
        } else {
          // Oldest first = more days open first
          return daysOpenB - daysOpenA;
        }
      }
    });

    setFilteredCases(filtered);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading cases...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cases</h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex-1 min-w-0">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by client name or case..."
          />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              to="/archives"
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              <FolderOpen size={18} className="sm:mr-2 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Archives</span>
            </Link>
          <Link
            to="/intake"
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
          >
              <Plus size={18} className="sm:mr-2 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">New Case</span>
              <span className="sm:hidden">New</span>
          </Link>
          </div>
        </div>

        <CaseFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          totalCases={cases.length}
          filteredCount={filteredCases.length}
        />

        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-16 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No cases found' : 'No cases yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first case'}
            </p>
            {!searchQuery && (
              <Link
                to="/intake"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                <Plus size={20} className="mr-2" />
                Create First Case
              </Link>
            )}
          </div>
        ) : (
          <CaseTable
            cases={filteredCases}
            onDeleted={(id) => {
              setCases(prev => prev.filter(c => c.id !== id));
              setFilteredCases(prev => prev.filter(c => c.id !== id));
            }}
            onArchived={(id) => {
              setCases(prev => prev.filter(c => c.id !== id));
              setFilteredCases(prev => prev.filter(c => c.id !== id));
            }}
          />
        )}

        <BackToTop />
      </div>
    </Layout>
  );
}
