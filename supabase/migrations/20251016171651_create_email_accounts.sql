/*
  # Email Accounts Schema

  1. New Tables
    - `email_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Display name for the account
      - `email` (text) - Email address
      - `imap_host` (text) - IMAP server hostname
      - `imap_port` (integer) - IMAP server port
      - `imap_username` (text) - IMAP username
      - `imap_password` (text) - IMAP password (encrypted)
      - `smtp_host` (text) - SMTP server hostname
      - `smtp_port` (integer) - SMTP server port
      - `smtp_username` (text) - SMTP username
      - `smtp_password` (text) - SMTP password (encrypted)
      - `smtp_secure` (boolean) - Use TLS/SSL
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_accounts` table
    - Add policies for authenticated users to manage their own accounts
    
  3. Important Notes
    - Passwords are stored encrypted in the database
    - Each user can have multiple email accounts
    - IMAP is used for receiving/reading emails
    - SMTP is used for sending emails
*/

CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  imap_host text NOT NULL,
  imap_port integer NOT NULL DEFAULT 993,
  imap_username text NOT NULL,
  imap_password text NOT NULL,
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL DEFAULT 587,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  smtp_secure boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS email_accounts_user_id_idx ON email_accounts(user_id);