import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import FormTextArea from '../forms/FormTextArea';
import type { IntakeFormData, FormErrors } from '@/types/intake';

interface Step1Props {
    data: IntakeFormData;
    errors: FormErrors;
    onChange: (field: keyof IntakeFormData, value: any) => void;
}

const WRECK_TYPES = [
    { value: 'Rear End', label: 'Rear End' },
    { value: 'T-Bone', label: 'T-Bone' },
    { value: 'Head-On', label: 'Head-On' },
    { value: 'Side Swipe', label: 'Side Swipe' },
    { value: 'Hit and Run', label: 'Hit and Run' },
    { value: 'Pedestrian', label: 'Pedestrian' },
    { value: 'Bicycle', label: 'Bicycle' },
    { value: 'Other', label: 'Other' }
];

const DAMAGE_LEVELS = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' }
];

const US_STATES = [
    { value: 'Oklahoma', label: 'Oklahoma' },
    { value: 'Texas', label: 'Texas' },
    { value: 'Kansas', label: 'Kansas' },
    { value: 'Arkansas', label: 'Arkansas' },
    { value: 'Missouri', label: 'Missouri' }
];

export default function Step1CaseInfo({ data, errors, onChange }: Step1Props) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Date of Loss"
                    name="dateOfLoss"
                    type="date"
                    value={data.dateOfLoss}
                    onChange={(value) => onChange('dateOfLoss', value)}
                    required
                    error={errors.dateOfLoss}
                />
                <FormInput
                    label="Time of Wreck"
                    name="timeOfWreck"
                    type="time"
                    value={data.timeOfWreck}
                    onChange={(value) => onChange('timeOfWreck', value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    label="Sign-Up Date"
                    name="signUpDate"
                    type="date"
                    value={data.signUpDate}
                    onChange={(value) => onChange('signUpDate', value)}
                    required
                    error={errors.signUpDate}
                    helpText="Date when client signed up for representation"
                />
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <p className="text-sm text-primary">
                            <strong>Statute Deadline:</strong> {data.dateOfLoss ?
                                new Date(new Date(data.dateOfLoss).getTime() + (2 * 365 * 24 * 60 * 60 * 1000)).toLocaleDateString() :
                                'Enter accident date'
                            }
                        </p>
                    </div>
                </div>
            </div>

            <FormSelect
                label="Accident Type"
                name="wreckType"
                value={data.wreckType}
                onChange={(value) => onChange('wreckType', value)}
                options={WRECK_TYPES}
                required
                error={errors.wreckType}
            />

            <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Location</h3>
                <div className="space-y-4">
                    <FormInput
                        label="Wreck Street"
                        name="wreckStreet"
                        value={data.wreckStreet}
                        onChange={(value) => onChange('wreckStreet', value)}
                        placeholder="e.g., 1234 Main St"
                        required
                        error={errors.wreckStreet}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                            label="City"
                            name="wreckCity"
                            value={data.wreckCity}
                            onChange={(value) => onChange('wreckCity', value)}
                            required
                            error={errors.wreckCity}
                        />
                        <FormInput
                            label="County"
                            name="wreckCounty"
                            value={data.wreckCounty}
                            onChange={(value) => onChange('wreckCounty', value)}
                            required
                            error={errors.wreckCounty}
                        />
                    </div>
                    <FormSelect
                        label="State"
                        name="wreckState"
                        value={data.wreckState}
                        onChange={(value) => onChange('wreckState', value)}
                        options={US_STATES}
                        required
                        error={errors.wreckState}
                    />
                </div>
            </div>

            <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Police Report</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Was police involved?
                            <span className="text-destructive ml-1">*</span>
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="isPoliceInvolved"
                                    checked={data.isPoliceInvolved === true}
                                    onChange={() => onChange('isPoliceInvolved', true)}
                                    className="mr-2"
                                />
                                Yes
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="isPoliceInvolved"
                                    checked={data.isPoliceInvolved === false}
                                    onChange={() => onChange('isPoliceInvolved', false)}
                                    className="mr-2"
                                />
                                No
                            </label>
                        </div>
                    </div>

                    {data.isPoliceInvolved && (
                        <>
                            <FormInput
                                label="Police Department"
                                name="policeForce"
                                value={data.policeForce}
                                onChange={(value) => onChange('policeForce', value)}
                                placeholder="e.g., Oklahoma City Police Department"
                            />

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Is there a police report?
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="isPoliceReport"
                                            checked={data.isPoliceReport === true}
                                            onChange={() => onChange('isPoliceReport', true)}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="isPoliceReport"
                                            checked={data.isPoliceReport === false}
                                            onChange={() => onChange('isPoliceReport', false)}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            {data.isPoliceReport && (
                                <FormInput
                                    label="Police Report Number"
                                    name="policeReportNumber"
                                    value={data.policeReportNumber}
                                    onChange={(value) => onChange('policeReportNumber', value)}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Vehicle</h3>
                <div className="space-y-4">
                    <FormInput
                        label="Vehicle Description"
                        name="vehicleDescription"
                        value={data.vehicleDescription}
                        onChange={(value) => onChange('vehicleDescription', value)}
                        placeholder="e.g., 2020 Honda Accord"
                    />
                    <FormSelect
                        label="Damage Level"
                        name="damageLevel"
                        value={data.damageLevel}
                        onChange={(value) => onChange('damageLevel', value)}
                        options={DAMAGE_LEVELS}
                    />
                </div>
            </div>

            <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Description</h3>
                <FormTextArea
                    label="Accident Description"
                    name="wreckDescription"
                    value={data.wreckDescription}
                    onChange={(value) => onChange('wreckDescription', value)}
                    placeholder="Describe what happened..."
                    rows={5}
                />
            </div>
        </div>
    );
}
