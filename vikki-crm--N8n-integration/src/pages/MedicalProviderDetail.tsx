import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { supabase } from '../utils/database';
import FormInput from '../components/forms/FormInput';
import FormTextArea from '../components/forms/FormTextArea';
import Toast from '../components/common/Toast';

export default function MedicalProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    hipaa_method: 'Email',
    street_address: '',
    street_address_2: '',
    city: '',
    state: 'OK',
    zip_code: '',
    phone_1_type: '',
    phone_1: '',
    phone_2_type: '',
    phone_2: '',
    phone_3_type: '',
    phone_3: '',
    fax_1_type: '',
    fax_1: '',
    fax_2_type: '',
    fax_2: '',
    fax_3_type: '',
    fax_3: '',
    email_1_type: '',
    email_1: '',
    email_2_type: '',
    email_2: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  const fetchProvider = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setProvider(data);
        setFormData({
          name: data.name || '',
          hipaa_method: data.request_method || data.hipaa_method || 'Email',
          street_address: data.street_address || '',
          street_address_2: data.street_address_2 || '',
          city: data.city || '',
          state: data.state || 'OK',
          zip_code: data.zip_code || '',
          phone_1_type: data.phone_1_type || '',
          phone_1: data.phone_1 || data.phone || '',
          phone_2_type: data.phone_2_type || '',
          phone_2: data.phone_2 || '',
          phone_3_type: data.phone_3_type || '',
          phone_3: data.phone_3 || '',
          fax_1_type: data.fax_1_type || '',
          fax_1: data.fax_1 || data.fax || '',
          fax_2_type: data.fax_2_type || '',
          fax_2: data.fax_2 || '',
          fax_3_type: data.fax_3_type || '',
          fax_3: data.fax_3 || '',
          email_1_type: data.email_1_type || '',
          email_1: data.email_1 || data.email || '',
          email_2_type: data.email_2_type || '',
          email_2: data.email_2 || '',
          notes: data.notes || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching medical provider:', error);
      setToast({ message: `Failed to load medical provider: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Provider name is required', type: 'error' });
      return;
    }

    if (!provider || !provider.id) {
      setToast({ message: 'Medical provider not found', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        request_method: formData.hipaa_method,
        street_address: formData.street_address?.trim() || null,
        street_address_2: formData.street_address_2?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip_code: formData.zip_code?.trim() || null,
        phone_1_type: formData.phone_1_type?.trim() || null,
        phone_1: formData.phone_1?.trim() || null,
        phone_2_type: formData.phone_2_type?.trim() || null,
        phone_2: formData.phone_2?.trim() || null,
        phone_3_type: formData.phone_3_type?.trim() || null,
        phone_3: formData.phone_3?.trim() || null,
        fax_1_type: formData.fax_1_type?.trim() || null,
        fax_1: formData.fax_1?.trim() || null,
        fax_2_type: formData.fax_2_type?.trim() || null,
        fax_2: formData.fax_2?.trim() || null,
        fax_3_type: formData.fax_3_type?.trim() || null,
        fax_3: formData.fax_3?.trim() || null,
        email_1_type: formData.email_1_type?.trim() || null,
        email_1: formData.email_1?.trim() || null,
        email_2_type: formData.email_2_type?.trim() || null,
        email_2: formData.email_2?.trim() || null,
        notes: formData.notes?.trim() || null
      };

      // Also update legacy phone/fax/email fields for backward compatibility
      if (formData.phone_1?.trim()) {
        updateData.phone = formData.phone_1.trim();
      }
      if (formData.fax_1?.trim()) {
        updateData.fax = formData.fax_1.trim();
      }
      if (formData.email_1?.trim()) {
        updateData.email = formData.email_1.trim();
      }

      console.log('Updating medical provider with data:', updateData);

      const { error } = await supabase
        .from('medical_providers')
        .update(updateData)
        .eq('id', provider.id);

      if (error) throw error;

      setToast({ message: 'Medical provider updated successfully', type: 'success' });
      setIsEditing(false);
      await fetchProvider(); // Refresh data
    } catch (error: any) {
      console.error('Error updating medical provider:', error);
      setToast({ message: `Failed to update medical provider: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        hipaa_method: provider.request_method || provider.hipaa_method || 'Email',
        street_address: provider.street_address || '',
        street_address_2: provider.street_address_2 || '',
        city: provider.city || '',
        state: provider.state || 'OK',
        zip_code: provider.zip_code || '',
        phone_1_type: provider.phone_1_type || '',
        phone_1: provider.phone_1 || provider.phone || '',
        phone_2_type: provider.phone_2_type || '',
        phone_2: provider.phone_2 || '',
        phone_3_type: provider.phone_3_type || '',
        phone_3: provider.phone_3 || '',
        fax_1_type: provider.fax_1_type || '',
        fax_1: provider.fax_1 || provider.fax || '',
        fax_2_type: provider.fax_2_type || '',
        fax_2: provider.fax_2 || '',
        fax_3_type: provider.fax_3_type || '',
        fax_3: provider.fax_3 || '',
        email_1_type: provider.email_1_type || '',
        email_1: provider.email_1 || provider.email || '',
        email_2_type: provider.email_2_type || '',
        email_2: provider.email_2 || '',
        notes: provider.notes || ''
      });
    }
    setIsEditing(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading medical provider details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!provider) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Medical provider not found</p>
            <Button onClick={() => navigate('/medical-providers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Medical Providers
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
          { label: 'Medical Providers', href: '/medical-providers' },
          { label: provider.name || 'Details' }
        ]}
        className="mb-4"
      />

      <PageHeader
        title={provider.name || 'Medical Provider'}
        description="View and edit medical provider details"
      >
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/medical-providers')}>
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
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Provider Information</CardTitle>
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
                    Request Method (HIPAA)
                  </label>
                  <select
                    value={formData.hipaa_method}
                    onChange={(e) => handleChange('hipaa_method', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="Email">Email</option>
                    <option value="Fax">Fax</option>
                    <option value="Chartswap">Chartswap</option>
                    <option value="Chartfast">Chartfast</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                  <p className="text-gray-900 font-medium">{provider.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Request Method (HIPAA)</label>
                  <p className="text-gray-900 font-medium">{provider.request_method || provider.hipaa_method || 'N/A'}</p>
                </div>
                {provider.type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {provider.type}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Address Information</CardTitle>
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
                {provider.street_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <p className="text-gray-900 font-medium">{provider.street_address}</p>
                  </div>
                )}
                {provider.street_address_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address 2</label>
                    <p className="text-gray-900 font-medium">{provider.street_address_2}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <p className="text-gray-900 font-medium">{provider.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <p className="text-gray-900 font-medium">{provider.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                    <p className="text-gray-900 font-medium">{provider.zip_code || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phone Numbers */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Phone Numbers</CardTitle>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
                    </select>
                  </div>
                  <FormInput
                    label="Phone 2 Number"
                    value={formData.phone_2}
                    onChange={(value) => handleChange('phone_2', value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone 3 Type</label>
                    <select
                      value={formData.phone_3_type}
                      onChange={(e) => handleChange('phone_3_type', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
                    </select>
                  </div>
                  <FormInput
                    label="Phone 3 Number"
                    value={formData.phone_3}
                    onChange={(value) => handleChange('phone_3', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(provider.phone_1 || provider.phone) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone 1 {provider.phone_1_type && <span className="text-gray-500 font-normal">({provider.phone_1_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.phone_1 || provider.phone || 'N/A'}</p>
                  </div>
                )}
                {provider.phone_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone 2 {provider.phone_2_type && <span className="text-gray-500 font-normal">({provider.phone_2_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.phone_2}</p>
                  </div>
                )}
                {provider.phone_3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone 3 {provider.phone_3_type && <span className="text-gray-500 font-normal">({provider.phone_3_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.phone_3}</p>
                  </div>
                )}
                {!provider.phone_1 && !provider.phone && !provider.phone_2 && !provider.phone_3 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No phone numbers available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fax Numbers */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Fax Numbers</CardTitle>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
                    </select>
                  </div>
                  <FormInput
                    label="Fax 2 Number"
                    value={formData.fax_2}
                    onChange={(value) => handleChange('fax_2', value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fax 3 Type</label>
                    <select
                      value={formData.fax_3_type}
                      onChange={(e) => handleChange('fax_3_type', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
                    </select>
                  </div>
                  <FormInput
                    label="Fax 3 Number"
                    value={formData.fax_3}
                    onChange={(value) => handleChange('fax_3', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {provider.fax_1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fax 1 {provider.fax_1_type && <span className="text-gray-500 font-normal">({provider.fax_1_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.fax_1}</p>
                  </div>
                )}
                {provider.fax_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fax 2 {provider.fax_2_type && <span className="text-gray-500 font-normal">({provider.fax_2_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.fax_2}</p>
                  </div>
                )}
                {provider.fax_3 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fax 3 {provider.fax_3_type && <span className="text-gray-500 font-normal">({provider.fax_3_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.fax_3}</p>
                  </div>
                )}
                {!provider.fax_1 && !provider.fax && !provider.fax_2 && !provider.fax_3 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No fax numbers available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Addresses */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Email Addresses</CardTitle>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
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
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select...</option>
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Records">Records</option>
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
                {provider.email_1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email 1 {provider.email_1_type && <span className="text-gray-500 font-normal">({provider.email_1_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.email_1}</p>
                  </div>
                )}
                {provider.email_2 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email 2 {provider.email_2_type && <span className="text-gray-500 font-normal">({provider.email_2_type})</span>}
                    </label>
                    <p className="text-gray-900 font-medium">{provider.email_2}</p>
                  </div>
                )}
                {!provider.email_1 && !provider.email && !provider.email_2 && (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No email addresses available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Notes</CardTitle>
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
                {provider.notes ? (
                  <p className="text-gray-900 whitespace-pre-wrap font-medium">{provider.notes}</p>
                ) : (
                  <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No notes available</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}

