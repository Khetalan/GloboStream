import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiRefreshCw, FiArrowDownCircle, FiShoppingBag, FiClock } from 'react-icons/fi';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import './WalletPage.css';

const WalletPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Balance
  const [coins, setCoins] = useState(0);
  const [globos, setGlobos] = useState(0);

  // Packs
  const [packs, setPacks] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(true);

  // Conversion
  const [convertAmount, setConvertAmount] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [globoRate, setGloboRate] = useState(1);

  // Retrait
  const [withdrawGlobos, setWithdrawGlobos] = useState('');
  const [withdrawEmail, setWithdrawEmail] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [minWithdrawal, setMinWithdrawal] = useState(1000);

  // Historique
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState('buy');

  const fetchWallet = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/wallet/me');
      setCoins(data.balance.coins);
      setGlobos(data.balance.globos);
    } catch {
      // silencieux
    }
  }, []);

  const fetchPacks = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/payments/packs');
      setPacks(data.packs || []);
    } catch {
      toast.error(t('wallet.errorPacks'));
    } finally {
      setLoadingPacks(false);
    }
  }, [t]);

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get('/api/wallet/history', { params: { page, limit: 10 } });
      setHistory(data.transactions || []);
      setHistoryTotal(data.total || 0);
      setHistoryPage(page);
    } catch {
      // silencieux
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchPacks();
    // Lire rate depuis le premier pack ou env
    axios.get('/api/wallet/me').catch(() => {});
  }, [fetchWallet, fetchPacks]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory(1);
  }, [activeTab, fetchHistory]);

  // Gestion retour depuis Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');
    if (success === '1') {
      toast.success(t('wallet.purchaseSuccess'));
      fetchWallet();
    } else if (cancelled === '1') {
      toast.error(t('wallet.purchaseCancelled'));
    }
  }, [searchParams, fetchWallet, t]);

  const handleBuyPack = async (packId) => {
    try {
      const { data } = await axios.post('/api/payments/checkout', { packId });
      window.location.href = data.url;
    } catch {
      toast.error(t('wallet.errorCheckout'));
    }
  };

  const handleConvert = async () => {
    const amount = parseInt(convertAmount, 10);
    if (!amount || amount < 10) {
      toast.error(t('wallet.minConvert', { min: 10 }));
      return;
    }
    setConvertLoading(true);
    try {
      const { data } = await axios.post('/api/wallet/convert', { globos: amount });
      setCoins(data.newBalance.coins);
      setGlobos(data.newBalance.globos);
      setConvertAmount('');
      toast.success(t('wallet.convertSuccess'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('wallet.errorConvert'));
    } finally {
      setConvertLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawGlobos, 10);
    if (!amount || amount < minWithdrawal) {
      toast.error(t('wallet.minWithdrawal', { min: minWithdrawal }));
      return;
    }
    if (!withdrawEmail || !withdrawEmail.includes('@')) {
      toast.error(t('wallet.invalidEmail'));
      return;
    }
    setWithdrawLoading(true);
    try {
      const { data } = await axios.post('/api/wallet/withdraw', {
        globos: amount,
        paypalEmail: withdrawEmail
      });
      setGlobos(data.newBalance.globos);
      setWithdrawGlobos('');
      setWithdrawEmail('');
      toast.success(t('wallet.withdrawSuccess'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('wallet.errorWithdraw'));
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const txTypeLabel = (type) => {
    const map = {
      gift_send: `${t('wallet.txGiftSend')}`,
      gift_receive: `${t('wallet.txGiftReceive')}`,
      coin_purchase: `${t('wallet.txPurchase')}`,
      globo_to_coin: `${t('wallet.txConvert')}`,
      withdrawal_request: `${t('wallet.txWithdrawal')}`,
      withdrawal_paid: `${t('wallet.txWithdrawalPaid')}`,
    };
    return map[type] || type;
  };

  const totalPages = Math.ceil(historyTotal / 10);

  return (
    <div className="wallet-page">
      <Navigation />
      <div className="wallet-container">

        {/* Header */}
        <div className="wallet-header">
          <button className="wallet-back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> {t('common.back')}
          </button>
          <h1 className="wallet-title">💰 {t('wallet.title')}</h1>
        </div>

        {/* Balance */}
        <div className="wallet-balance-row">
          <div className="wallet-balance-card coins">
            <span className="wallet-balance-icon">🪙</span>
            <span className="wallet-balance-amount">{coins.toLocaleString()}</span>
            <span className="wallet-balance-label">{t('wallet.coins')}</span>
          </div>
          <div className="wallet-balance-card globos">
            <span className="wallet-balance-icon">🌐</span>
            <span className="wallet-balance-amount">{globos.toLocaleString()}</span>
            <span className="wallet-balance-label">{t('wallet.globos')}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="wallet-tabs">
          {[
            { id: 'buy', icon: <FiShoppingBag />, label: t('wallet.buyCoins') },
            { id: 'convert', icon: <FiRefreshCw />, label: t('wallet.convert') },
            { id: 'withdraw', icon: <FiArrowDownCircle />, label: t('wallet.withdraw') },
            { id: 'history', icon: <FiClock />, label: t('wallet.history') },
          ].map(tab => (
            <button
              key={tab.id}
              className={`wallet-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Acheter des pièces */}
        {activeTab === 'buy' && (
          <div className="wallet-section">
            {loadingPacks ? (
              <div className="wallet-loading">{t('common.loading')}</div>
            ) : (
              <div className="wallet-packs-grid">
                {packs.map(pack => (
                  <div key={pack.id} className={`wallet-pack-card${pack.id === 'popular' ? ' featured' : ''}`}>
                    {pack.id === 'popular' && (
                      <span className="wallet-pack-badge">{t('wallet.popular')}</span>
                    )}
                    <div className="wallet-pack-name">{pack.name}</div>
                    <div className="wallet-pack-coins">
                      🪙 {pack.coins.toLocaleString()}
                      {pack.bonus > 0 && (
                        <span className="wallet-pack-bonus">+{pack.bonus} {t('payments.bonus')}</span>
                      )}
                    </div>
                    <button
                      className="wallet-pack-btn"
                      onClick={() => handleBuyPack(pack.id)}
                    >
                      {t('payments.buyPack')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Convertir Globos → Pièces */}
        {activeTab === 'convert' && (
          <div className="wallet-section">
            <div className="wallet-convert-card">
              <p className="wallet-convert-rate">
                {t('wallet.rate', { rate: globoRate })}
              </p>
              <label className="wallet-label">{t('wallet.globosToConvert')}</label>
              <input
                type="number"
                min="10"
                value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                className="wallet-input"
                placeholder="10"
              />
              {convertAmount >= 10 && (
                <p className="wallet-convert-preview">
                  → 🪙 {(parseInt(convertAmount, 10) * globoRate).toLocaleString()} {t('wallet.coins')}
                </p>
              )}
              <button
                className="wallet-action-btn"
                onClick={handleConvert}
                disabled={convertLoading}
              >
                {convertLoading ? t('common.loading') : t('wallet.convert')}
              </button>
              <p className="wallet-hint">{t('wallet.minConvert', { min: 10 })}</p>
            </div>
          </div>
        )}

        {/* Tab: Retrait Globos → Argent */}
        {activeTab === 'withdraw' && (
          <div className="wallet-section">
            <div className="wallet-convert-card">
              <p className="wallet-convert-rate">
                {t('wallet.minWithdrawal', { min: minWithdrawal })}
              </p>
              <label className="wallet-label">{t('wallet.globosToWithdraw')}</label>
              <input
                type="number"
                min={minWithdrawal}
                value={withdrawGlobos}
                onChange={e => setWithdrawGlobos(e.target.value)}
                className="wallet-input"
                placeholder={minWithdrawal.toString()}
              />
              <label className="wallet-label">{t('wallet.paypalEmail')}</label>
              <input
                type="email"
                value={withdrawEmail}
                onChange={e => setWithdrawEmail(e.target.value)}
                className="wallet-input"
                placeholder="paypal@example.com"
              />
              <button
                className="wallet-action-btn"
                onClick={handleWithdraw}
                disabled={withdrawLoading}
              >
                {withdrawLoading ? t('common.loading') : t('wallet.withdraw')}
              </button>
            </div>
          </div>
        )}

        {/* Tab: Historique */}
        {activeTab === 'history' && (
          <div className="wallet-section">
            {historyLoading ? (
              <div className="wallet-loading">{t('common.loading')}</div>
            ) : history.length === 0 ? (
              <div className="wallet-empty">{t('wallet.noHistory')}</div>
            ) : (
              <>
                <div className="wallet-history-list">
                  {history.map(tx => (
                    <div key={tx._id} className={`wallet-tx-item wallet-tx-${tx.type}`}>
                      <div className="wallet-tx-left">
                        <span className="wallet-tx-type">{txTypeLabel(tx.type)}</span>
                        <span className="wallet-tx-date">{formatDate(tx.createdAt)}</span>
                      </div>
                      <div className="wallet-tx-right">
                        {tx.coinsAmount !== 0 && (
                          <span className={`wallet-tx-amount ${tx.coinsAmount > 0 ? 'positive' : 'negative'}`}>
                            {tx.coinsAmount > 0 ? '+' : ''}{tx.coinsAmount} 🪙
                          </span>
                        )}
                        {tx.globosAmount !== 0 && (
                          <span className={`wallet-tx-amount ${tx.globosAmount > 0 ? 'positive' : 'negative'}`}>
                            {tx.globosAmount > 0 ? '+' : ''}{tx.globosAmount} 🌐
                          </span>
                        )}
                        <span className={`wallet-tx-status wallet-tx-status--${tx.status}`}>{tx.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="wallet-pagination">
                    <button
                      className="wallet-page-btn"
                      onClick={() => fetchHistory(historyPage - 1)}
                      disabled={historyPage <= 1}
                    >
                      ←
                    </button>
                    <span>{historyPage} / {totalPages}</span>
                    <button
                      className="wallet-page-btn"
                      onClick={() => fetchHistory(historyPage + 1)}
                      disabled={historyPage >= totalPages}
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WalletPage;
