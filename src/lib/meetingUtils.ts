// Generate a unique meeting room ID
export const generateMeetingId = (): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [
    Array.from({ length: 3 }, () => characters[Math.floor(Math.random() * characters.length)]).join(''),
    Array.from({ length: 4 }, () => characters[Math.floor(Math.random() * characters.length)]).join(''),
    Array.from({ length: 3 }, () => characters[Math.floor(Math.random() * characters.length)]).join('')
  ];
  return segments.join('-');
};

// Generate Jitsi Meet URL
export const generateJitsiMeetingUrl = (roomName: string, displayName?: string): string => {
  const baseUrl = 'https://meet.jit.si';
  const encodedRoom = encodeURIComponent(`debriefed-${roomName}`);
  const params = new URLSearchParams();
  
  if (displayName) {
    params.append('userInfo.displayName', displayName);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}/${encodedRoom}#${queryString}` : `${baseUrl}/${encodedRoom}`;
};

// Generate meeting URL for a consultation
export const generateMeetingUrl = (consultationId: string): string => {
  const meetingId = generateMeetingId();
  return generateJitsiMeetingUrl(`${consultationId.slice(0, 8)}-${meetingId}`);
};

// Format meeting URL for display
export const formatMeetingUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.replace('/', '');
  } catch {
    return url;
  }
};
