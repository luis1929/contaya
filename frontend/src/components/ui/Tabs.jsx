export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === tab.value
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active === tab.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
