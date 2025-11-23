import React from 'react';

interface PersonAvatarProps {
  person: {
    name: string;
    image: string;
    url?: string;
    linkedin?: string;
  };
  size?: number; // Optional size override, defaults to 24px
  className?: string; // Optional additional className
}

/**
 * PersonAvatar Component
 * 
 * A reusable component for displaying a person's avatar with their name.
 * Used consistently across work portfolio pages and the career odyssey.
 * 
 * @param person - Person object with name, image, and optional url/linkedin
 * @param size - Avatar size in pixels (default: 24px)
 * @param className - Optional additional CSS class names
 * 
 * @example
 * ```tsx
 * <PersonAvatar 
 *   person={{
 *     name: "John Doe",
 *     image: "/images/people/john.jpg",
 *     url: "https://johndoe.com"
 *   }}
 *   size={24}
 * />
 * ```
 */
export const PersonAvatar: React.FC<PersonAvatarProps> = ({ 
  person, 
  size = 24,
  className = ''
}) => {
  const avatarStyle = {
    '--avatar-size': `${size}px`
  } as React.CSSProperties;

  const avatarContent = (
    <>
      <img
        src={person.image}
        alt={person.name}
        className="person-avatar-image"
        loading="lazy"
      />
      <span className="person-avatar-name">{person.name}</span>
    </>
  );

  if (person.url) {
    return (
      <a
        href={person.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`person-avatar-link ${className}`}
        aria-label={`Visit ${person.name}'s website`}
        style={avatarStyle}
      >
        {avatarContent}
      </a>
    );
  }

  return (
    <div 
      className={`person-avatar-wrapper ${className}`}
      style={avatarStyle}
    >
      {avatarContent}
    </div>
  );
};
