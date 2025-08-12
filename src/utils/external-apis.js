const axios = require('axios');

class ExternalAPIs {
  constructor() {
    this.coingeckoBaseUrl = process.env.COINGECKO_API_URL;
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY;
    this.openExchangeBaseUrl = process.env.OPENEXCHANGERATES_API_URL;
    this.openExchangeAppId = process.env.OPENEXCHANGERATES_APP_ID;
  }

  // Get crypto rates from CoinGecko
  async getCryptoRates(fromCurrency, toCurrency) {
    try {
      const response = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
        params: {
          ids: this.mapCurrencyToCoinGeckoId(fromCurrency),
          vs_currencies: toCurrency.toLowerCase()
        },
        headers: {
          'X-CG-API-KEY': this.coingeckoApiKey
        },
        timeout: 10000
      });

      const coinId = this.mapCurrencyToCoinGeckoId(fromCurrency);
      return response.data[coinId]?.[toCurrency.toLowerCase()] || null;
    } catch (error) {
      console.error('CoinGecko API error:', error.message);
      return null;
    }
  }

  // Get FIAT rates from OpenExchangeRates
  async getFiatRates(fromCurrency, toCurrency) {
    try {
      const response = await axios.get(`${this.openExchangeBaseUrl}/latest.json`, {
        params: {
          app_id: this.openExchangeAppId,
          base: fromCurrency
        },
        timeout: 10000
      });

      return response.data.rates?.[toCurrency] || null;
    } catch (error) {
      console.error('OpenExchangeRates API error:', error.message);
      return null;
    }
  }

  // Get all available rates from CoinGecko
  async getAllCryptoRates() {
    try {
      const response = await axios.get(`${this.coingeckoBaseUrl}/simple/supported_vs_currencies`, {
        headers: {
          'X-CG-API-KEY': this.coingeckoApiKey
        },
        timeout: 10000
      });

      const supportedCurrencies = response.data;
      const rates = {};

      // Get rates for major cryptocurrencies
      const cryptoIds = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'cardano'];
      
      for (const cryptoId of cryptoIds) {
        const cryptoResponse = await axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
          params: {
            ids: cryptoId,
            vs_currencies: supportedCurrencies.join(',')
          },
          headers: {
            'X-CG-API-KEY': this.coingeckoApiKey
          },
          timeout: 10000
        });

        const cryptoRates = cryptoResponse.data[cryptoId];
        if (cryptoRates) {
          const cryptoCode = this.mapCoinGeckoIdToCurrency(cryptoId);
          for (const [currency, rate] of Object.entries(cryptoRates)) {
            rates[`${cryptoCode}_${currency.toUpperCase()}`] = rate;
          }
        }
      }

      return rates;
    } catch (error) {
      console.error('Error fetching all crypto rates:', error.message);
      return {};
    }
  }

  // Get all available rates from OpenExchangeRates
  async getAllFiatRates() {
    try {
      const response = await axios.get(`${this.openExchangeBaseUrl}/latest.json`, {
        params: {
          app_id: this.openExchangeAppId,
          base: 'USD'
        },
        timeout: 10000
      });

      const rates = {};
      const baseCurrency = 'USD';
      
      for (const [currency, rate] of Object.entries(response.data.rates)) {
        rates[`${baseCurrency}_${currency.toUpperCase()}`] = rate;
      }

      return rates;
    } catch (error) {
      console.error('Error fetching all FIAT rates:', error.message);
      return {};
    }
  }

  // Map currency codes to CoinGecko IDs
  mapCurrencyToCoinGeckoId(currency) {
    const mapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'DOGE': 'dogecoin',
      'AVAX': 'avalanche-2'
    };
    return mapping[currency] || currency.toLowerCase();
  }

  // Map CoinGecko IDs to currency codes
  mapCoinGeckoIdToCurrency(coinId) {
    const mapping = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'tether': 'USDT',
      'binancecoin': 'BNB',
      'cardano': 'ADA',
      'ripple': 'XRP',
      'solana': 'SOL',
      'polkadot': 'DOT',
      'dogecoin': 'DOGE',
      'avalanche-2': 'AVAX'
    };
    return mapping[coinId] || coinId.toUpperCase();
  }

  // Determine if a currency is crypto or FIAT
  isCryptoCurrency(currency) {
    const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'XRP', 'SOL', 'DOT', 'DOGE', 'AVAX'];
    return cryptoCurrencies.includes(currency.toUpperCase());
  }

  // Get rate from appropriate API based on currency type
  async getRate(fromCurrency, toCurrency) {
    const fromIsCrypto = this.isCryptoCurrency(fromCurrency);
    const toIsCrypto = this.isCryptoCurrency(toCurrency);

    // If both are crypto or both are FIAT, use appropriate API
    if (fromIsCrypto && toIsCrypto) {
      return await this.getCryptoRates(fromCurrency, toCurrency);
    } else if (!fromIsCrypto && !toIsCrypto) {
      return await this.getFiatRates(fromCurrency, toCurrency);
    } else {
      // Mixed conversion - try to get USD rate as bridge
      if (fromIsCrypto) {
        const usdRate = await this.getCryptoRates(fromCurrency, 'USD');
        const targetRate = await this.getFiatRates('USD', toCurrency);
        return usdRate && targetRate ? usdRate * targetRate : null;
      } else {
        const usdRate = await this.getFiatRates(fromCurrency, 'USD');
        const targetRate = await this.getCryptoRates('USD', toCurrency);
        return usdRate && targetRate ? usdRate * targetRate : null;
      }
    }
  }
}

module.exports = new ExternalAPIs(); 