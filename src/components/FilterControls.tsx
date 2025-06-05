
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, SortAsc, SortDesc } from 'lucide-react';

interface FilterControlsProps {
  onFilterByKey: (key: string) => void;
  onFilterByTempo: (range: string) => void;
  onSort: (field: string, direction: 'asc' | 'desc') => void;
  currentKeyFilter: string;
  currentTempoFilter: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

export const FilterControls = ({
  onFilterByKey,
  onFilterByTempo,
  onSort,
  currentKeyFilter,
  currentTempoFilter,
  sortField,
  sortDirection
}: FilterControlsProps) => {
  const musicalKeys = [
    'All Keys', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  const tempoRanges = [
    { label: 'All Tempos', value: 'all' },
    { label: 'Slow (60-90 BPM)', value: '60-90' },
    { label: 'Medium (90-120 BPM)', value: '90-120' },
    { label: 'Fast (120-150 BPM)', value: '120-150' },
    { label: 'Very Fast (150+ BPM)', value: '150+' }
  ];

  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-purple-800/30 rounded-lg p-4 mb-6 border border-purple-500/20">
      <div className="flex items-center space-x-4 mb-4">
        <Filter className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">Filter & Sort</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Key</label>
          <Select value={currentKeyFilter} onValueChange={onFilterByKey}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {musicalKeys.map((key) => (
                <SelectItem key={key} value={key === 'All Keys' ? 'all' : key} className="text-white hover:bg-gray-600">
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tempo</label>
          <Select value={currentTempoFilter} onValueChange={onFilterByTempo}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select tempo range" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {tempoRanges.map((range) => (
                <SelectItem key={range.value} value={range.value} className="text-white hover:bg-gray-600">
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
          <Select value={sortField} onValueChange={(field) => onSort(field, sortDirection)}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="title" className="text-white hover:bg-gray-600">Title</SelectItem>
              <SelectItem value="artist" className="text-white hover:bg-gray-600">Artist</SelectItem>
              <SelectItem value="tempo" className="text-white hover:bg-gray-600">Tempo</SelectItem>
              <SelectItem value="key" className="text-white hover:bg-gray-600">Key</SelectItem>
              <SelectItem value="uploadDate" className="text-white hover:bg-gray-600">Upload Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
          <Button
            onClick={() => onSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
            variant="outline"
            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            {sortDirection === 'asc' ? (
              <>
                <SortAsc className="w-4 h-4 mr-2" />
                Ascending
              </>
            ) : (
              <>
                <SortDesc className="w-4 h-4 mr-2" />
                Descending
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
