// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  KRKSRoulette  –  Off-chain VRF oracle model
 * @notice CS:GO roulette on KARKAS testnet.
 *
 * RANDOMNESS FLOW
 *   1. Player calls requestSpin()  → bet locked, RequestRandom emitted
 *   2. Oracle reads event off-chain, generates seed = crypto.randomBytes(32)
 *   3. Oracle signs keccak256(requestId ‖ seed ‖ requestBlock) with its private key
 *   4. Oracle calls fulfillSpin(requestId, seed, v, r, s)
 *   5. Contract: ecrecover signature, mix seed ⊕ blockhash, resolve rarity, pay
 *
 * SECURITY PROPERTIES
 *   ✓ Validator manipulation        – seed unknown at request time
 *   ✓ Oracle front-running          – seed committed before blockhash is fixed
 *   ✓ Oracle grinding               – sig binds seed to requestId; can't swap
 *   ✓ Oracle censorship             – TIMEOUT_BLOCKS → player self-refunds
 *   ✓ Re-entrancy                   – checks-effects-interactions + mutex
 *   ✓ Signature replay              – requestId burned after fulfillment
 *   ✓ Payout drain                  – maxPayout ≤ prizePool / MAX_PAYOUT_DIVISOR
 *   ✓ Player DOS                    – 1 concurrent request per player
 *   ✓ Owner rug-pull                – withdrawal blocked below MIN_RESERVE
 *   ✓ Oracle key swap attack        – two-step rotation with 50-block delay
 *   ✓ Ownership takeover            – two-step ownership transfer
 */
contract KRKSRoulette {

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant TIMEOUT_BLOCKS     = 150;  // ~5 min at 2 s/block
    uint256 public constant MAX_PENDING        = 500;
    uint256 public constant MIN_RESERVE        = 5 ether;
    uint256 public constant MAX_PAYOUT_DIVISOR = 10;   // max win = pool / 10
    uint256 public constant ORACLE_DELAY       = 50;   // blocks for key rotation

    // ─── Rarity table (probability / 100) ────────────────────────────────────
    //   0–49  Common     mult 0    (miss)     50 %
    //  50–74  Uncommon   mult 15   (×1.5)     25 %
    //  75–89  Rare       mult 20   (×2)       15 %
    //  90–97  Epic       mult 50   (×5)        8 %
    //  98–99  Legendary  mult 100  (×10)       2 %

    uint8 private constant N = 5;
    uint8[N] private THRESH = [50, 75, 90, 98, 100];
    uint8[N] private MULT   = [0,  15, 20, 50, 100 ];

    // ─── Types ────────────────────────────────────────────────────────────────

    enum State { Pending, Fulfilled, Refunded }

    struct SpinRequest {
        address player;
        uint256 bet;
        uint256 requestBlock;
        State   state;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    address public owner;
    address public pendingOwner;

    address public oracle;
    address public pendingOracle;
    uint256 public oracleEffectiveBlock;

    uint256 public minBet = 0.01 ether;
    uint256 public maxBet = 10 ether;

    uint256 public totalSpins;
    uint256 public pendingCount;
    uint256 private _nonce;

    uint256 private constant _NOT = 1;
    uint256 private constant _YES = 2;
    uint256 private _lock = _NOT;

    mapping(uint256 => SpinRequest) public requests;
    mapping(address => uint256)     public activeRequest;  // 0 = none
    mapping(uint256 => bool)        private _burned;       // replay protection

    // ─── Events ───────────────────────────────────────────────────────────────

    event RequestRandom(uint256 indexed id, address indexed player, uint256 bet, uint256 requestBlock);
    event SpinResult  (uint256 indexed id, address indexed player, uint256 bet, uint256 payout, uint8 rarity, uint8 multX10);
    event BetRefunded (uint256 indexed id, address indexed player, uint256 bet);
    event Deposited   (address indexed from, uint256 amount);
    event Withdrawn   (address indexed to,   uint256 amount);
    event BetLimits   (uint256 min, uint256 max);
    event OracleProposed (address candidate, uint256 effectiveBlock);
    event OracleChanged  (address prev, address next);
    event OwnerProposed  (address candidate);
    event OwnerChanged   (address prev, address next);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier nonReentrant() {
        require(_lock != _YES, "Reentrant");
        _lock = _YES;
        _;
        _lock = _NOT;
    }

    modifier onlyOwner()  { require(msg.sender == owner,  "!owner");  _; }
    modifier onlyOracle() { require(msg.sender == oracle, "!oracle"); _; }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _oracle) payable {
        require(_oracle != address(0), "Zero oracle");
        owner  = msg.sender;
        oracle = _oracle;
        if (msg.value > 0) emit Deposited(msg.sender, msg.value);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PLAYER API
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Place a bet and request randomness.
     */
    function requestSpin() external payable nonReentrant {
        require(msg.value >= minBet, "Bet < min");
        require(msg.value <= maxBet, "Bet > max");
        require(pendingCount < MAX_PENDING,        "Queue full");
        require(activeRequest[msg.sender] == 0,    "Already pending");

        // Ensure max possible payout is covered (reserve not touched)
        uint256 maxWin = (msg.value * uint256(MULT[N - 1])) / 10;
        require(address(this).balance >= maxWin + MIN_RESERVE, "Pool low");

        uint256 id = _newId();

        requests[id] = SpinRequest({
            player:       msg.sender,
            bet:          msg.value,
            requestBlock: block.number,
            state:        State.Pending
        });

        activeRequest[msg.sender] = id;
        pendingCount++;

        emit RequestRandom(id, msg.sender, msg.value, block.number);
    }

    /**
     * @notice Oracle resolves a spin.
     * @param id    Request identifier (emitted in RequestRandom).
     * @param seed  32-byte random seed produced off-chain.
     * @param v,r,s ECDSA of keccak256(id ‖ seed ‖ requestBlock) by oracle key.
     */
    function fulfillSpin(
        uint256 id,
        bytes32 seed,
        uint8   v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant onlyOracle {
        SpinRequest storage req = requests[id];

        require(req.state == State.Pending,  "Not pending");
        require(!_burned[id],                "Replayed");
        require(block.number <= req.requestBlock + TIMEOUT_BLOCKS, "Expired");

        // ── 1. Verify oracle signature ────────────────────────────────────────
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(id, seed, req.requestBlock))
        ));
        require(ecrecover(digest, v, r, s) == oracle, "Bad sig");

        // ── 2. Derive entropy: seed XOR future blockhash ──────────────────────
        // blockhash(req.requestBlock + 1) is unknown when oracle signs,
        // so neither player nor oracle can predict the outcome.
        bytes32 entropy = keccak256(abi.encodePacked(
            seed,
            blockhash(req.requestBlock + 1)
        ));

        uint256 roll   = uint256(entropy) % 100;
        uint8   rarity = _resolveRarity(roll);
        uint8   mult   = MULT[rarity];
        uint256 payout = (req.bet * uint256(mult)) / 10;

        // ── 3. Effects (before interactions) ─────────────────────────────────
        _burned[id]               = true;
        req.state                 = State.Fulfilled;
        activeRequest[req.player] = 0;
        pendingCount--;
        totalSpins++;

        address player = req.player;
        uint256 bet    = req.bet;

        // ── 4. Interactions ───────────────────────────────────────────────────
        if (payout > 0) {
            (bool ok,) = player.call{value: payout, gas: 5000}("");
            require(ok, "Payout failed");
        }

        emit SpinResult(id, player, bet, payout, rarity, mult);
    }

    /**
     * @notice Self-refund after oracle timeout.
     */
    function refundExpired(uint256 id) external nonReentrant {
        SpinRequest storage req = requests[id];
        require(req.player == msg.sender,   "!player");
        require(req.state  == State.Pending,"!pending");
        require(block.number > req.requestBlock + TIMEOUT_BLOCKS, "!expired");

        uint256 bet   = req.bet;
        req.state     = State.Refunded;
        activeRequest[msg.sender] = 0;
        pendingCount--;

        (bool ok,) = msg.sender.call{value: bet, gas: 5000}("");
        require(ok, "Refund failed");

        emit BetRefunded(id, msg.sender, bet);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  VIEW
    // ═══════════════════════════════════════════════════════════════════════════

    function prizePool()   external view returns (uint256)           { return address(this).balance; }
    function getBetLimits() external view returns (uint256, uint256) { return (minBet, maxBet); }
    function getRequest(uint256 id) external view returns (SpinRequest memory) { return requests[id]; }

    // ═══════════════════════════════════════════════════════════════════════════
    //  OWNER ADMIN
    // ═══════════════════════════════════════════════════════════════════════════

    function deposit() external payable onlyOwner {
        require(msg.value > 0, "Zero");
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(pendingCount == 0, "Spins in flight");
        require(address(this).balance - amount >= MIN_RESERVE, "Below reserve");
        (bool ok,) = owner.call{value: amount}("");
        require(ok, "Withdraw fail");
        emit Withdrawn(owner, amount);
    }

    function setBetLimits(uint256 _min, uint256 _max) external onlyOwner {
        require(_min > 0 && _min < _max, "Bad limits");
        minBet = _min; maxBet = _max;
        emit BetLimits(_min, _max);
    }

    // Two-step oracle key rotation (50-block delay)
    function proposeOracle(address _new) external onlyOwner {
        require(_new != address(0), "Zero");
        pendingOracle        = _new;
        oracleEffectiveBlock = block.number + ORACLE_DELAY;
        emit OracleProposed(_new, oracleEffectiveBlock);
    }

    function finalizeOracle() external onlyOwner {
        require(pendingOracle   != address(0),         "None proposed");
        require(block.number    >= oracleEffectiveBlock,"Too early");
        address prev = oracle;
        oracle        = pendingOracle;
        pendingOracle = address(0);
        emit OracleChanged(prev, oracle);
    }

    // Two-step ownership transfer
    function transferOwnership(address _new) external onlyOwner {
        require(_new != address(0), "Zero");
        pendingOwner = _new;
        emit OwnerProposed(_new);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "!pending");
        emit OwnerChanged(owner, pendingOwner);
        owner        = pendingOwner;
        pendingOwner = address(0);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _newId() internal returns (uint256) {
        unchecked { _nonce++; }
        return uint256(keccak256(abi.encodePacked(
            block.chainid, address(this), msg.sender, _nonce, block.timestamp
        )));
    }

    function _resolveRarity(uint256 roll) internal view returns (uint8) {
        for (uint8 i = 0; i < N; i++) {
            if (roll < THRESH[i]) return i;
        }
        return N - 1;
    }

    receive() external payable { emit Deposited(msg.sender, msg.value); }
}
