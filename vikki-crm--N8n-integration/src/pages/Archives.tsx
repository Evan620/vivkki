import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Archive } from 'lucide-react';
import Layout from '../components/Layout';
import CaseTable from '../components/CaseTable';
import SearchBar from '../components/SearchBar';
import BackToTop from '../components/BackToTop';
import CaseFiltersComponent, { CaseFilters } from '../components/case/CaseFilters';
import { supabase } from '../utils/database';
import { calculateDaysOpen, calculateDaysUntilStatute, generateCaseName, hasStatuteAlert } from '../utils/calculations';
import { unarchiveCase, bulkUnarchiveCases } from '../utils/archiveService';
import type { Casefile, Client } from '../types';
import { useAlertDialog } from '../hooks/useAlertDialog.tsx';

interface CaseWithClients extends Casefile {
  clients: Client[];
}

export default function Archives() {
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
  const [unarchiving, setUnarchiving] = useState(false);
  const { alert, Dialog: AlertDialog } = useAlertDialog();

  useEffect(() => {
    loadCases();
    // Realtime subscription to reflect changes immediately
    const channel = supabase
      .channel('casefiles-archives')
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
      // Only load archived cases
      // Try with is_archived filter first, fallback to empty if column doesn't exist
      let { data: casefilesData, error: casefilesError } = await supabase
        .from('casefiles')
        .select('*')
        .eq('is_archived', true)
        .order('archived_at', { ascending: false });

      // If error is about missing column, return empty (no archived cases yet)
      if (casefilesError && (casefilesError.message?.includes('column') || casefilesError.code === '42703')) {
        console.warn('is_archived column not found, no archived cases available:', casefilesError.message);
        casefilesData = [];
        casefilesError = null;
      }

      if (casefilesError) {
        console.error('Error loading archived cases:', casefilesError);
        setLoading(false);
        return;
      }

      if (!casefilesData || casefilesData.length === 0) {
        setCases([]);
        setFilteredCases([]);
        setLoading(false);
        return;
      }

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
            isArchived: true,
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
      console.error('Error loading archived cases:', err);
      setLoading(false);
    }
  };

  const filterCases = () => {
    let filtered = [...cases];

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((caseItem) => {
        const caseName = generateCaseName(caseItem.clients);
        if (caseName.toLowerCase().includes(query)) return true;
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

  const handleUnarchive = async (caseId: number) => {
    setUnarchiving(true);
    const success = await unarchiveCase(caseId);
    if (success) {
      setCases(prev => prev.filter(c => c.id !== caseId));
      setFilteredCases(prev => prev.filter(c => c.id !== caseId));
    } else {
      await alert('Failed to unarchive case. Please try again.', { title: 'Error', variant: 'error' });
    }
    setUnarchiving(false);
  };


  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading archived cases...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Archived Cases</h1>
            <p className="text-gray-600 mt-1">View and manage archived cases</p>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <FolderOpen size={20} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search archived cases..."
          />
        </div>

        <CaseFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          totalCases={cases.length}
          filteredCount={filteredCases.length}
        />

        {filteredCases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-16 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {searchQuery || filters.stages.length > 0 || filters.statuses.length > 0 || filters.daysOpenFilter !== 'all' || filters.statuteAlertOnly
                ? 'No archived cases found'
                : 'No archived cases yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchQuery || filters.stages.length > 0 || filters.statuses.length > 0 || filters.daysOpenFilter !== 'all' || filters.statuteAlertOnly
                ? 'Try adjusting your search or filter criteria'
                : 'Archived cases will appear here'}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <FolderOpen size={20} className="mr-2" />
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <CaseTable
            cases={filteredCases}
            onDeleted={(id) => {
              setCases(prev => prev.filter(c => c.id !== id));
              setFilteredCases(prev => prev.filter(c => c.id !== id));
            }}
            onUnarchived={handleUnarchive}
            showArchive={false}
            showUnarchive={true}
          />
        )}

        <BackToTop />
      </div>
    </Layout>
  );
}

