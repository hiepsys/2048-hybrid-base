const CONTRACT_ADDRESS = "<PASTE_DEPLOYED_CONTRACT_ADDRESS>";
const ABI = [
  "function submitScore(uint256 score, bytes32 stateHash, bytes signature)",
  "function getLeaderboard() view returns (tuple(address player, uint256 score, uint256 timestamp)[])",
];

let provider, signer, contract;
let currentScore = 0;
let gameState = null;

async function init() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  } else {
    alert('Please install MetaMask');
  }

  buildBoard();
  document.getElementById('submitBtn').addEventListener('click', submitScoreToChain);
  fetchLeaderboard();
}

function buildBoard() {
  const container = document.getElementById('game-container');
  container.innerHTML = '<p>Simple 2048 placeholder — press arrow keys</p>';
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      currentScore += Math.floor(Math.random()*10 + 1);
      gameState = {moves: (gameState?.moves||0)+1, seed: Math.floor(Math.random()*1e9)};
      document.getElementById('score').innerText = 'Score: '+currentScore;
    }
  });
}

async function submitScoreToChain() {
  if (!contract) return alert('Wallet not connected');
  const score = currentScore;
  if (score === 0) return alert('Score is 0');

  const stateStr = JSON.stringify(gameState || {});
  const stateHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stateStr));

  const msgHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(["string","bytes32","uint256"],["2048|", stateHash, score])
  );
  const msgHashBytes = ethers.utils.arrayify(msgHash);

  const signature = await signer.signMessage(msgHashBytes);

  try {
    const tx = await contract.submitScore(score, stateHash, signature, { gasLimit: 300000 });
    await tx.wait();
    alert('Score submitted!');
    fetchLeaderboard();
  } catch (err) {
    alert('Submit failed: ' + (err?.message||err));
  }
}

async function fetchLeaderboard() {
  if (!contract) return;
  try {
    const lb = await contract.getLeaderboard();
    const listEl = document.getElementById('lb-list');
    listEl.innerHTML = '';
    lb.forEach(entry => {
      const li = document.createElement('li');
      li.innerText = `${entry.player} — ${entry.score}`;
      listEl.appendChild(li);
    });
  } catch {}
}

window.addEventListener('load', init);
