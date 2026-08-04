export type EntryCategory = 'personal' | 'official';

export type VaultEntry = {
  id: string;
  category: EntryCategory;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  favorite?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type CardNetwork = 'Visa' | 'Mastercard' | 'RuPay' | 'Amex' | 'Other';

export type CardEntry = {
  id: string;
  title: string;
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin: string;
  bankName?: string;
  network: CardNetwork;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type VaultData = {
  entries: VaultEntry[];
  cards: CardEntry[];
};

export type EncryptedBlob = {
  salt: string;
  iv: string;
  cipher: string;
  mac: string;
  iterations: number;
};
