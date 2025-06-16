// types.ts
export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface LandLoan {
  id: string;
  title: string;
  description: string;
  size: number;
  collateralType: string;
  collateralAmount: string;
  termMonths: number;
  interestRate: number;
  yieldScore: number;
  owner: string;
  isLent: boolean;
  borrower: string | null;
  coordinates: Coordinates;
}

export interface LandLoanRaw {
  id: bigint;
  title: string;
  description: string;
  size: bigint;
  collateralToken: string;
  collateralAmount: bigint;
  termMonths: bigint;
  interestRate: bigint;
  yieldScore: bigint;
  owner: string;
  isLent: boolean;
  borrower: string;
}

export interface CryptoLoan {
  id: string;
  title: string;
  description: string;
  amountETH: string;
  collateral: string;
  interestRate: number;
  termMonths: number;
  yieldScore: number;
  relatedLandId: string;
  owner: string;
  isActive: boolean;
}

export interface CryptoLoanRaw {
  id: bigint;
  title: string;
  description: string;
  amountETH: bigint;
  collateral: string;
  interestRate: bigint;
  termMonths: bigint;
  yieldScore: bigint;
  relatedLandId: bigint;
  owner: string;
  isActive: boolean;
}

export interface Seed {
  id: string;
  name: string;
  description: string;
  strain: string;
  price: string;
  imageUrl: string;
  owner: string;
}

export interface SeedRaw {
  id: bigint;
  name: string;
  description: string;
  strain: string;
  price: bigint;
  imageUrl: string;
  owner: string;
}

export interface FormData {
  [key: string]: string | number | File | undefined;
  'land-id'?: string;
  'land-title'?: string;
  'land-description'?: string;
  'land-size'?: string;
  'land-collateral'?: string;
  'land-collateral-type'?: string;
  'land-term'?: string;
  'land-interest'?: string;
  'crypto-loan-title'?: string;
  'crypto-loan-description'?: string;
  'crypto-loan-amount'?: string;
  'crypto-loan-collateral'?: string;
  'crypto-loan-term'?: string;
  'crypto-loan-interest'?: string;
  'seed-name'?: string;
  'seed-description'?: string;
  'seed-strain'?: string;
  'seed-price'?: string;
  'seed-image'?: File;
  'stake-amount'?: string;
  'unstake-amount'?: string;
  'unlist-land-select'?: string;
  'unlist-crypto-loan-select'?: string;
  'unlist-seed-select'?: string;
}