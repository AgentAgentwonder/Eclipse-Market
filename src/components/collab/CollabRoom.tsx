import { FormEvent, useMemo, useState } from 'react';
import {
  useCollabStore,
  Participant,
  ParticipantPermissions,
  SharedOrder,
  SharedWatchlist,
  LeaderboardEntry,
} from '../../store/collabStore';

const blankWatchlist = { name: '', symbols: '' };
const blankOrder = {
  symbol: '',
  side: 'Buy' as SharedOrder['side'],
  order_type: 'Limit' as SharedOrder['order_type'],
  quantity: 0,
  price: 0,
};

export function CollabRoom() {
  const room = useCollabStore((state) => state.currentRoom);
  const participants = useCollabStore((state) => state.participants);
  const messages = useCollabStore((state) => state.messages);
  const watchlists = useCollabStore((state) => state.watchlists);
  const orders = useCollabStore((state) => state.orders);
  const competition = useCollabStore((state) => state.competition);
  const leaveRoom = useCollabStore((state) => state.leaveRoom);
  const sendMessage = useCollabStore((state) => state.sendMessage);
  const shareWatchlist = useCollabStore((state) => state.shareWatchlist);
  const shareOrder = useCollabStore((state) => state.shareOrder);
  const moderateUser = useCollabStore((state) => state.moderateUser);
  const updatePermissions = useCollabStore((state) => state.updatePermissions);
  const updateLeaderboard = useCollabStore((state) => state.updateLeaderboard);
  const currentUserId = useCollabStore((state) => state.currentUserId);

  const [message, setMessage] = useState('');
  const [watchlistDraft, setWatchlistDraft] = useState(blankWatchlist);
  const [orderDraft, setOrderDraft] = useState(blankOrder);

  const isOwner = useMemo(() => {
    if (!room) return false;
    return room.owner_id === currentUserId;
  }, [room, currentUserId]);

  if (!room) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        Select a collaborative room to begin.
      </div>
    );
  }

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    await sendMessage(message.trim());
    setMessage('');
  };

  const handleShareWatchlist = async (event: FormEvent) => {
    event.preventDefault();
    const symbols = watchlistDraft.symbols
      .split(',')
      .map((ticker) => ticker.trim().toUpperCase())
      .filter(Boolean);

    if (!watchlistDraft.name.trim() || symbols.length === 0) return;

    await shareWatchlist(watchlistDraft.name.trim(), symbols);
    setWatchlistDraft(blankWatchlist);
  };

  const handleShareOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!orderDraft.symbol.trim() || orderDraft.quantity <= 0) return;

    await shareOrder({
      symbol: orderDraft.symbol.trim().toUpperCase(),
      side: orderDraft.side,
      order_type: orderDraft.order_type,
      quantity: orderDraft.quantity,
      price: orderDraft.price > 0 ? orderDraft.price : undefined,
      notes: undefined,
    });

    setOrderDraft(blankOrder);
  };

  const handlePromoteToModerator = async (participant: Participant) => {
    const permissions: ParticipantPermissions = {
      ...participant.permissions,
      can_moderate: true,
      can_kick: true,
      can_ban: false,
    };
    await updatePermissions(participant.user_id, permissions);
  };

  const handleMuteParticipant = async (participant: Participant) => {
    await moderateUser(participant.user_id, 'Mute', 'Moderator action', 30);
  };

  const handleKickParticipant = async (participant: Participant) => {
    await moderateUser(participant.user_id, 'Kick', 'Moderator action');
  };

  const handleLeaderboardBump = async (entry: LeaderboardEntry, delta: number) => {
    if (!competition) return;
    const updated = competition.leaderboard.map((row) =>
      row.user_id === entry.user_id
        ? { ...row, score: Math.max(0, row.score + delta), total_return: row.total_return + delta / 100 }
        : row
    );
    await updateLeaderboard(updated);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <aside className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Room Info</h3>
              <p className="text-xs text-muted-foreground">Secure session with end-to-end encryption</p>
            </div>
            <button
              onClick={() => leaveRoom()}
              className="rounded border border-destructive px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              Leave room
            </button>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="font-medium">{room.owner_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Max participants</dt>
              <dd className="font-medium">{room.max_participants}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Voice/Video</dt>
              <dd className="font-medium">
                {room.voice_enabled ? 'Voice' : 'No voice'} / {room.video_enabled ? 'Video' : 'No video'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Screen sharing</dt>
              <dd className="font-medium">{room.screen_share_enabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Participants</h3>
            <span className="text-xs text-muted-foreground">{participants.length} online</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background px-3 py-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{participant.username}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                      {participant.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{participant.permissions.can_speak ? '🎤' : '🔇'}</span>
                    <span>{participant.permissions.can_share_video ? '🎥' : '🚫'}</span>
                    <span>{participant.permissions.can_share_screen ? '🖥️' : '🚫'}</span>
                  </div>
                </div>
                {isOwner && participant.user_id !== currentUserId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePromoteToModerator(participant)}
                      className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                    >
                      Promote
                    </button>
                    <button
                      onClick={() => handleMuteParticipant(participant)}
                      className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100"
                    >
                      Mute
                    </button>
                    <button
                      onClick={() => handleKickParticipant(participant)}
                      className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
                    >
                      Kick
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Share Watchlist</h3>
          <form onSubmit={handleShareWatchlist} className="mt-3 space-y-3 text-sm">
            <input
              placeholder="Watchlist name"
              value={watchlistDraft.name}
              onChange={(event) => setWatchlistDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              placeholder="Symbols (comma separated)"
              value={watchlistDraft.symbols}
              onChange={(event) =>
                setWatchlistDraft((prev) => ({ ...prev, symbols: event.target.value }))
              }
              className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="w-full rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Share watchlist
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Share Order</h3>
          <form onSubmit={handleShareOrder} className="mt-3 grid gap-3 text-sm">
            <input
              placeholder="Symbol"
              value={orderDraft.symbol}
              onChange={(event) => setOrderDraft((prev) => ({ ...prev, symbol: event.target.value }))}
              className="rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="radio"
                  name="orderSide"
                  value="Buy"
                  checked={orderDraft.side === 'Buy'}
                  onChange={() => setOrderDraft((prev) => ({ ...prev, side: 'Buy' }))}
                />
                Buy
              </label>
              <label className="flex items-center gap-2 text-xs font-medium">
                <input
                  type="radio"
                  name="orderSide"
                  value="Sell"
                  checked={orderDraft.side === 'Sell'}
                  onChange={() => setOrderDraft((prev) => ({ ...prev, side: 'Sell' }))}
                />
                Sell
              </label>
            </div>
            <label className="text-xs font-medium">
              Order type
              <select
                value={orderDraft.order_type}
                onChange={(event) =>
                  setOrderDraft((prev) => ({ ...prev, order_type: event.target.value as SharedOrder['order_type'] }))
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Market">Market</option>
                <option value="Limit">Limit</option>
                <option value="Stop">Stop</option>
                <option value="StopLimit">Stop Limit</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium">
                Quantity
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={orderDraft.quantity}
                  onChange={(event) =>
                    setOrderDraft((prev) => ({ ...prev, quantity: Number(event.target.value) }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              <label className="text-xs font-medium">
                Price
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={orderDraft.price}
                  onChange={(event) =>
                    setOrderDraft((prev) => ({ ...prev, price: Number(event.target.value) }))
                  }
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Share order
            </button>
          </form>
        </section>
      </aside>

      <main className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Chat</h3>
          <div className="mt-4 h-72 overflow-y-auto rounded-lg border border-border bg-background p-3 text-sm">
            {messages.length === 0 && (
              <p className="text-muted-foreground">No messages yet. Kick off the conversation!</p>
            )}
            <ul className="space-y-2">
              {messages.map((msg) => (
                <li key={msg.id} className="rounded-md bg-muted/60 p-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{msg.username}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{msg.content}</p>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Send
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Shared Watchlists</h3>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Symbols
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background/70">
                {watchlists.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No shared watchlists yet.
                    </td>
                  </tr>
                )}
                {watchlists.map((list) => (
                  <tr key={list.id}>
                    <td className="px-3 py-2 font-medium text-foreground">{list.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{list.symbols.join(', ')}</td>
                    <td className="px-3 py-2 text-muted-foreground">{list.owner_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Shared Orders</h3>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Trader
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Symbol
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Side
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background/70">
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No shared orders yet.
                    </td>
                  </tr>
                )}
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-2 text-foreground">{order.username}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">{order.symbol}</td>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {order.side === 'Buy' ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                          Buy
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-200">
                          Sell
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{order.order_type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{order.quantity}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {order.price ? order.price.toFixed(2) : '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {competition && (
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Competition</h3>
                <p className="text-xs text-muted-foreground">{competition.name}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                {competition.status}
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rank
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Trader
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Score
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Return
                    </th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background/70">
                  {competition.leaderboard.map((entry) => (
                    <tr key={entry.user_id}>
                      <td className="px-3 py-2 font-semibold text-foreground">#{entry.rank}</td>
                      <td className="px-3 py-2 text-foreground">{entry.username}</td>
                      <td className="px-3 py-2 text-foreground">{entry.score.toFixed(1)}</td>
                      <td className="px-3 py-2 text-foreground">{(entry.total_return * 100).toFixed(2)}%</td>
                      <td className="px-3 py-2">
                        {isOwner && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLeaderboardBump(entry, 10)}
                              className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                            >
                              +10
                            </button>
                            <button
                              onClick={() => handleLeaderboardBump(entry, -10)}
                              className="rounded bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
                            >
                              -10
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
