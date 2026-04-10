import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  username: string | null;
  tag: string | null;
  isModalOpen: boolean;
  
  setUsername: (name: string) => void;
  openModal: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      tag: null,
      isModalOpen: false,

      setUsername: (name: string) => {
        // Tag is a random 4 digit number padded with zeroes
        const randomTag = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        set({
          username: name.toLowerCase(),
          tag: randomTag,
          isModalOpen: false
        });
      },

      openModal: () => {
        set({ isModalOpen: true });
      }
    }),
    {
      name: 'designsight_user',
      // We persist the username and tag across sessions. We do not persist the modal open state,
      // because we want the modal to automatically calculate its requirement based on presence of username.
      partialize: (state) => ({ username: state.username, tag: state.tag }),
    }
  )
);
