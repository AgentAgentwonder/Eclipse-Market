import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useCollabStore, Room, RoomSettings } from '../../store/collabStore';

interface RoomListProps {
  onJoin: (room: Room) => void;
}

const defaultSettings: RoomSettings = {
  allow_guest_join: false,
  require_approval: true,
  allow_voice_chat: true,
  allow_video_chat: true,
  allow_screen_share: true,
  allow_order_sharing: true,
  allow_strategy_sharing: true,
  moderation_enabled: true,
  competition_mode: false,
};

export function RoomList({ onJoin }: RoomListProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [settings, setSettings] = useState<RoomSettings>(defaultSettings);
  const [showCreate, setShowCreate] = useState(false);

  const rooms = useCollabStore((state) => state.rooms);
  const listRooms = useCollabStore((state) => state.listRooms);
  const createRoom = useCollabStore((state) => state.createRoom);

  useEffect(() => {
    listRooms();
    const interval = setInterval(() => listRooms(), 15_000);
    return () => clearInterval(interval);
  }, [listRooms]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const room = await createRoom({
      name: name.trim(),
      description: description.trim() || undefined,
      max_participants: maxParticipants,
      is_public: isPublic,
      password: password.trim() ? password.trim() : undefined,
      settings,
    });

    setName('');
    setDescription('');
    setPassword('');
    setMaxParticipants(10);
    setSettings(defaultSettings);
    setShowCreate(false);

    onJoin(room);
  };

  const publicRooms = useMemo(() => rooms.filter((room) => room.is_public), [rooms]);
  const privateRooms = useMemo(() => rooms.filter((room) => !room.is_public), [rooms]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Collaborative Rooms</h2>
          <p className="text-sm text-muted-foreground">
            Join voice/video enabled trading rooms with shared dashboards.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          {showCreate ? 'Cancel' : 'Create Room'}
        </button>
      </header>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Room name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Description</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Password (optional)</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium">Max participants</span>
              <input
                type="number"
                min={2}
                max={100}
                value={maxParticipants}
                onChange={(event) => setMaxParticipants(Number(event.target.value))}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SettingToggle
              label="Public room"
              description="Visible in room listings"
              value={isPublic}
              onChange={setIsPublic}
            />
            <SettingToggle
              label="Allow guest join"
              description="Permit view-only access without invite"
              value={settings.allow_guest_join}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, allow_guest_join: checked }))
              }
            />
            <SettingToggle
              label="Require approval"
              description="Owner must approve join requests"
              value={settings.require_approval}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, require_approval: checked }))
              }
            />
            <SettingToggle
              label="Voice chat"
              description="Enable microphone access"
              value={settings.allow_voice_chat}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, allow_voice_chat: checked }))
              }
            />
            <SettingToggle
              label="Video chat"
              description="Allow camera streaming"
              value={settings.allow_video_chat}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, allow_video_chat: checked }))
              }
            />
            <SettingToggle
              label="Screen sharing"
              description="Share charts and terminals"
              value={settings.allow_screen_share}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, allow_screen_share: checked }))
              }
            />
            <SettingToggle
              label="Order sharing"
              description="Collaborative trade blotter"
              value={settings.allow_order_sharing}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, allow_order_sharing: checked }))
              }
            />
            <SettingToggle
              label="Strategy sharing"
              description="Post scripts and notes"
              value={settings.allow_strategy_sharing}
              onChange={(checked) =>
                setSettings((prev) => ({ ...prev, allow_strategy_sharing: checked }))
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              disabled={!name.trim()}
            >
              Create room
            </button>
          </div>
        </form>
      )}

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Public rooms
          </h3>
        </div>
        <div className="space-y-3">
          {publicRooms.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No public rooms yet. Create one and invite your teammates.
            </p>
          )}
          {publicRooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={onJoin} isPrivate={false} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Private rooms
          </h3>
        </div>
        <div className="space-y-3">
          {privateRooms.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Private rooms you create will appear here for quick access.
            </p>
          )}
          {privateRooms.map((room) => (
            <RoomCard key={room.id} room={room} onJoin={onJoin} isPrivate />
          ))}
        </div>
      </section>
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function SettingToggle({ label, description, value, onChange }: SettingToggleProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-border accent-primary"
      />
    </label>
  );
}

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
  isPrivate: boolean;
}

function RoomCard({ room, onJoin, isPrivate }: RoomCardProps) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="text-base font-semibold text-foreground">{room.name}</h4>
          {isPrivate ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Private
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              Public
            </span>
          )}
        </div>
        {room.description && (
          <p className="text-sm text-muted-foreground">{room.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Max {room.max_participants} participants</span>
          {room.voice_enabled && <span>Voice</span>}
          {room.video_enabled && <span>Video</span>}
          {room.screen_share_enabled && <span>Screen share</span>}
          {room.settings.competition_mode && <span>Competition</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onJoin(room)}
        className="rounded border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
      >
        {isPrivate ? 'Join (password)' : 'Join room'}
      </button>
    </article>
  );
}
