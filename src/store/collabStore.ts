import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export interface Room {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  max_participants: number;
  is_public: boolean;
  encryption_enabled: boolean;
  voice_enabled: boolean;
  video_enabled: boolean;
  screen_share_enabled: boolean;
  settings: RoomSettings;
}

export interface RoomSettings {
  allow_guest_join: boolean;
  require_approval: boolean;
  allow_voice_chat: boolean;
  allow_video_chat: boolean;
  allow_screen_share: boolean;
  allow_order_sharing: boolean;
  allow_strategy_sharing: boolean;
  moderation_enabled: boolean;
  competition_mode: boolean;
}

export interface Participant {
  id: string;
  user_id: string;
  username: string;
  room_id: string;
  joined_at: string;
  last_active: string;
  role: 'Owner' | 'Moderator' | 'Member' | 'Guest';
  permissions: ParticipantPermissions;
  status: 'Active' | 'Idle' | 'Away' | 'Busy';
  is_muted: boolean;
  is_video_off: boolean;
  is_screen_sharing: boolean;
}

export interface ParticipantPermissions {
  can_speak: boolean;
  can_share_video: boolean;
  can_share_screen: boolean;
  can_chat: boolean;
  can_share_orders: boolean;
  can_share_strategies: boolean;
  can_moderate: boolean;
  can_kick: boolean;
  can_ban: boolean;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  mentions: string[];
  replied_to?: string;
}

export interface SharedWatchlist {
  id: string;
  room_id: string;
  name: string;
  owner_id: string;
  symbols: string[];
  created_at: string;
  updated_at: string;
}

export interface SharedOrder {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  order_type: 'Market' | 'Limit' | 'Stop' | 'StopLimit';
  quantity: number;
  price?: number;
  status: 'Pending' | 'Filled' | 'PartiallyFilled' | 'Cancelled' | 'Rejected';
  timestamp: string;
  notes?: string;
}

export interface Competition {
  id: string;
  room_id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  rules: CompetitionRules;
  leaderboard: LeaderboardEntry[];
  status: 'Pending' | 'Active' | 'Completed' | 'Cancelled';
}

export interface CompetitionRules {
  starting_capital: number;
  allowed_assets?: string[];
  max_position_size?: number;
  scoring_method: 'TotalReturn' | 'RiskAdjustedReturn' | 'WinRate' | 'ProfitFactor';
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  trades: number;
  win_rate: number;
  total_return: number;
}

interface CollabState {
  currentRoom?: Room;
  rooms: Room[];
  participants: Participant[];
  messages: ChatMessage[];
  watchlists: SharedWatchlist[];
  orders: SharedOrder[];
  competition?: Competition;
  isConnected: boolean;
  currentUserId: string;
  currentUsername: string;
  
  // Actions
  setCurrentUser: (userId: string, username: string) => void;
  createRoom: (request: {
    name: string;
    description?: string;
    max_participants: number;
    is_public: boolean;
    password?: string;
    settings: RoomSettings;
  }) => Promise<Room>;
  listRooms: (includePrivate?: boolean) => Promise<void>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  sendMessage: (content: string, repliedTo?: string) => Promise<void>;
  shareWatchlist: (name: string, symbols: string[]) => Promise<void>;
  shareOrder: (order: {
    symbol: string;
    side: 'Buy' | 'Sell';
    order_type: 'Market' | 'Limit' | 'Stop' | 'StopLimit';
    quantity: number;
    price?: number;
    notes?: string;
  }) => Promise<void>;
  updatePermissions: (userId: string, permissions: ParticipantPermissions) => Promise<void>;
  moderateUser: (
    targetUserId: string,
    actionType: 'Mute' | 'Kick' | 'Ban' | 'Warning',
    reason: string,
    durationMinutes?: number
  ) => Promise<void>;
  setCompetition: (competition: Competition) => Promise<void>;
  updateLeaderboard: (leaderboard: LeaderboardEntry[]) => Promise<void>;
  subscribeToRoomEvents: (roomId: string) => Promise<() => void>;
}

export const useCollabStore = create<CollabState>((set, get) => ({
  currentRoom: undefined,
  rooms: [],
  participants: [],
  messages: [],
  watchlists: [],
  orders: [],
  competition: undefined,
  isConnected: false,
  currentUserId: '',
  currentUsername: '',

  setCurrentUser: (userId: string, username: string) => {
    set({ currentUserId: userId, currentUsername: username });
  },

  createRoom: async (request) => {
    const room = await invoke<Room>('collab_create_room', {
      request,
      userId: get().currentUserId,
    });
    set((state) => ({ rooms: [...state.rooms, room] }));
    return room;
  },

  listRooms: async (includePrivate = false) => {
    const rooms = await invoke<Room[]>('collab_list_rooms', {
      includePrivate,
    });
    set({ rooms });
  },

  joinRoom: async (roomId: string, password?: string) => {
    const { currentUserId, currentUsername } = get();
    const participant = await invoke<Participant>('collab_join_room', {
      request: {
        room_id: roomId,
        password,
        username: currentUsername,
      },
      userId: currentUserId,
    });

    const room = await invoke<Room>('collab_get_room', { roomId });
    const participants = await invoke<Participant[]>('collab_get_participants', {
      roomId,
    });
    const messages = await invoke<ChatMessage[]>('collab_get_messages', {
      roomId,
      limit: 50,
    });
    const watchlists = await invoke<SharedWatchlist[]>('collab_get_watchlists', {
      roomId,
    });
    const orders = await invoke<SharedOrder[]>('collab_get_orders', { roomId });
    const competition = await invoke<Competition | null>('collab_get_competition', {
      roomId,
    });

    set({
      currentRoom: room,
      participants,
      messages,
      watchlists,
      orders,
      competition: competition || undefined,
      isConnected: true,
    });

    // Subscribe to room events
    await get().subscribeToRoomEvents(roomId);
  },

  leaveRoom: async () => {
    const { currentRoom, currentUserId } = get();
    if (!currentRoom) return;

    await invoke('collab_leave_room', {
      roomId: currentRoom.id,
      userId: currentUserId,
    });

    set({
      currentRoom: undefined,
      participants: [],
      messages: [],
      watchlists: [],
      orders: [],
      competition: undefined,
      isConnected: false,
    });
  },

  sendMessage: async (content: string, repliedTo?: string) => {
    const { currentRoom, currentUserId, currentUsername } = get();
    if (!currentRoom) return;

    const message = await invoke<ChatMessage>('collab_send_message', {
      request: {
        room_id: currentRoom.id,
        content,
        replied_to: repliedTo,
      },
      userId: currentUserId,
      username: currentUsername,
    });

    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  shareWatchlist: async (name: string, symbols: string[]) => {
    const { currentRoom, currentUserId } = get();
    if (!currentRoom) return;

    const watchlist = await invoke<SharedWatchlist>('collab_share_watchlist', {
      roomId: currentRoom.id,
      name,
      symbols,
      userId: currentUserId,
    });

    set((state) => ({
      watchlists: [...state.watchlists, watchlist],
    }));
  },

  shareOrder: async (order) => {
    const { currentRoom, currentUserId, currentUsername } = get();
    if (!currentRoom) return;

    const sharedOrder = await invoke<SharedOrder>('collab_share_order', {
      request: {
        room_id: currentRoom.id,
        ...order,
      },
      userId: currentUserId,
      username: currentUsername,
    });

    set((state) => ({
      orders: [...state.orders, sharedOrder],
    }));
  },

  updatePermissions: async (userId: string, permissions: ParticipantPermissions) => {
    const { currentRoom, currentUserId } = get();
    if (!currentRoom) return;

    await invoke('collab_update_permissions', {
      request: {
        room_id: currentRoom.id,
        user_id: userId,
        permissions,
      },
      moderatorId: currentUserId,
    });
  },

  moderateUser: async (
    targetUserId: string,
    actionType: 'Mute' | 'Kick' | 'Ban' | 'Warning',
    reason: string,
    durationMinutes?: number
  ) => {
    const { currentRoom, currentUserId } = get();
    if (!currentRoom) return;

    await invoke('collab_moderate_user', {
      request: {
        room_id: currentRoom.id,
        target_user_id: targetUserId,
        action_type: actionType,
        reason,
        duration_minutes: durationMinutes,
      },
      moderatorId: currentUserId,
    });
  },

  setCompetition: async (competition: Competition) => {
    await invoke('collab_set_competition', { competition });
    set({ competition });
  },

  updateLeaderboard: async (leaderboard: LeaderboardEntry[]) => {
    const { currentRoom, competition } = get();
    if (!currentRoom || !competition) return;

    await invoke('collab_update_leaderboard', {
      roomId: currentRoom.id,
      leaderboard,
    });

    set((state) => ({
      competition: state.competition
        ? { ...state.competition, leaderboard }
        : undefined,
    }));
  },

  subscribeToRoomEvents: async (roomId: string) => {
    const unlisten = await listen<any>(`collab:room:${roomId}`, (event) => {
      const message = event.payload;
      const state = get();

      switch (message.type) {
        case 'ParticipantJoined':
          set({
            participants: [...state.participants, message.participant],
          });
          break;

        case 'ParticipantLeft':
          set({
            participants: state.participants.filter(
              (p) => p.user_id !== message.user_id
            ),
          });
          break;

        case 'ParticipantUpdated':
          set({
            participants: state.participants.map((p) =>
              p.id === message.participant.id ? message.participant : p
            ),
          });
          break;

        case 'ChatMessage':
          set({
            messages: [...state.messages, message.message],
          });
          break;

        case 'WatchlistUpdated':
          const existingWatchlist = state.watchlists.find(
            (w) => w.id === message.watchlist.id
          );
          if (existingWatchlist) {
            set({
              watchlists: state.watchlists.map((w) =>
                w.id === message.watchlist.id ? message.watchlist : w
              ),
            });
          } else {
            set({
              watchlists: [...state.watchlists, message.watchlist],
            });
          }
          break;

        case 'OrderShared':
          set({
            orders: [...state.orders, message.order],
          });
          break;

        case 'OrderUpdated':
          set({
            orders: state.orders.map((o) =>
              o.id === message.order.id ? message.order : o
            ),
          });
          break;

        case 'CompetitionUpdated':
          set({ competition: message.competition });
          break;

        case 'LeaderboardUpdated':
          set((state) => ({
            competition: state.competition
              ? { ...state.competition, leaderboard: message.leaderboard }
              : undefined,
          }));
          break;
      }
    });

    return unlisten;
  },
}));
