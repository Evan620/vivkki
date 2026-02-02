interface FormInputProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    error?: string;
    placeholder?: string;
    maxLength?: number;
    helpText?: string;
}

export default function FormInput({
    label,
    name,
    value,
    onChange,
    type = 'text',
    required = false,
    error,
    placeholder,
    maxLength,
    helpText
}: FormInputProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
            />
            {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
