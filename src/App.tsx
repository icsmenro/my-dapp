import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useBalance, useWriteContract, useReadContract, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { ethers } from 'ethers';
import DOMPurify from 'dompurify';
import { Address, isAddress } from 'viem';
import GreenFiABI from '@artifacts/contracts/GreenFi.sol/GreenFi.json';
import WEEDLABI from '@artifacts/contracts/WEEDL.sol/WEEDL.json';
import './styles.css';
import { lazy, Suspense } from 'react';
import { LandLoan, CryptoLoan, Seed, LandLoanRaw, CryptoLoanRaw, SeedRaw, FormData } from './types';

// Lazy-load Metaverse component
const Metaverse = lazy(() => import('./Metaverse'));

// Contract Addresses
const WEEDL_CONTRACT_ADDRESS = import.meta.env.VITE_WEEDL_ADDRESS as Address;
const GREENFI_CONTRACT_ADDRESS = import.meta.env.VITE_GREENFI_CONTRACT_ADDRESS as Address;

// Validate addresses
if (!isAddress(WEEDL_CONTRACT_ADDRESS) || !isAddress(GREENFI_CONTRACT_ADDRESS)) {
  throw new Error('Invalid contract address format in .env');
}

// Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div className="error-message" role="alert">Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}

// Card Components
const GrowerCard: React.FC<{
  loan: LandLoan;
  address: string | undefined;
  onLend: (id: string) => void;
  onRepay: (id: string) => void;
  onRetrieve: (id: string) => void;
}> = ({ loan, address, onLend, onRepay, onRetrieve }) => (
  <div className="card" role="region" aria-label={`Land Loan: ${loan.title}`}>
    <h3>{loan.title}</h3>
    <p>{loan.description}</p>
    <p>Size: {loan.size.toFixed(2)} acres</p>
    <p>Collateral: {Number(loan.collateralAmount).toFixed(4)} {loan.collateralType}</p>
    <p>Term: {loan.termMonths} months</p>
    <p>Interest: {(loan.interestRate * 100).toFixed(2)}%</p>
    <p>Yield Score: {loan.yieldScore.toFixed(2)}</p>
    <p>Status: {loan.isLent ? 'Lent' : 'Available'}</p>
    <div className="card-buttons">
      {!loan.isLent && loan.owner.toLowerCase() !== address?.toLowerCase() && (
        <button className="card-button lend-loan" onClick={() => onLend(loan.id)}>Lend</button>
      )}
      {loan.isLent && loan.borrower?.toLowerCase() === address?.toLowerCase() && (
        <button className="card-button repay-loan" onClick={() => onRepay(loan.id)}>Repay</button>
      )}
      {loan.isLent && loan.owner.toLowerCase() === address?.toLowerCase() && !loan.borrower && (
        <button className="card-button retrieve-loan" onClick={() => onRetrieve(loan.id)}>Retrieve</button>
      )}
    </div>
  </div>
);

const LenderCard: React.FC<{ loan: CryptoLoan }> = ({ loan }) => (
  <div className="card" role="region" aria-label={`Crypto Loan: ${loan.title}`}>
    <h3>{loan.title}</h3>
    <p>{loan.description}</p>
    <p>Amount: {Number(loan.amountETH).toFixed(4)} {loan.collateral}</p>
    <p>Term: {loan.termMonths} months</p>
    <p>Interest: {(loan.interestRate * 100).toFixed(2)}%</p>
    <p>Yield Score: {loan.yieldScore.toFixed(2)}</p>
    <p>Status: {loan.isActive ? 'Active' : 'Inactive'}</p>
  </div>
);

const SeedCard: React.FC<{ seed: Seed; onView: (seed: Seed) => void }> = ({ seed, onView }) => (
  <div className="card" role="region" aria-label={`Seed: ${seed.name}`}>
    <h3>{seed.name}</h3>
    <img src={seed.imageUrl || '/assets/fallback-image.jpg'} alt={seed.name} />
    <p>{seed.description}</p>
    <p>Strain: {seed.strain}</p>
    <p>Price: {Number(seed.price).toFixed(4)} ETH</p>
    <button className="card-button view-seed" onClick={() => onView(seed)}>View Details</button>
  </div>
);

// Error Message Component
const ErrorMessage: React.FC<{ error: string | null; onClose: () => void }> = ({ error, onClose }) => (
  <div className={`error-message ${error ? '' : 'hidden'}`} role="alert">
    {error && (
      <>
        {error}
        <button className="close-error" onClick={onClose} aria-label="Close error">×</button>
      </>
    )}
  </div>
);

// Header Component
const Header: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: ethBalanceData } = useBalance({ address, chainId: 11155111 });
  const [weedlBalance, setWeedlBalance] = useState('0.00');
  const [stakedBalance, setStakedBalance] = useState(0);
  const { open } = useAppKit();

  const weedlContract = useReadContract({
    address: WEEDL_CONTRACT_ADDRESS,
    abi: WEEDLABI.abi,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address },
  });

  const stakedBalanceContract = useReadContract({
    address: GREENFI_CONTRACT_ADDRESS,
    abi: GreenFiABI.abi,
    functionName: 'getStakedBalance',
    args: [address],
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (weedlContract.data) {
      setWeedlBalance(Number(ethers.formatEther(weedlContract.data as bigint)).toFixed(2));
    }
  }, [weedlContract.data]);

  useEffect(() => {
    if (stakedBalanceContract.data) {
      setStakedBalance(Number(ethers.formatUnits(stakedBalanceContract.data as bigint, 18)));
    }
  }, [stakedBalanceContract.data]);

  return (
    <header role="banner" className="header">
      <div className="container header-content">
        <a href="/" className="logo" aria-label="WeedLend Finance logo">WeedLend Finance</a>
        <nav aria-label="Main navigation" className="nav">
          <ul className="nav-list">
            <li><a href="#growers">Growers</a></li>
            <li><a href="#lenders">Lenders</a></li>
            <li><a href="#seeds">Seeds</a></li>
            <li><a href="#metaverse">Metaverse</a></li>
            <li><a href="#stake">Stake</a></li>
          </ul>
        </nav>
        <div className="wallet-info">
          <button
            className="connect-button"
            onClick={() => open()}
            disabled={isConnected}
            aria-label={isConnected ? 'Wallet Connected' : 'Connect Wallet'}
          >
            {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
          </button>
          <span
            id="network-status"
            className={`network-status ${chainId === 11155111 ? 'connected' : ''}`}
            data-tooltip={chainId === 11155111 ? 'Connected to Sepolia' : 'Wrong Network'}
          >
            <span className="status-icon"></span>
            {chainId === 11155111 ? 'Sepolia' : 'Wrong Network'}
          </span>
          <span id="eth-balance" data-tooltip={ethBalanceData ? `${ethBalanceData.formatted} ETH` : '0 ETH'}>
            {ethBalanceData ? `${Number(ethBalanceData.formatted).toFixed(4)} ETH` : '0.0000 ETH'}
          </span>
          <span id="weedl-balance" data-tooltip={`${weedlBalance} WEEDL`}>{weedlBalance} WEEDL</span>
          <span id="staked-balance" data-tooltip={`${stakedBalance.toFixed(2)} WEEDL Staked`}>
            {stakedBalance.toFixed(2)} WEEDL Staked
          </span>
        </div>
      </div>
    </header>
  );
};

// Hero Component
const Hero: React.FC = () => (
  <section className="hero" role="banner">
    <h1>
      Empowering Medicinal <span className="highlight">Cannabis</span> Finance
    </h1>
    <p>
      Secure decentralized funding, land loans, seed purchases, and virtual
      showcases for medicinal cannabis growers and lenders.
    </p>
    <button className="weedl-button" aria-label="Learn about WEEDL token">$WEEDL</button>
  </section>
);

// App Component
const App: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [landLoans, setLandLoans] = useState<LandLoan[]>([]);
  const [cryptoLoans, setCryptoLoans] = useState<CryptoLoan[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LandLoan | null>(null);
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [formData, setFormData] = useState<FormData>({});

  const { data: landLoansRaw } = useReadContract({
    address: GREENFI_CONTRACT_ADDRESS,
    abi: GreenFiABI.abi,
    functionName: 'getLandLoans',
    query: { enabled: !!address },
  });

  const { data: cryptoLoansRaw } = useReadContract({
    address: GREENFI_CONTRACT_ADDRESS,
    abi: GreenFiABI.abi,
    functionName: 'getCryptoLoans',
    query: { enabled: !!address },
  });

  const { data: seedsRaw } = useReadContract({
    address: GREENFI_CONTRACT_ADDRESS,
    abi: GreenFiABI.abi,
    functionName: 'getSeeds',
    query: { enabled: !!address },
  });

  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    if (landLoansRaw) {
      const loans: LandLoan[] = (landLoansRaw as LandLoanRaw[]).map((loan, i) => ({
        id: loan.id.toString(),
        title: DOMPurify.sanitize(loan.title),
        description: DOMPurify.sanitize(loan.description),
        size: Number(loan.size) / 100,
        collateralType: loan.collateralToken,
        collateralAmount: ethers.formatUnits(loan.collateralAmount, 18),
        termMonths: Number(loan.termMonths),
        interestRate: Number(loan.interestRate) / 100,
        yieldScore: Number(loan.yieldScore) / 100,
        owner: loan.owner,
        isLent: loan.isLent,
        borrower: loan.borrower === ethers.ZeroAddress ? null : loan.borrower,
        coordinates: { x: (i % 5) * 20 - 40, y: 0, z: Math.floor(i / 5) * 20 - 20 },
      }));
      setLandLoans(loans);
    }
  }, [landLoansRaw]);

  useEffect(() => {
    if (cryptoLoansRaw) {
      const loans: CryptoLoan[] = (cryptoLoansRaw as CryptoLoanRaw[]).map((loan) => ({
        id: loan.id.toString(),
        title: DOMPurify.sanitize(loan.title),
        description: DOMPurify.sanitize(loan.description),
        amountETH: ethers.formatEther(loan.amountETH),
        collateral: loan.collateral,
        interestRate: Number(loan.interestRate) / 100,
        termMonths: Number(loan.termMonths),
        yieldScore: Number(loan.yieldScore) / 100,
        relatedLandId: loan.relatedLandId.toString(),
        owner: loan.owner,
        isActive: loan.isActive,
      }));
      setCryptoLoans(loans);
    }
  }, [cryptoLoansRaw]);

  useEffect(() => {
    if (seedsRaw) {
      const seeds: Seed[] = (seedsRaw as SeedRaw[]).map((seed) => ({
        id: seed.id.toString(),
        name: DOMPurify.sanitize(seed.name),
        description: DOMPurify.sanitize(seed.description),
        strain: DOMPurify.sanitize(seed.strain),
        price: ethers.formatUnits(seed.price, 18),
        imageUrl: DOMPurify.sanitize(seed.imageUrl || '/assets/fallback-image.jpg'),
        owner: ethers.isAddress(seed.owner) ? seed.owner : ethers.ZeroAddress,
      }));
      setSeeds(seeds);
    }
  }, [seedsRaw]);

  // Clear WalletConnect cache on mount
  useEffect(() => {
    localStorage.removeItem('walletconnect');
  }, []);

  // Handle Lend Land
  const handleLendLand = useCallback(
    async (loanId: string) => {
      try {
        if (!address) throw new Error('Wallet not connected');
        if (chainId !== 11155111) throw new Error('Please switch to Sepolia network');
        await writeContractAsync({
          address: GREENFI_CONTRACT_ADDRESS,
          abi: GreenFiABI.abi,
          functionName: 'lendLand',
          args: [loanId],
          gas: BigInt(1000000),
        });
        setError(null);
        alert('Land lent successfully');
      } catch (err) {
        setError(`Failed to lend land: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [address, chainId, writeContractAsync]
  );

  // Handle Repay Loan
  const handleRepayLoan = useCallback(
    async (loanId: string) => {
      try {
        if (!address) throw new Error('Wallet not connected');
        if (chainId !== 11155111) throw new Error('Please switch to Sepolia network');
        await writeContractAsync({
          address: GREENFI_CONTRACT_ADDRESS,
          abi: GreenFiABI.abi,
          functionName: 'repayLoan',
          args: [loanId],
          gas: BigInt(1000000),
        });
        setError(null);
        alert('Loan repaid successfully');
      } catch (err) {
        setError(`Failed to repay loan: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [address, chainId, writeContractAsync]
  );

  // Handle Retrieve Land
  const handleRetrieveLand = useCallback(
    async (loanId: string) => {
      try {
        if (!address) throw new Error('Wallet not connected');
        if (chainId !== 11155111) throw new Error('Please switch to Sepolia network');
        await writeContractAsync({
          address: GREENFI_CONTRACT_ADDRESS,
          abi: GreenFiABI.abi,
          functionName: 'retrieveLand',
          args: [loanId],
          gas: BigInt(1000000),
        });
        setError(null);
        alert('Land retrieved successfully');
      } catch (err) {
        setError(`Failed to retrieve land: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [address, chainId, writeContractAsync]
  );

  // Handle View Seed
  const handleViewSeed = useCallback((seed: Seed) => {
    setSelectedSeed(seed);
    setModal('seed-details');
  }, []);

  // Add Button Event Listeners
  useEffect(() => {
    const buttons = [
      { id: 'list-land', modal: 'list-land' },
      { id: 'unlist-land', modal: 'unlist-land' },
      { id: 'list-crypto-loan', modal: 'list-crypto-loan' },
      { id: 'unlist-crypto-loan', modal: 'unlist-crypto-loan' },
      { id: 'list-seed', modal: 'list-seed' },
      { id: 'unlist-seed', modal: 'unlist-seed' },
      { id: 'stake-weedl', modal: 'stake-weedl' },
      { id: 'unstake-weedl', modal: 'unstake-weedl' },
    ];
    buttons.forEach(({ id, modal }) => {
      const button = document.getElementById(id);
      if (button) button.onclick = () => setModal(modal);
    });
  }, []);

  // Input Sanitization
  const sanitizeInput = (input: string): string =>
    DOMPurify.sanitize(input.trim().replace(/[<>{}]/g, ''));

  // Form Handling
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Invalid image file. Must be JPEG/PNG and under 5MB.');
        return;
      }
      setFormData({ ...formData, [e.target.id]: file });
    }
  };

  // Contract Interactions
  const handleSubmit = async (e: React.FormEvent, action: string) => {
    e.preventDefault();
    try {
      if (!address) throw new Error('Wallet not connected');
      if (chainId !== 11155111) throw new Error('Please switch to Sepolia network');
      switch (action) {
        case 'list-land':
          if (
            !formData['land-id'] ||
            !formData['land-title'] ||
            !formData['land-description'] ||
            !formData['land-size'] ||
            !formData['land-collateral'] ||
            !formData['land-collateral-type'] ||
            !formData['land-term'] ||
            !formData['land-interest']
          ) {
            throw new Error('All fields are required');
          }
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'listLand',
            args: [
              sanitizeInput(formData['land-id'] as string),
              sanitizeInput(formData['land-title'] as string),
              sanitizeInput(formData['land-description'] as string),
              Number(formData['land-size']) * 100,
              formData['land-collateral-type'] as string,
              ethers.parseUnits(formData['land-collateral'] as string, 18),
              Number(formData['land-term']),
              Number(formData['land-interest']) * 100,
            ],
            gas: BigInt(1000000),
          });
          break;
        case 'list-crypto-loan':
          if (
            !formData['crypto-loan-title'] ||
            !formData['crypto-loan-description'] ||
            !formData['crypto-loan-amount'] ||
            !formData['crypto-loan-collateral'] ||
            !formData['crypto-loan-term'] ||
            !formData['crypto-loan-interest']
          ) {
            throw new Error('All fields are required');
          }
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'listCryptoLoan',
            args: [
              sanitizeInput(formData['crypto-loan-title'] as string),
              sanitizeInput(formData['crypto-loan-description'] as string),
              ethers.parseEther(formData['crypto-loan-amount'] as string),
              formData['crypto-loan-collateral'] as string,
              Number(formData['crypto-loan-term']),
              Number(formData['crypto-loan-interest']) * 100,
            ],
            gas: BigInt(1000000),
          });
          break;
        case 'list-seed':
          if (
            !formData['seed-name'] ||
            !formData['seed-description'] ||
            !formData['seed-strain'] ||
            !formData['seed-price'] ||
            !formData['seed-image']
          ) {
            throw new Error('All fields are required');
          }
          {
            const file = formData['seed-image'] as File;
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            await new Promise((resolve) => (fileReader.onload = resolve));
            await writeContractAsync({
              address: GREENFI_CONTRACT_ADDRESS,
              abi: GreenFiABI.abi,
              functionName: 'listSeed',
              args: [
                sanitizeInput(formData['seed-name'] as string),
                sanitizeInput(formData['seed-description'] as string),
                sanitizeInput(formData['seed-strain'] as string),
                ethers.parseUnits(formData['seed-price'] as string, 18),
                fileReader.result as string,
              ],
              gas: BigInt(1000000),
            });
          }
          break;
        case 'stake-weedl':
          if (!formData['stake-amount']) throw new Error('Amount is required');
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'stakeTokens',
            args: [ethers.parseUnits(String(formData['stake-amount']), 18)],
            gas: BigInt(1000000),
          });
          break;
        case 'unstake-weedl':
          if (!formData['unstake-amount']) throw new Error('Amount is required');
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'unstakeTokens',
            args: [ethers.parseUnits(String(formData['unstake-amount']), 18)],
            gas: BigInt(1000000),
          });
          break;
        case 'unlist-land':
          if (!formData['unlist-land-select']) throw new Error('Land selection is required');
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'unlistLand',
            args: [formData['unlist-land-select'] as string],
            gas: BigInt(1000000),
          });
          break;
        case 'unlist-crypto-loan':
          if (!formData['unlist-crypto-loan-select']) throw new Error('Loan selection is required');
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'unlistCryptoLoan',
            args: [formData['unlist-crypto-loan-select'] as string],
            gas: BigInt(1000000),
          });
          break;
        case 'unlist-seed':
          if (!formData['unlist-seed-select']) throw new Error('Seed selection is required');
          await writeContractAsync({
            address: GREENFI_CONTRACT_ADDRESS,
            abi: GreenFiABI.abi,
            functionName: 'unlistSeed',
            args: [formData['unlist-seed-select'] as string],
            gas: BigInt(1000000),
          });
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      setError(null);
      alert(`${action.replace(/-/g, ' ')} successful`);
      setModal(null);
      setFormData({});
    } catch (err) {
      setError(`Failed to ${action.replace(/-/g, ' ')}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleBuySeed = async (seedId: string) => {
    try {
      if (!address) throw new Error('Wallet not connected');
      if (chainId !== 11155111) throw new Error('Please switch to Sepolia network');
      const seed = seeds.find((s) => s.id === seedId);
      if (!seed) throw new Error('Seed not found');
      await writeContractAsync({
        address: GREENFI_CONTRACT_ADDRESS,
        abi: GreenFiABI.abi,
        functionName: 'buySeed',
        args: [seedId],
        value: ethers.parseUnits(seed.price, 18),
        gas: BigInt(1000000),
      });
      setError(null);
      alert('Seed purchased successfully');
    } catch (err) {
      setError(`Failed to buy seed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Render Modal
  const renderModal = () => {
    if (!modal) return null;
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    let content: React.JSX.Element | null = null;
    switch (modal) {
      case 'list-land':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="list-land-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'list-land')}>
              <h3 id="list-land-title">List New Land</h3>
              <label htmlFor="land-id">Land ID</label>
              <input id="land-id" onChange={handleChange} required pattern="[A-Za-z0-9]{1,50}" maxLength={50} />
              <label htmlFor="land-title">Title</label>
              <input id="land-title" onChange={handleChange} required maxLength={100} />
 L             <label htmlFor="land-description">Description</label>
              <textarea id="land-description" onChange={handleChange} required maxLength={500} />
              <label htmlFor="land-size">Size (acres)</label>
              <input id="land-size" type="number" onChange={handleChange} required min="0.01" max="1000" step="0.01" />
              <label htmlFor="land-collateral">Collateral Amount</label>
              <input id="land-collateral" type="number" onChange={handleChange} required min="0.01" max="100" step="0.01" />
              <label htmlFor="land-collateral-type">Collateral Type</label>
              <select id="land-collateral-type" onChange={handleChange} required>
                <option value="ETH">ETH</option>
                <option value="WEEDL">WEEDL</option>
              </select>
              <label htmlFor="land-term">Term (months)</label>
              <input id="land-term" type="number" onChange={handleChange} required min="1" max="120" step="1" />
              <label htmlFor="land-interest">Interest Rate (%)</label>
              <input id="land-interest" type="number" onChange={handleChange} required min="0.01" max="100" step="0.01" />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'list-crypto-loan':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="list-crypto-loan-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'list-crypto-loan')}>
              <h3 id="list-crypto-loan-title">List Crypto Loan</h3>
              <label htmlFor="crypto-loan-title">Title</label>
              <input id="crypto-loan-title" onChange={handleChange} required maxLength={100} />
              <label htmlFor="crypto-loan-description">Description</label>
              <textarea id="crypto-loan-description" onChange={handleChange} required maxLength={500} />
              <label htmlFor="crypto-loan-amount">Amount (ETH or WEEDL)</label>
              <input id="crypto-loan-amount" type="number" onChange={handleChange} required min="0.01" max="1000" step="0.01" />
              <label htmlFor="crypto-loan-collateral">Collateral</label>
              <select id="crypto-loan-collateral" onChange={handleChange} required>
                <option value="ETH">ETH</option>
                <option value="WEEDL">WEEDL</option>
              </select>
              <label htmlFor="crypto-loan-term">Term (months)</label>
              <input id="crypto-loan-term" type="number" onChange={handleChange} required min="1" max="120" step="1" />
              <label htmlFor="crypto-loan-interest">Interest Rate (%)</label>
              <input id="crypto-loan-interest" type="number" onChange={handleChange} required min="0.01" max="100" step="0.01" />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'list-seed':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="list-seed-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'list-seed')}>
              <h3 id="list-seed-title">List New Seed</h3>
              <label htmlFor="seed-name">Seed Name</label>
              <input id="seed-name" onChange={handleChange} required maxLength={100} />
              <label htmlFor="seed-description">Description</label>
              <textarea id="seed-description" onChange={handleChange} required maxLength={500} />
              <label htmlFor="seed-strain">Strain</label>
              <input id="seed-strain" onChange={handleChange} required maxLength={100} />
              <label htmlFor="seed-price">Price (ETH)</label>
              <input id="seed-price" type="number" onChange={handleChange} required min="0.001" max="100" step="0.001" />
              <label htmlFor="seed-image">Seed Image (JPEG/PNG, max 5MB)</label>
              <input id="seed-image" type="file" accept="image/jpeg,image/png" onChange={handleFileChange} required />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'stake-weedl':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="stake-weedl-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'stake-weedl')}>
              <h3 id="stake-weedl-title">Stake Tokens</h3>
              <label htmlFor="stake-amount">Amount (WEEDL)</label>
              <input id="stake-amount" type="number" onChange={handleChange} required min="0.01" max="1000" step="0.01" />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'unstake-weedl':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="unstake-weedl-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'unstake-weedl')}>
              <h3 id="unstake-weedl-title">Unstake Tokens</h3>
              <label htmlFor="unstake-amount">Amount (WEEDL)</label>
              <input id="unstake-amount" type="number" onChange={handleChange} required min="0.01" max="1000" step="0.01" />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'unlist-land':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="unlist-land-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'unlist-land')}>
              <h3 id="unlist-land-title">Unlist Land</h3>
              <label htmlFor="unlist-land-select">Select Land</label>
              <select id="unlist-land-select" onChange={handleChange} required>
                <option value="">Select Land</option>
                {landLoans
                  .filter((loan) => loan.owner.toLowerCase() === address?.toLowerCase())
                  .map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.title}
                    </option>
                  ))}
              </select>
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'unlist-crypto-loan':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="unlist-crypto-loan-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'unlist-crypto-loan')}>
              <h3 id="unlist-crypto-loan-title">Unlist Crypto Loan</h3>
              <label htmlFor="unlist-crypto-loan-select">Select Loan</label>
              <select id="unlist-crypto-loan-select" onChange={handleChange} required>
                <option value="">Select Loan</option>
                {cryptoLoans
                  .filter((loan) => loan.owner.toLowerCase() === address?.toLowerCase())
                  .map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.title}
                    </option>
                  ))}
              </select>
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'unlist-seed':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="unlist-seed-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <form onSubmit={(e) => handleSubmit(e, 'unlist-seed')}>
              <h3 id="unlist-seed-title">Unlist Seed</h3>
              <label htmlFor="unlist-seed-select">Select Seed</label>
              <select id="unlist-seed-select" onChange={handleChange} required>
                <option value="">Select Seed</option>
                {seeds
                  .filter((seed) => seed.owner.toLowerCase() === address?.toLowerCase())
                  .map((seed) => (
                    <option key={seed.id} value={seed.id}>
                      {seed.name}
                    </option>
                  ))}
              </select>
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={!address || chainId !== 11155111}>Submit</button>
            </form>
          </div>
        );
        break;
      case 'loan-details':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="loan-details-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <h3 id="loan-details-title">{selectedLoan?.title}</h3>
            <p>{selectedLoan?.description}</p>
            <p>Size: {selectedLoan?.size.toFixed(2)} acres</p>
            <p>Collateral: {Number(selectedLoan?.collateralAmount).toFixed(4)} {selectedLoan?.collateralType}</p>
            <p>Term: {selectedLoan?.termMonths} months</p>
            <p>Interest Rate: {selectedLoan ? (selectedLoan.interestRate * 100).toFixed(2) : 'N/A'}%</p>
            <p>Yield Score: {selectedLoan?.yieldScore.toFixed(2)}</p>
            <p>Status: {selectedLoan?.isLent ? 'Lent' : 'Available'}</p>
            <p>Owner: {selectedLoan?.owner}</p>
            <p>Borrower: {selectedLoan?.borrower || 'None'}</p>
          </div>
        );
        break;
      case 'seed-details':
        content = (
          <div className="modal-content" role="dialog" aria-labelledby="seed-details-title">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close modal">×</button>
            <h3 id="seed-details-title">{selectedSeed?.name}</h3>
            <img src={selectedSeed?.imageUrl || '/assets/fallback-image.jpg'} alt={selectedSeed?.name} />
            <p>{selectedSeed?.description}</p>
            <p>Strain: {selectedSeed?.strain}</p>
            <p>Price: {Number(selectedSeed?.price).toFixed(4)} ETH</p>
            <button onClick={() => handleBuySeed(selectedSeed!.id)} disabled={!address || chainId !== 11155111}>
              Buy Seed
            </button>
          </div>
        );
        break;
      default:
        return null;
    }

    return createPortal(
      <div className={`modal ${modal ? 'visible' : ''}`}>{content}</div>,
      modalRoot
    );
  };

  // Render Metaverse
  const renderMetaverse = () => {
    const metaverseRoot = document.getElementById('metaverse-canvas');
    if (!metaverseRoot) return null;

    return createPortal(
      <Suspense fallback={<div role="status">Loading Metaverse...</div>}>
        <Metaverse
          loans={landLoans}
          onSelectLoan={(loan) => {
            setSelectedLoan(loan);
            setModal('loan-details');
          }}
        />
      </Suspense>,
      metaverseRoot
    );
  };

  return (
    <ErrorBoundary>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        {renderMetaverse()}
        {renderModal()}
        <section id="growers" className="section">
          <div className="container">
            <h2>Our Growers</h2>
            <div className="grid">
              {landLoans.length > 0 ? (
                landLoans.map((loan) => (
                  <GrowerCard
                    key={loan.id}
                    loan={loan}
                    address={address}
                    onLend={handleLendLand}
                    onRepay={handleRepayLoan}
                    onRetrieve={handleRetrieveLand}
                  />
                ))
              ) : (
                <p>No land loans available.</p>
              )}
            </div>
            <div className="action-buttons">
              <button id="list-land" className="action-button">List Your Land</button>
              <button id="unlist-land" className="action-button">Unlist Land</button>
            </div>
          </div>
        </section>
        <section id="lenders" className="section section-alt">
          <div className="container">
            <h2>Our Lenders</h2>
            <div className="grid">
              {cryptoLoans.length > 0 ? (
                cryptoLoans.map((loan) => (
                  <LenderCard key={loan.id} loan={loan} />
                ))
              ) : (
                <p>No crypto loans available.</p>
              )}
            </div>
            <div className="action-buttons">
              <button id="list-crypto-loan" className="action-button">List Crypto Loan</button>
              <button id="unlist-crypto-loan" className="action-button">Unlist Crypto Loan</button>
            </div>
          </div>
        </section>
        <section id="seeds" className="section">
          <div className="container">
            <h2>Buy Seeds</h2>
            <div className="grid">
              {seeds.length > 0 ? (
                seeds.map((seed) => (
                  <SeedCard key={seed.id} seed={seed} onView={handleViewSeed} />
                ))
              ) : (
                <p>No seeds available.</p>
              )}
            </div>
            <div className="action-buttons">
              <button id="list-seed" className="action-button">List Seed</button>
              <button id="unlist-seed" className="action-button">Unlist Seed</button>
            </div>
          </div>
        </section>
        <section id="metaverse" className="section section-alt">
          <div className="container">
            <h2>Virtual Land Showcase</h2>
            <div id="metaverse-canvas" className="metaverse" aria-label="3D Metaverse View"></div>
          </div>
        </section>
        <section id="stake" className="section">
          <div className="container">
            <h2>Stake Tokens</h2>
            <div className="action-buttons">
              <button id="stake-weedl" className="action-button">Stake Tokens</button>
              <button id="unstake-weedl" className="action-button">Unstake Tokens</button>
            </div>
          </div>
        </section>
      </main>
      <ErrorMessage error={error} onClose={() => setError(null)} />
    </ErrorBoundary>
  );
};

export default App;
