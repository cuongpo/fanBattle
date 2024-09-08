import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import FanClubFactoryABI from './FanClubFactory.json';  // The ABI of your smart contract
import './App.css';

const FAN_CLUB_FACTORY_ADDRESS = '0xac81B46fbc0d50C84982AbBfFc0a3e97e8409a70';  // Replace with your deployed contract address

function App() {
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [fanClubs, setFanClubs] = useState([]);
  const [buyingShares, setBuyingShares] = useState({});
  const [sellingShares, setSellingShares] = useState({});

  useEffect(() => {
    if (window.ethereum && account) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      const fanClubFactory = new web3Instance.eth.Contract(FanClubFactoryABI, FAN_CLUB_FACTORY_ADDRESS);
      setContract(fanClubFactory);
      loadFanClubs(fanClubFactory);
    }
  }, [account]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask to use this app.');
    }
  };

  const loadFanClubs = async (fanClubFactory) => {
    try {
      const fanClubCount = await fanClubFactory.methods.getFanClubCount().call();
      const clubs = [];

      for (let i = 0; i < fanClubCount; i++) {
        const fanClub = await fanClubFactory.methods.getFanClub(i).call();
        clubs.push({
          index: i,
          name: fanClub.name, // fanClub[0]
          description: fanClub.description, // fanClub[1]
          fanType: fanClub.fanType, // fanClub[2]
          tokenAddress: fanClub.tokenAddress, // fanClub[3]
          image: fanClub.image, // fanClub[4]
          totalShares: fanClub.totalShares.toString(), // fanClub[5]
          sharePrice: fanClub.sharePrice.toString(), // fanClub[6]
          creator: fanClub.creator // fanClub[7]
        });

        
      }

      setFanClubs(clubs);
    } catch (error) {
      console.error('Error loading fan clubs:', error);
    }
  };

  const createFanClub = async (name, description, fanType, image) => {
    try {
      await contract.methods.createFanClub(name, description, 0, image)
        .send({ from: account });
      alert('Fan club created successfully!');
      loadFanClubs(contract); // Reload clubs to get updated data
    } catch (error) {
      console.error('Error creating fan club:', error);
      alert('Failed to create fan club.');
    }
  };

  const buyShares = async (fanClubIndex, numShares) => {
    try {
      const sharePrice = fanClubs[fanClubIndex].sharePrice;
      const totalCost = sharePrice * numShares;

      await contract.methods.buyShares(fanClubIndex, numShares)
        .send({ from: account, value: totalCost });
      alert(`Successfully bought ${numShares} shares!`);
      loadFanClubs(contract); // Reload clubs to get updated data
    } catch (error) {
      console.error('Error buying shares:', error);
      alert('Failed to buy shares.');
    }
  };

  const sellShares = async (fanClubIndex, numShares) => {
    try {
      await contract.methods.sellShares(fanClubIndex, numShares)
        .send({ from: account });
      alert(`Successfully sold ${numShares} shares!`);
      loadFanClubs(contract); // Reload clubs to get updated data
    } catch (error) {
      console.error('Error selling shares:', error);
      alert('Failed to sell shares.');
    }
  };

  const handleBuyChange = (fanClubIndex, value) => {
    setBuyingShares({ ...buyingShares, [fanClubIndex]: value });
  };

  const handleSellChange = (fanClubIndex, value) => {
    setSellingShares({ ...sellingShares, [fanClubIndex]: value });
  };

  return (
    <div className="App">
      <header>
        <h1>Fan Club Factory</h1>
        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <p>Connected: {account}</p>
        )}
      </header>

      {account && (
        <>
          <h2>Create Fan Club</h2>
          <FanClubForm createFanClub={createFanClub} />

          <h2>All Fan Clubs</h2>
          <div className="fan-club-list">
            {fanClubs.length === 0 ? (
              <p>No fan clubs available yet.</p>
            ) : (
              fanClubs.map((club, index) => (
                <div key={index} className="fan-club-card">
                  <h3>{club.name}</h3>
                  <p>{club.description}</p>
                  <img src={`https://ipfs.io/ipfs/${club.image}`} alt={club.name} />
                  <p>Total Shares: {club.totalShares}</p>
                  <p>Share Price: {club.sharePrice} testCITY</p>
                  <p>Creator: {club.creator}</p>

                  {/* Buy Shares Section */}
                  <div className="buy-shares">
                    <input
                      type="number"
                      min="1"
                      placeholder="No. of Shares"
                      value={buyingShares[index] || ''}
                      onChange={(e) => handleBuyChange(index, e.target.value)}
                    />
                    <button onClick={() => buyShares(index, buyingShares[index])}>
                      Buy Shares
                    </button>
                  </div>

                  {/* Sell Shares Section */}
                  <div className="sell-shares">
                    <input
                      type="number"
                      min="1"
                      placeholder="No. of Shares"
                      value={sellingShares[index] || ''}
                      onChange={(e) => handleSellChange(index, e.target.value)}
                    />
                    <button onClick={() => sellShares(index, sellingShares[index])}>
                      Sell Shares
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const FanClubForm = ({ createFanClub }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fanType, setFanType] = useState('CITY');
  const [image, setImage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    createFanClub(name, description, fanType, image);
  };

  return (
    <form onSubmit={handleSubmit} className="fan-club-form">
      <input type="text" placeholder="Club Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <select value={fanType} onChange={(e) => setFanType(e.target.value)}>
        <option value="CITY">Manchester City</option>
        <option value="PSG">PSG</option>
        <option value="ARS">ARS</option>
      </select>
      <input type="text" placeholder="IPFS Image Hash" value={image} onChange={(e) => setImage(e.target.value)} required />
      <button type="submit">Create Fan Club</button>
    </form>
  );
};

export default App;
