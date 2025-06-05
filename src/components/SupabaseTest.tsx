import { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .limit(1);

        if (error) {
          setStatus('error');
          setMessage(`Error: ${error.message}`);
          return;
        }

        setStatus('success');
        setMessage('Successfully connected to Supabase!');
        console.log('Test query result:', data);
      } catch (error) {
        setStatus('error');
        setMessage(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Supabase Connection Test</h2>
      <div className={`p-4 rounded ${
        status === 'loading' ? 'bg-yellow-100' :
        status === 'success' ? 'bg-green-100' :
        'bg-red-100'
      }`}>
        {status === 'loading' ? 'Testing connection...' : message}
      </div>
    </div>
  );
} 