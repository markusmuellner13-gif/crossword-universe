export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('crossword_session_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('crossword_session_id', id);
  }
  return id;
}
