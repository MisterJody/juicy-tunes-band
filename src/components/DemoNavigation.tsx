import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Beaker } from 'lucide-react';

/**
 * Simple navigation component to access the demo page
 */
export const DemoNavigation: React.FC = () => {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Link to="/agent-demo">
        <Button variant="outline" className="bg-white shadow-lg">
          <Beaker className="h-4 w-4 mr-2" />
          Agent Demo
        </Button>
      </Link>
    </div>
  );
};