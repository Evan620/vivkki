interface TabTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function TabTransition({ children, className = "" }: TabTransitionProps) {
    return (
        <div
            className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out ${className}`}
        >
            {children}
        </div>
    );
}
