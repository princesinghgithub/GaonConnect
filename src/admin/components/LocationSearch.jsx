import React, { useState } from "react";

const LocationSearch = ({ label, onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const searchLocation = async (text) => {
    setQuery(text);

    if (text.length < 3) return;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${text}`
    );

    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="mb-3">
      <p className="font-semibold mb-1">{label}</p>

      <input
        value={query}
        onChange={(e) => searchLocation(e.target.value)}
        className="border px-4 py-2 rounded w-full"
        placeholder="Start typing..."
      />

      {results.length > 0 && (
        <div className="border rounded bg-white max-h-40 overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.place_id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect({
                  address: r.display_name,
                  lat: parseFloat(r.lat),
                  lon: parseFloat(r.lon),
                });

                setQuery(r.display_name);
                setResults([]);
              }}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
