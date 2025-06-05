-- Drop existing policies for songs table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON songs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON songs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON songs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON songs;

-- Drop existing policies for setlists table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON setlists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON setlists;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON setlists;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON setlists;

-- Drop existing policies for setlist_songs table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON setlist_songs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON setlist_songs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON setlist_songs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON setlist_songs;

-- Enable RLS on all tables
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for songs table
CREATE POLICY "Enable read access for authenticated users" ON songs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON songs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON songs
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON songs
    FOR DELETE
    TO authenticated
    USING (true);

-- Create policies for setlists table
CREATE POLICY "Enable read access for authenticated users" ON setlists
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON setlists
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON setlists
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON setlists
    FOR DELETE
    TO authenticated
    USING (true);

-- Create policies for setlist_songs table
CREATE POLICY "Enable read access for authenticated users" ON setlist_songs
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON setlist_songs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON setlist_songs
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON setlist_songs
    FOR DELETE
    TO authenticated
    USING (true); 