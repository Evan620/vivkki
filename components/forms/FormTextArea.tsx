interface FormTextAreaProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    error?: string;
    placeholder?: string;
    rows?: number;
}

export default function FormTextArea({
    label,
    name,
    value,
    onChange,
    required = false,
    error,
    placeholder,
    rows = 4
}: FormTextAreaProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                suppressHydrationWarning
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${error ? 'border-red-500' : 'border-gray-300'
                    }`}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
}
