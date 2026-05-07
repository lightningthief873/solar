const EMOJIS = ['🦊','🐉','🦁','🐺','🦅','🐯','🦋','🐬','🦄','🐻','🦈','🐲','🦉','🐸','🦎'];
const COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFB347','#DDA0DD','#87CEEB','#F0E68C','#98D8C8','#FF8C69','#B0C4DE','#20B2AA','#FF69B4','#9ACD32','#FFA07A'];

export function walletAvatar(addr: string): { emoji: string; color: string } {
  const hash = addr.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);
  return { emoji: EMOJIS[hash % EMOJIS.length], color: COLORS[hash % COLORS.length] };
}

let _username = '';

export function getUsername(): string { return _username; }

export function setUsername(name: string): void { _username = name.trim().slice(0, 20); }
