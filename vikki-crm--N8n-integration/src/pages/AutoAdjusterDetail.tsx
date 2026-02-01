import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { supabase, fetchAutoInsurers, fetchAutoAdjusterById, updateAutoAdjuster, createAutoAdjuster } from '../utils/database';
import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import Toast from '../components/common/Toast';

export default function AutoAdjusterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [adjuster, setAdjuster] = useState<any>(null);
  const [autoInsurers, setAutoInsurers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    auto_insurance_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    email: '',
    fax: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: ''
  });

  useEffect(() => {
    loadAutoInsurers();
    if (id && !isNew) {
      fetchAdjuster();
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const loadAutoInsurers = async () => {
    try {
      const data = await fetchAutoInsurers();
      setAutoInsurers(data || []);
    } catch (error) {
      console.error('Error loading auto insurers:', error);
    }
  };

  const fetchAdjuster = async () => {
    if (!id || isNew) return;
    
    setIsLoading(true);
    try {
      const data = await fetchAutoAdjusterById(parseInt(id));
      if (data) {
        setAdjuster(data);
        setFormData({
          auto_insurance_id: data.auto_insurance_id?.toString() || '',
          first_name: data.first_name || '',
          middle_name: data.middle_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          email: data.email || '',
          fax: data.fax || '',
          street_address: data.street_address || data.mailing_address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching auto adjuster:', error);
      setToast({ message: `Failed to load adjuster: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.auto_insurance_id) {
      setToast({ message: 'Auto insurance carrier is required', type: 'error' });
      return;
    }

    // Require at least first name OR last name
    if (!formData.first_name.trim() && !formData.last_name.trim()) {
      setToast({ message: 'At least first name or last name is required', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const adjusterData = {
        auto_insurance_id: parseInt(formData.auto_insurance_id),
        first_name: formData.first_name.trim() || null,
        middle_name: formData.middle_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        fax: formData.fax.trim() || null,
        street_address: formData.street_address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null
      };

      if (isNew) {
        const newAdjuster = await createAutoAdjuster(adjusterData);
        setToast({ message: 'Auto adjuster created successfully', type: 'success' });
        navigate(`/auto-adjusters/${newAdjuster.id}`);
      } else {
        await updateAutoAdjuster(parseInt(id!), adjusterData);
        setToast({ message: 'Auto adjuster updated successfully', type: 'success' });
        setIsEditing(false);
        await fetchAdjuster();
      }
    } catch (error: any) {
      console.error('Error saving auto adjuster:', error);
      setToast({ message: `Failed to save adjuster: ${error.message || 'Unknown error'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/auto-adjusters');
    } else if (adjuster) {
      setFormData({
        auto_insurance_id: adjuster.auto_insurance_id?.toString() || '',
        first_name: adjuster.first_name || '',
        middle_name: adjuster.middle_name || '',
        last_name: adjuster.last_name || '',
        phone: adjuster.phone || '',
        email: adjuster.email || '',
        fax: adjuster.fax || '',
        street_address: adjuster.street_address || adjuster.mailing_address || '',
        city: adjuster.city || '',
        state: adjuster.state || '',
        zip_code: adjuster.zip_code || ''
      });
      setIsEditing(false);
    }
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
            <p className="mt-2 text-gray-500">Loading adjuster details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isNew && !adjuster) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Adjuster not found</p>
            <Button onClick={() => navigate('/auto-adjusters')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Adjusters
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const adjusterName = isNew 
    ? 'New Adjuster' 
    : [adjuster?.first_name, adjuster?.middle_name, adjuster?.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';

  return (
    <DashboardLayout>
      <BreadcrumbNav
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Auto Insurance', href: '/auto-insurance' },
          { label: 'Adjusters', href: '/auto-adjusters' },
          { label: adjusterName }
        ]}
        className="mb-4"
      />

      <PageHeader
        title={adjusterName}
        description={isNew ? 'Create a new auto insurance adjuster' : 'View and edit auto insurance adjuster details'}
      >
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/auto-adjusters')}>
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
        {/* Adjuster Information */}
        <Card>
          <CardHeader>
            <CardTitle>Adjuster Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <FormSelect
                  name="auto_insurance_id"
                  label="Auto Insurance Carrier Name"
                  value={formData.auto_insurance_id}
                  onChange={(value) => handleChange('auto_insurance_id', value)}
                  options={[
                    { value: '', label: 'Select carrier...' },
                    ...autoInsurers.map(ins => ({ value: ins.id.toString(), label: ins.name }))
                  ]}
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    name="first_name"
                    label="First Name"
                    value={formData.first_name}
                    onChange={(value) => handleChange('first_name', value)}
                  />
                  <FormInput
                    name="middle_name"
                    label="Middle Name"
                    value={formData.middle_name}
                    onChange={(value) => handleChange('middle_name', value)}
                  />
                  <FormInput
                    name="last_name"
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(value) => handleChange('last_name', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auto Insurance Carrier</label>
                  <p className="text-gray-900">{adjuster?.auto_insurance?.name || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <p className="text-gray-900">{adjuster?.first_name || 'N/A'}</p>
                  </div>
                  {adjuster?.middle_name && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                      <p className="text-gray-900">{adjuster.middle_name}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <p className="text-gray-900">{adjuster?.last_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  name="phone"
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                />
                <FormInput
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={(value) => handleChange('email', value)}
                  type="email"
                />
                <FormInput
                  name="fax"
                  label="Fax"
                  value={formData.fax}
                  onChange={(value) => handleChange('fax', value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {adjuster?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-gray-900">{adjuster.phone}</p>
                  </div>
                )}
                {adjuster?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{adjuster.email}</p>
                  </div>
                )}
                {adjuster?.fax && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                    <p className="text-gray-900">{adjuster.fax}</p>
                  </div>
                )}
                {!adjuster?.phone && !adjuster?.email && !adjuster?.fax && (
                  <p className="text-gray-500">No contact information available</p>
                )}
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
                  name="street_address"
                  label="Street Address"
                  value={formData.street_address}
                  onChange={(value) => handleChange('street_address', value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    name="city"
                    label="City"
                    value={formData.city}
                    onChange={(value) => handleChange('city', value)}
                  />
                  <FormInput
                    name="state"
                    label="State"
                    value={formData.state}
                    onChange={(value) => handleChange('state', value)}
                  />
                  <FormInput
                    name="zip_code"
                    label="Zip Code"
                    value={formData.zip_code}
                    onChange={(value) => handleChange('zip_code', value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {adjuster?.street_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <p className="text-gray-900">{adjuster.street_address}</p>
                  </div>
                )}
                {(adjuster?.city || adjuster?.state || adjuster?.zip_code) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {adjuster?.city && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <p className="text-gray-900">{adjuster.city}</p>
                      </div>
                    )}
                    {adjuster?.state && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <p className="text-gray-900">{adjuster.state}</p>
                      </div>
                    )}
                    {adjuster?.zip_code && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                        <p className="text-gray-900">{adjuster.zip_code}</p>
                      </div>
                    )}
                  </div>
                )}
                {!adjuster?.street_address && !adjuster?.city && !adjuster?.state && !adjuster?.zip_code && (
                  <p className="text-gray-500">No address information available</p>
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

