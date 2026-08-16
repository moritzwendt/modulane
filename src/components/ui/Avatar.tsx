import type { User } from "../../domain/types"
import { IdentityImage } from "./IdentityImage"

export function Avatar({ user, size = "medium" }: { user: User; size?: "small" | "medium" | "large" }) {
  return (
    <span
      className={`avatar avatar-${size}`}
      style={{ "--avatar-color": user.color } as React.CSSProperties}
      title={user.name}
      aria-label={user.name}
    >
      <IdentityImage name={user.name} imageUrl={user.avatarUrl} color={user.color} />
    </span>
  )
}

export function AvatarGroup({ users, limit = 4 }: { users: User[]; limit?: number }) {
  const visible = users.slice(0, limit)
  const remaining = users.length - visible.length

  return (
    <span className="avatar-group" aria-label={`${users.length} Mitglieder`}>
      {visible.map((user) => <Avatar key={user.id} user={user} size="small" />)}
      {remaining > 0 && <span className="avatar avatar-small avatar-more">+{remaining}</span>}
    </span>
  )
}
