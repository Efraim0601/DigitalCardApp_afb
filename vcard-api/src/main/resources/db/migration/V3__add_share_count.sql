-- Add share_count column to cards table
ALTER TABLE cards ADD COLUMN share_count INTEGER DEFAULT 0;