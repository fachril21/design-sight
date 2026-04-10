import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useUserStore } from '../../store/userStore';

export function UsernameModal() {
  const { username, isModalOpen, setUsername, openModal } = useUserStore();
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState('');

  // If there's no username stored, force the modal open immediately.
  useEffect(() => {
    if (!username && !isModalOpen) {
      openModal();
    }
  }, [username, isModalOpen, openModal]);

  // Sync input string with store when modal opens (if they want to change it)
  useEffect(() => {
    if (isModalOpen && username) {
      setInputName(username);
    } else if (isModalOpen && !username) {
      setInputName('');
    }
  }, [isModalOpen, username]);

  // Keep internal Modal open if neither condition met
  const isActuallyOpen = isModalOpen || !username;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputName.trim();
    
    if (val.length < 3 || val.length > 16) {
      setError('Username must be between 3 and 16 characters.');
      return;
    }
    
    // Alphanumeric + underscore, no spaces
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      setError('Only letters, numbers, and underscores allowed.');
      return;
    }

    setError('');
    setUsername(val);
  };

  return (
    <Modal
      isOpen={isActuallyOpen}
      onClose={() => {
        // Only allow close if they already have a username assigned
        if (username) {
          useUserStore.setState({ isModalOpen: false });
        }
      }}
      title="Welcome to DesignSight"
      description="Choose a display name for the leaderboards."
      preventOutsideClick={!username}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <input 
            type="text" 
            placeholder="e.g. josh_designer"
            value={inputName}
            onChange={(e) => {
              setInputName(e.target.value);
              if (error) setError('');
            }}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
            autoFocus
          />
          {error && <span className="text-sm text-red-500 font-medium px-1">{error}</span>}
          <p className="text-xs text-text-secondary px-1">
            Min 3 characters. Letters, numbers, and underscores only.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full mt-2" disabled={!inputName.trim()}>
          {username ? "Update Alias" : "Start Playing"}
        </Button>
      </form>
    </Modal>
  );
}
