import React, { useState } from 'react';

const JsonTree = ({ data, level = 0, isCollapsible = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(level > 1); // Collapse deeper levels by default
  
  if (data === null) return <span className="text-gray-400">null</span>;
  if (typeof data === 'undefined') return <span className="text-gray-400">undefined</span>;
  
  // Primitive types
  if (typeof data !== 'object') {
    if (typeof data === 'string') return <span className="text-green-600">"{data}"</span>;
    if (typeof data === 'number') return <span className="text-blue-600">{data}</span>;
    if (typeof data === 'boolean') return <span className="text-purple-600">{data.toString()}</span>;
    return <span>{String(data)}</span>;
  }
  
  // Empty arrays or objects
  if (Array.isArray(data) && data.length === 0) return <span className="text-gray-500">[]</span>;
  if (!Array.isArray(data) && Object.keys(data).length === 0) return <span className="text-gray-500">{"{}"}</span>;
  
  // Arrays and objects
  const isArray = Array.isArray(data);
  const items = isArray ? data : Object.entries(data);
  const brackets = isArray ? ['[', ']'] : ['{', '}'];
  
  const toggleCollapse = () => {
    if (isCollapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };
  
  const indentSize = 20; // pixels
  
  return (
    <div className="font-mono relative">
      <div className="flex items-center">
        {isCollapsible && (
          <button 
            onClick={toggleCollapse} 
            className="mr-1 text-gray-500 hover:bg-gray-100 rounded w-5 h-5 flex items-center justify-center focus:outline-none"
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
        )}
        <span className="text-gray-700">{brackets[0]}</span>
        {isCollapsed && (
          <span 
            className="text-gray-500 cursor-pointer ml-1" 
            onClick={toggleCollapse}
          >
            {isArray 
              ? `Array(${items.length})` 
              : `Object(${Object.keys(data).length} properties)`}
            <span className="text-gray-700 ml-1">{brackets[1]}</span>
          </span>
        )}
      </div>
      
      {!isCollapsed && (
        <div style={{ marginLeft: `${indentSize}px` }}>
          {isArray ? (
            // Handle arrays
            items.map((item, index) => (
              <div key={index} className="my-1">
                <span className="text-gray-500 mr-1">{index}:</span>
                <JsonTree data={item} level={level + 1} />
                {index < items.length - 1 && <span className="text-gray-700">,</span>}
              </div>
            ))
          ) : (
            // Handle objects
            items.map(([key, value], index) => (
              <div key={key} className="my-1">
                <span className="text-red-600">"{key}"</span>
                <span className="text-gray-700 mx-1">:</span>
                <JsonTree data={value} level={level + 1} />
                {index < items.length - 1 && <span className="text-gray-700">,</span>}
              </div>
            ))
          )}
        </div>
      )}
      
      {!isCollapsed && (
        <div><span className="text-gray-700">{brackets[1]}</span></div>
      )}
    </div>
  );
};

export default JsonTree; 