import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SetlistData {
  name: string;
  gig_name: string | null;
  gig_date: string | null;
  description: string | null;
}

interface CreateSetlistModalProps {
  onClose: () => void;
  onCreateSetlist: (setlistData: SetlistData) => void;
}

export const CreateSetlistModal = ({ onClose, onCreateSetlist }: CreateSetlistModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    gig_name: '',
    gig_date: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onCreateSetlist({
      name: formData.name,
      gig_name: formData.gig_name || null,
      gig_date: formData.gig_date || null,
      description: formData.description || null
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Create New Setlist</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Setlist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter setlist name"
              className="mt-1 bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="gig_name" className="text-white">Gig Name</Label>
            <Input
              id="gig_name"
              value={formData.gig_name}
              onChange={(e) => handleChange('gig_name', e.target.value)}
              placeholder="Enter gig name (optional)"
              className="mt-1 bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="gig_date" className="text-white">Gig Date</Label>
            <Input
              id="gig_date"
              type="date"
              value={formData.gig_date}
              onChange={(e) => handleChange('gig_date', e.target.value)}
              className="mt-1 bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add notes about this setlist (optional)"
              className="mt-1 bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={!formData.name.trim()}
            >
              Create Setlist
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
