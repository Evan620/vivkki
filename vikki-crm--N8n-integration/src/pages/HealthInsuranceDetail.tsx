import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Edit, Save, X, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '../utils/database';
import FormInput from '../components/forms/FormInput';
import FormTextArea from '../components/forms/FormTextArea';
import Toast from '../components/common/Toast';
import HealthAdjusterForm from '../components/forms/HealthAdjusterForm';
import { 
  fetchHealthAdjusters, 
  createHealthAdjuster, 
  updateHealthAdjuster, 
  deleteHealthAdjuster 
} from '../utils/database';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';

export default function HealthInsuranceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [healthInsurance, setHealthInsurance] = useState<any>(null);
  const [adjusters, setAdjusters] = useState<any[]>([]);
  const [isAdjusterFormOpen, setIsAdjusterFormOpen] = useState(false);
  const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    request_method: 'Email',
    street_address: '',
    street_address_2: '',
    city: '',
    state: '',
    zip_code: '',
    phone_1_type: '',
    phone_1: '',
    phone_2_type: '',
    phone_2: '',
    fax_1_type: '',
    fax_1: '',
    fax_2_type: '',
    fax_2: '',
    email_1_type: '',
    email_1: '',
    email_2_type: '',
    email_2: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchHealthInsurance();
      fetchAdjusters();
    }
  }, [id]);

  const fetchAdjusters = async () => {
    if (!id) return;
    try {
      const allAdjusters = await fetchHealthAdjusters();
      // Filter adjusters for this insurance company
      const filtered = allAdjusters.filter(adj => adj.health_insurance_id === Number(id));
      setAdjusters(filtered || []);
    } catch (error) {
      console.error('Error fetching adjusters:', error);
    }
  };

  const fetchHealthInsurance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_insurance')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setHealthInsurance(data);
        setFormData({
          name: data.name || '',
          request_method: data.request_method || 'Email',
          street_address: data.street_address || '',
          street_address_2: data.street_address_2 || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          phone_1_type: data.phone_1_type || '',
          phone_1: data.phone_1 || data.phone || '',
          phone_2_type: data.phone_2_type || '',
          phone_2: data.phone_2 || '',
          fax_1_type: data.fax_1_type || '',
          fax_1: data.fax_1 || '',
          fax_2_type: data.fax_2_type || '',
          fax_2: data.fax_2 || '',
          email_1_type: data.email_1_type || '',
          email_1: data.email_1 || '',
          email_2_type: data.email_2_type || '',
          email_2: data.email_2 || '',
          notes: data.notes || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching health insurance:', error);
      setToast({ message: `Failed to load health insurance: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Provider name is required', type: 'error' });
      return;
    }

    if (!healthInsurance || !healthInsurance.id) {
      setToast({ message: 'Health insurance provider not found', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('health_insurance')
        .update({
          name: formData.name.trim(),
          request_method: formData.request_method,
          street_address: formData.street_address?.trim() || null,
          street_address_2: formData.street_address_2?.trim() || null,
          city: formData.city?.trim() || null,
          state: formData.state?.trim() || null,
          zip_code: formData.zip_code?.trim() || null,
          phone_1_type: formData.phone_1_type || null,
          phone_1: formData.phone_1?.trim() || null,
          phone_2_type: formData.phone_2_type || null,
          phone_2: formData.phone_2?.trim() || null,
          fax_1_type: formData.fax_1_type || null,
          fax_1: formData.fax_1?.trim() || null,
          fax_2_type: formData.fax_2_type || null,
          fax_2: formData.fax_2?.trim() || null,
          email_1_type: formData.email_1_type || null,
          email_1: formData.email_1?.trim() || null,
          email_2_type: formData.email_2_type || null,
          email_2: formData.email_2?.trim() || null,
          notes: formData.notes?.trim() || null
        })
        .eq('id', healthInsurance.id);

      if (error) throw error;

      setToast({ message: 'Health insurance provider updated successfully', type: 'success' });
      setIsEditing(false);
      await fetchHealthInsurance(); // Refresh data
      await fetchAdjusters(); // Refresh adjusters
    } catch (error: any) {
      console.error('Error updating health insurance:', error);
      setToast({ message: `Failed to update health insurance: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (healthInsurance) {
      setFormData({
        name: healthInsurance.name || '',
        request_method: healthInsurance.request_method || 'Email',
        street_address: healthInsurance.street_address || '',
        street_address_2: healthInsurance.street_address_2 || '',
        city: healthInsurance.city || '',
        state: healthInsurance.state || '',
        zip_code: healthInsurance.zip_code || '',
        phone_1_type: healthInsurance.phone_1_type || '',
        phone_1: healthInsurance.phone_1 || healthInsurance.phone || '',
        phone_2_type: healthInsurance.phone_2_type || '',
        phone_2: healthInsurance.phone_2 || '',
        fax_1_type: healthInsurance.fax_1_type || '',
        fax_1: healthInsurance.fax_1 || '',
        fax_2_type: healthInsurance.fax_2_type || '',
        fax_2: healthInsurance.fax_2 || '',
        email_1_type: healthInsurance.email_1_type || '',
        email_1: healthInsurance.email_1 || '',
        email_2_type: healthInsurance.email_2_type || '',
        email_2: healthInsurance.email_2 || '',
        notes: healthInsurance.notes || ''
      });
    }
    setIsEditing(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAdjuster = () => {
    setEditingAdjuster(null);
    setIsAdjusterFormOpen(true);
  };

  const handleEditAdjuster = (adjuster: any) => {
    setEditingAdjuster(adjuster);
    setIsAdjusterFormOpen(true);
  };

  const handleDeleteAdjuster = async (adjusterId: number) => {
    const adjuster = adjusters.find(a => a.id === adjusterId);
    const adjusterName = adjuster 
      ? `${adjuster.first_name || ''} ${adjuster.last_name || ''}`.trim() || 'this adjuster'
      : 'this adjuster';
    
    const yes = await confirm(`Delete ${adjusterName}?`, { title: 'Delete Adjuster', variant: 'danger' });
    if (!yes) return;

    try {
      const success = await deleteHealthAdjuster(adjusterId);
      if (success) {
        setAdjusters(prev => prev.filter(a => a.id !== adjusterId));
        setToast({ message: 'Adjuster deleted successfully', type: 'success' });
      } else {
        setToast({ message: 'Failed to delete adjuster', type: 'error' });
      }
    } catch (error: any) {
      console.error('Error deleting adjuster:', error);
      setToast({ message: `Failed to delete adjuster: ${error.message || 'Unknown error'}`, type: 'error' });
    }
  };

  const handleAdjusterSubmit = async (adjusterData: any) => {
    try {
      if (editingAdjuster) {
        // Update existing adjuster
        await updateHealthAdjuster(editingAdjuster.id, adjusterData);
        setToast({ message: 'Adjuster updated successfully', type: 'success' });
      } else {
        // Create new adjuster
        await createHealthAdjuster(adjusterData);
        setToast({ message: 'Adjuster added successfully', type: 'success' });
      }
      await fetchAdjusters(); // Refresh adjusters list
    } catch (error: any) {
      console.error('Error saving adjuster:', error);
      throw error; // Let the form handle the error display
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading health insurance details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!healthInsurance) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Health insurance provider not found</p>
            <Button onClick={() => navigate('/health-insurance')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Health Insurance
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BreadcrumbNav
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Health Insurance', href: '/health-insurance' },
          { label: healthInsurance.name || 'Details' }
        ]}
        className="mb-4"
      />

      <PageHeader
        title={healthInsurance.name || 'Health Insurance Provider'}
        description="View and edit health insurance provider details"
      >
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/health-insurance')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Provider Information */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Provider Name"
                  value={formData.name}
                  onChange={(value) => handleChange('name', value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Method
                  </label>
                  <select
                    value={formData.request_method}
                    onChange={(e) => handleChange('request_method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Email">Email</option>
                    <option value="Fax">Fax</option>
                    <option value="Optum">Optum</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name</label>
                  <p className="text-gray-900">{healthInsurance.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Method</label>
                  <p className="text-gray-900">{healthInsurance.request_method || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <FormInput
                  label="Street Address"
                  value={formData.street_address}
                  onChange={(value) => handleChange('street_address', value)}
                />
                <FormInput
                  label="Street Address 2"
                  value={formData.street_address_2}
                  onChange={(value) => handleChange('street_address_2', value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    label="City"
                    value={formData.city}
                    onChange={(value) => handleChange('city', value)}
                  />
                  <FormInput
                    label="State"
                    value={formData.state}
                    onChange={(value) => handleChange('state', value)}
                  />
                  <FormInput
                    label="Zip Code"
                    value={formData.zip_code}
                    onChange={(value) => handleChange('zip_code', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <p className="text-gray-900">{healthInsurance.street_address || 'N/A'}</p>
                </div>
                {healthInsurance.street_address_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2</label>
                    <p className="text-gray-900">{healthInsurance.street_address_2}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <p className="text-gray-900">{healthInsurance.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <p className="text-gray-900">{healthInsurance.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <p className="text-gray-900">{healthInsurance.zip_code || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phone Numbers */}
        <Card>
          <CardHeader>
            <CardTitle>Phone Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone 1 Type</label>
                    <select
                      value={formData.phone_1_type}
                      onChange={(e) => handleChange('phone_1_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Subrogation">Subrogation</option>
                    </select>
                  </div>
                  <FormInput
                    label="Phone 1 Number"
                    value={formData.phone_1}
                    onChange={(value) => handleChange('phone_1', value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone 2 Type</label>
                    <select
                      value={formData.phone_2_type}
                      onChange={(e) => handleChange('phone_2_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Subrogation">Subrogation</option>
                    </select>
                  </div>
                  <FormInput
                    label="Phone 2 Number"
                    value={formData.phone_2}
                    onChange={(value) => handleChange('phone_2', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(healthInsurance.phone_1 || healthInsurance.phone) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone 1 {healthInsurance.phone_1_type && `(${healthInsurance.phone_1_type})`}
                    </label>
                    <p className="text-gray-900">{healthInsurance.phone_1 || healthInsurance.phone || 'N/A'}</p>
                  </div>
                )}
                {healthInsurance.phone_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone 2 {healthInsurance.phone_2_type && `(${healthInsurance.phone_2_type})`}
                    </label>
                    <p className="text-gray-900">{healthInsurance.phone_2}</p>
                  </div>
                )}
                {!healthInsurance.phone_1 && !healthInsurance.phone && !healthInsurance.phone_2 && (
                  <p className="text-gray-500">No phone numbers available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fax Numbers */}
        <Card>
          <CardHeader>
            <CardTitle>Fax Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fax 1 Type</label>
                    <select
                      value={formData.fax_1_type}
                      onChange={(e) => handleChange('fax_1_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Subrogation">Subrogation</option>
                    </select>
                  </div>
                  <FormInput
                    label="Fax 1 Number"
                    value={formData.fax_1}
                    onChange={(value) => handleChange('fax_1', value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fax 2 Type</label>
                    <select
                      value={formData.fax_2_type}
                      onChange={(e) => handleChange('fax_2_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Subrogation">Subrogation</option>
                    </select>
                  </div>
                  <FormInput
                    label="Fax 2 Number"
                    value={formData.fax_2}
                    onChange={(value) => handleChange('fax_2', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {healthInsurance.fax_1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax 1 {healthInsurance.fax_1_type && `(${healthInsurance.fax_1_type})`}
                    </label>
                    <p className="text-gray-900">{healthInsurance.fax_1}</p>
                  </div>
                )}
                {healthInsurance.fax_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fax 2 {healthInsurance.fax_2_type && `(${healthInsurance.fax_2_type})`}
                    </label>
                    <p className="text-gray-900">{healthInsurance.fax_2}</p>
                  </div>
                )}
                {!healthInsurance.fax_1 && !healthInsurance.fax_2 && (
                  <p className="text-gray-500">No fax numbers available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Addresses */}
        <Card>
          <CardHeader>
            <CardTitle>Email Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email 1 Type</label>
                    <select
                      value={formData.email_1_type}
                      onChange={(e) => handleChange('email_1_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Subrogation">Subrogation</option>
                    </select>
                  </div>
                  <FormInput
                    label="Email 1 Address"
                    value={formData.email_1}
                    onChange={(value) => handleChange('email_1', value)}
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email 2 Type</label>
                    <select
                      value={formData.email_2_type}
                      onChange={(e) => handleChange('email_2_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Subrogation">Subrogation</option>
                    </select>
                  </div>
                  <FormInput
                    label="Email 2 Address"
                    value={formData.email_2}
                    onChange={(value) => handleChange('email_2', value)}
                    type="email"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {healthInsurance.email_1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email 1 {healthInsurance.email_1_type && `(${healthInsurance.email_1_type})`}
                    </label>
                    <p className="text-gray-900">{healthInsurance.email_1}</p>
                  </div>
                )}
                {healthInsurance.email_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email 2 {healthInsurance.email_2_type && `(${healthInsurance.email_2_type})`}
                    </label>
                    <p className="text-gray-900">{healthInsurance.email_2}</p>
                  </div>
                )}
                {!healthInsurance.email_1 && !healthInsurance.email_2 && (
                  <p className="text-gray-500">No email addresses available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <FormTextArea
                label="Provider Notes"
                value={formData.notes}
                onChange={(value) => handleChange('notes', value)}
                rows={4}
              />
            ) : (
              <div>
                <p className="text-gray-900 whitespace-pre-wrap">{healthInsurance.notes || 'No notes available'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjusters Section */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Adjusters ({adjusters.length})
              </CardTitle>
              <Button size="sm" onClick={handleAddAdjuster} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Adjuster
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {adjusters.length > 0 ? (
              <div className="space-y-3">
                {adjusters.map((adjuster) => (
                  <div
                    key={adjuster.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {[adjuster.first_name, adjuster.middle_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          {adjuster.email && (
                            <div>
                              <span className="font-medium">Email:</span> {adjuster.email}
                            </div>
                          )}
                          {adjuster.phone && (
                            <div>
                              <span className="font-medium">Phone:</span> {adjuster.phone}
                            </div>
                          )}
                          {adjuster.fax && (
                            <div>
                              <span className="font-medium">Fax:</span> {adjuster.fax}
                            </div>
                          )}
                          {(adjuster.street_address || adjuster.city || adjuster.state) && (
                            <div>
                              <span className="font-medium">Address:</span>{' '}
                              {[adjuster.street_address, adjuster.city, adjuster.state, adjuster.zip_code]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => handleEditAdjuster(adjuster)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Adjuster"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdjuster(adjuster.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Adjuster"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="mb-4">No adjusters added yet</p>
                <Button size="sm" onClick={handleAddAdjuster} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Adjuster
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <HealthAdjusterForm
        isOpen={isAdjusterFormOpen}
        onClose={() => {
          setIsAdjusterFormOpen(false);
          setEditingAdjuster(null);
        }}
        onSubmit={handleAdjusterSubmit}
        initialData={editingAdjuster}
        healthInsuranceId={healthInsurance?.id || 0}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {ConfirmDialog}
    </DashboardLayout>
  );
}

