import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  getAuthorDisplayName, 
  getAuthorProfileTarget, 
  getInitials, 
  getAvatarUrl,
  isPhoneNumber 
} from '../utils/avatar';

/**
 * Standard Member / Author Badge Component
 * Enforces display name over raw phone numbers and wraps author badges & avatars in clickable profile links.
 */
export default function AuthorBadge({
  item,
  displayName: propDisplayName,
  profileTarget: propProfileTarget,
  avatarUrl: propAvatarUrl,
  subtitle,
  size = 'md', // 'sm' | 'md' | 'lg'
  avatarOnly = false,
  showHandle = false,
  className = '',
  linkClassName = ''
}) {
  const [imageError, setImageError] = useState(false);

  const displayName = propDisplayName || getAuthorDisplayName(item);
  const profileTarget = propProfileTarget || getAuthorProfileTarget(item);
  const initials = getInitials(displayName);

  // Avatar URL candidates
  const rawAvatar = propAvatarUrl || 
    (item && typeof item === 'object' 
      ? (item.author_avatar || item.avatar || item.user_avatar || item.user?.avatar_url || item.user?.avatar) 
      : null);
  
  const hasRealAvatar = Boolean(rawAvatar && typeof rawAvatar === 'string' && rawAvatar.trim() && !imageError);
  const resolvedAvatar = hasRealAvatar ? getAvatarUrl(rawAvatar, displayName) : null;

  // Sizing definitions
  const sizeMap = {
    sm: {
      avatar: 'w-6 h-6 text-[10px]',
      name: 'text-xs',
      sub: 'text-[10px]'
    },
    md: {
      avatar: 'w-8 h-8 text-xs',
      name: 'text-xs sm:text-sm font-semibold',
      sub: 'text-[11px]'
    },
    lg: {
      avatar: 'w-10 h-10 text-sm',
      name: 'text-sm sm:text-base font-bold',
      sub: 'text-xs'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Raw username for @handle display
  const rawUsername = item?.author_username || item?.user?.username || (typeof item?.author === 'string' && !isPhoneNumber(item.author) ? item.author : null);

  const avatarContent = (
    <div className={`${currentSize.avatar} rounded-full overflow-hidden shrink-0 border border-[#C48B47]/40 shadow-xs flex items-center justify-center font-bold bg-[#3B2314] text-[#F8F4EC] transition-transform duration-200 group-hover:scale-105`}>
      {hasRealAvatar ? (
        <img
          src={resolvedAvatar}
          alt={displayName}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  if (avatarOnly) {
    return (
      <NavLink
        to={profileTarget}
        className={`inline-block group ${linkClassName}`}
        title={`View ${displayName}'s profile`}
      >
        {avatarContent}
      </NavLink>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NavLink
        to={profileTarget}
        className={`flex items-center gap-2.5 group transition-opacity hover:opacity-90 ${linkClassName}`}
        title={`View ${displayName}'s profile`}
      >
        {avatarContent}
        <div className="leading-tight">
          <span className={`block text-[#2D1B0F] group-hover:text-[#A35C33] group-hover:underline ${currentSize.name}`}>
            {displayName}
          </span>
          {showHandle && rawUsername && rawUsername !== displayName && (
            <span className="text-[10px] text-[#2D1B0F]/60 block -mt-0.5">
              @{rawUsername}
            </span>
          )}
          {subtitle && (
            <span className={`block text-[#2D1B0F]/55 font-normal ${currentSize.sub}`}>
              {subtitle}
            </span>
          )}
        </div>
      </NavLink>
    </div>
  );
}
